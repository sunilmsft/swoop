const db = require('../db/database');
const { sendSMS } = require('./twilio');
const { generateReply, generatePostHandoffReply, buildHandoffSummary, extractName } = require('./ai-agent');

const STOP_KEYWORDS = new Set(['stop', 'stopall', 'unsubscribe', 'cancel', 'end', 'quit']);
const START_KEYWORDS = new Set(['start', 'unstop']);
const HELP_KEYWORDS = new Set(['help']);

function getKeywordIntent(body) {
  const token = (body || '').trim().toLowerCase();
  if (STOP_KEYWORDS.has(token)) return 'stop';
  if (START_KEYWORDS.has(token)) return 'start';
  if (HELP_KEYWORDS.has(token)) return 'help';
  return null;
}

// Per docs/EMERGENCY_ESCALATION_POLICY.md — genuine, immediate danger to life or property.
const EMERGENCY_PATTERN = /gas smell|smell(?:s|ing)? (?:of )?gas|gas leak|carbon monoxide|\bco\b alarm|co detector|sparking (?:outlet|wire)|spark(?:s|ing)? from|visible smoke|smoke coming|smells like smoke|on fire|caught fire|fire risk|active flooding|flooding.*(?:electrical|outlet|panel)|(?:electrical|outlet|panel).*flooding|sewage backup|sewage.*(?:health|hazard)/;

// Costly or painful if delayed, not life-threatening.
const URGENT_PATTERN = /no heat\b|no a\/?c\b|no air ?conditioning|no hot water|\bleak(?:ing|s)?\b|locked out|power outage|no power\b|emergency|urgent|asap|right now/;

// Hardcoded, pre-approved — never AI-generated or paraphrased. {business_name} is substituted at send time.
const EMERGENCY_RESPONSE_TEMPLATE = "That sounds like it could be a safety emergency. Please call 911 right away — if you smell gas, get to fresh air first, then call 911 or your gas company's emergency line. {business_name} will follow up once you're safe.";

// After this long without any activity, a handed-off lead is treated as a fresh conversation again
// instead of staying silently stuck — a customer texting back days later shouldn't be met with the
// post-handoff ack forever.
const HANDOFF_RESET_HOURS = 24;

/**
 * Classify inbound text into an urgency tier: 'emergency' | 'urgent' | null (routine).
 * Pure text classification — does not know about the business's emergency-tier flag.
 */
function inferUrgencyLevel(text) {
  const value = String(text || '').toLowerCase();
  if (!value) return null;

  if (EMERGENCY_PATTERN.test(value)) return 'emergency';
  if (URGENT_PATTERN.test(value)) return 'urgent';
  return null;
}

/**
 * Resolve the tier that should actually drive behavior for this business.
 * A detected emergency downgrades to 'urgent' (never dropped) when the business
 * hasn't been onboarded as emergency-tier — per docs/EMERGENCY_ESCALATION_POLICY.md,
 * this is gated on the business record, not a hardcoded trade-name check.
 */
function resolveUrgencyTier(text, business) {
  const detected = inferUrgencyLevel(text);
  if (detected === 'emergency' && !business.emergency_tier_enabled) {
    return 'urgent';
  }
  return detected;
}

function formatOwnerNotification(tier, business, summaryText) {
  if (tier === 'emergency') {
    return `🚨 EMERGENCY LEAD — ${business.name}\nCaller was told to call 911.\n${summaryText}`;
  }
  if (tier === 'urgent') {
    return `🟡 URGENT lead — ${business.name}\n${summaryText}`;
  }
  return `New lead needs attention — ${business.name}\n${summaryText}`;
}

/**
 * Text the business owner a lead notification, formatted per urgency tier.
 * Best-effort: logs and skips rather than throwing if there's no number to reach.
 */
async function notifyOwner(business, tier, summaryText) {
  if (!business.forward_phone) {
    console.log(`⚠️ No forward_phone on file for ${business.name} — skipping owner notification`);
    return;
  }

  try {
    await sendSMS(business.forward_phone, formatOwnerNotification(tier, business, summaryText));
  } catch (err) {
    console.error(`Failed to send owner notification (${tier}) for ${business.name}:`, err.message);
  }
}

function inferLocationHint(text) {
  const value = String(text || '').trim();
  if (!value) return null;

  const prepped = value.replace(/[\n\r]+/g, ' ');
  const byPhrase = prepped.match(/\b(?:in|at|near|around|from|live in|live at)\s+([A-Za-z][A-Za-z\s'-]{1,40})/i);
  if (byPhrase && byPhrase[1]) {
    return byPhrase[1].trim().replace(/[.,!?;:]+$/, '');
  }

  return null;
}

function buildFallbackIntakeQuestion(business, lead) {
  const owner = business.owner_name || 'our team';
  const hasName = !!lead.caller_name;
  const hasLocation = !!lead.location_hint;
  const urgency = (lead.urgency_level || 'normal').toLowerCase();

  if (!hasName && !hasLocation) {
    return `${business.name}: Thanks for the details. What name should we put on this request, and what city is the job in?`;
  }

  if (!hasName) {
    return `${business.name}: Thanks. Before ${owner} calls, what name should we use for this request?`;
  }

  if (!hasLocation) {
    return `${business.name}: Got it, ${lead.caller_name}. What city is the job in?`;
  }

  if (urgency !== 'urgent' && urgency !== 'emergency') {
    return `${business.name}: Thanks ${lead.caller_name}. Is this urgent right now, or can ${owner} call you later today?`;
  }

  return `${business.name}: Thanks ${lead.caller_name}. We have your details and ${owner} will reach out shortly. Is this the best number to reach you?`;
}

// Default consent basis: the caller heard Swoop's verbal TwiML disclosure before the missed-call
// SMS (the direct_dial path, where the disclosure plays on every inbound call before the dial).
const IVR_DISCLOSURE_CONSENT = {
  consentMethod: 'verbal_ivr',
  consentSource: 'inbound call to published business phone number',
  consentScriptVersion: '2026-06-23-v1',
  consentNotes: 'Caller heard the TwiML verbal disclosure before the missed-call SMS; consent metadata is stored on the lead record with the outbound confirmation text.',
};

// carrier_forward consent basis: no verbal disclosure was played on this call — it arrived at
// Twilio already forwarded by the carrier after the business's own line didn't answer, so the
// caller never had a Swoop-controlled call leg to disclose anything on. This only records the
// factual basis (an inbound call to the business's own published number); it is not a compliance
// determination — confirm with legal/compliance before relying on this consent basis in production.
const CARRIER_FORWARD_CONSENT = {
  consentMethod: 'carrier_forwarded_call',
  consentSource: "inbound call to business's own published number, forwarded by carrier after no-answer",
  consentScriptVersion: null,
  consentNotes: "No verbal IVR disclosure was played on this call — it arrived already carrier-forwarded from the business's published number after the owner did not answer. Consent basis is the caller's inbound call to the business's own published number, not a Swoop-read disclosure.",
};

/**
 * Handle a missed call:
 * 1. Find or create the lead
 * 2. Send auto-reply text
 * 3. Schedule follow-up sequence (day 1, day 3, day 7)
 *
 * consentContext lets callers override the recorded consent basis (see IVR_DISCLOSURE_CONSENT vs.
 * CARRIER_FORWARD_CONSENT above) — defaults to the IVR-disclosure basis used by the direct_dial path.
 */
async function handleMissedCall(businessId, callerPhone, consentContext = IVR_DISCLOSURE_CONSENT) {
  const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(businessId);
  if (!business) throw new Error(`Business ${businessId} not found`);

  const { consentMethod, consentSource, consentScriptVersion, consentNotes } = consentContext;

  // Find existing lead or create new one
  let lead = db.prepare(
    'SELECT * FROM leads WHERE business_id = ? AND caller_phone = ? ORDER BY created_at DESC LIMIT 1'
  ).get(businessId, callerPhone);

  if (!lead) {
    const result = db.prepare(
      'INSERT INTO leads (business_id, caller_phone, call_status, consent_method, consent_source, consent_recorded_at, consent_script_version, consent_notes) VALUES (?, ?, ?, ?, ?, datetime(\'now\'), ?, ?)'
    ).run(businessId, callerPhone, 'missed', consentMethod, consentSource, consentScriptVersion, consentNotes);
    lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid);
  } else {
    // Update existing lead with new missed call
    db.prepare(
      'UPDATE leads SET call_status = ?, consent_method = COALESCE(consent_method, ?), consent_source = COALESCE(consent_source, ?), consent_recorded_at = COALESCE(consent_recorded_at, datetime(\'now\')), consent_script_version = COALESCE(consent_script_version, ?), consent_notes = COALESCE(consent_notes, ?), updated_at = datetime(\'now\') WHERE id = ?'
    ).run('missed', consentMethod, consentSource, consentScriptVersion, consentNotes, lead.id);
  }

  // Respect opt-out state for repeat callers.
  if (lead.sms_opt_out) {
    return lead;
  }

  // Send instant auto-reply
  const replyBody = business.auto_reply_message
    .replace('{business_name}', business.name);

  const twilioMsg = await sendSMS(callerPhone, replyBody);

  // Log the outbound message
  db.prepare(
    'INSERT INTO messages (lead_id, direction, body, twilio_sid) VALUES (?, ?, ?, ?)'
  ).run(lead.id, 'outbound', replyBody, twilioMsg.sid);

  // Schedule follow-up sequence
  scheduleFollowUps(lead.id, business);

  return lead;
}

/**
 * Schedule the 3-touch follow-up sequence
 */
function scheduleFollowUps(leadId, business) {
  const templates = [
    {
      delayDays: 1,
      message: `Still need help? ${business.name} has openings tomorrow. Just reply here to book.`,
    },
    {
      delayDays: 3,
      message: `Just checking in — want us to schedule a visit? Reply YES and we'll find a time that works.`,
    },
    {
      delayDays: 7,
      message: `Last chance! We'd love to help. Reply anytime and we'll get you on the calendar. — ${business.name}`,
    },
  ];

  const insert = db.prepare(
    'INSERT INTO follow_ups (lead_id, scheduled_for, message_template) VALUES (?, datetime(\'now\', ? || \' days\'), ?)'
  );

  for (const t of templates) {
    insert.run(leadId, `+${t.delayDays}`, t.message);
  }
}

/**
 * Handle an inbound SMS from a lead
 * If AI is enabled, generate an AI reply (up to max_ai_turns), then hand off.
 */
async function handleInboundSMS(businessId, callerPhone, body) {
  const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(businessId);

  // Find existing lead
  let lead = db.prepare(
    'SELECT * FROM leads WHERE business_id = ? AND caller_phone = ? ORDER BY created_at DESC LIMIT 1'
  ).get(businessId, callerPhone);

  if (!lead) {
    // New lead via text (didn't come from a missed call)
    const result = db.prepare(
      'INSERT INTO leads (business_id, caller_phone, call_status, lead_status) VALUES (?, ?, ?, ?)'
    ).run(businessId, callerPhone, 'text_in', 'new');
    lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid);
  }

  // Log the inbound message
  db.prepare(
    'INSERT INTO messages (lead_id, direction, body) VALUES (?, ?, ?)'
  ).run(lead.id, 'inbound', body);

  const intent = getKeywordIntent(body);

  if (intent === 'stop') {
    db.prepare('UPDATE leads SET sms_opt_out = 1, opt_out_at = datetime(\'now\'), updated_at = datetime(\'now\') WHERE id = ?')
      .run(lead.id);
    db.prepare('UPDATE follow_ups SET status = ? WHERE lead_id = ? AND status = ?')
      .run('cancelled', lead.id, 'pending');

    const confirmation = `You are unsubscribed from ${business.name} texts. Reply START to opt back in.`;
    const twilioMsg = await sendSMS(callerPhone, confirmation);
    db.prepare(
      'INSERT INTO messages (lead_id, direction, body, twilio_sid) VALUES (?, ?, ?, ?)'
    ).run(lead.id, 'outbound', confirmation, twilioMsg.sid);

    return db.prepare('SELECT * FROM leads WHERE id = ?').get(lead.id);
  }

  if (intent === 'start') {
    db.prepare('UPDATE leads SET sms_opt_out = 0, opt_out_at = NULL, updated_at = datetime(\'now\') WHERE id = ?')
      .run(lead.id);

    const confirmation = `You are re-subscribed to ${business.name} texts.`;
    const twilioMsg = await sendSMS(callerPhone, confirmation);
    db.prepare(
      'INSERT INTO messages (lead_id, direction, body, twilio_sid) VALUES (?, ?, ?, ?)'
    ).run(lead.id, 'outbound', confirmation, twilioMsg.sid);

    return db.prepare('SELECT * FROM leads WHERE id = ?').get(lead.id);
  }

  if (intent === 'help') {
    const help = `${business.name}: text-back service. Reply STOP to unsubscribe, START to re-subscribe. Privacy: welcomematdigital.com/swoop/privacy.html. Call us for urgent help.`;
    const twilioMsg = await sendSMS(callerPhone, help);
    db.prepare(
      'INSERT INTO messages (lead_id, direction, body, twilio_sid) VALUES (?, ?, ?, ?)'
    ).run(lead.id, 'outbound', help, twilioMsg.sid);
    db.prepare('UPDATE leads SET updated_at = datetime(\'now\') WHERE id = ?').run(lead.id);
    return db.prepare('SELECT * FROM leads WHERE id = ?').get(lead.id);
  }

  if (lead.sms_opt_out) {
    db.prepare('UPDATE leads SET updated_at = datetime(\'now\') WHERE id = ?').run(lead.id);
    return lead;
  }

  const inferredLocation = inferLocationHint(body);
  const priorUrgencyLevel = lead.urgency_level;
  const tier = resolveUrgencyTier(body, business);
  // A lead already escalated (handed off, or already flagged needs_attention) stays escalated
  // through a routine follow-up text — only an emergency/urgent tier can (re-)set needs_attention;
  // a routine message is never allowed to downgrade it back to engaged.
  const alreadyEscalated = !!lead.ai_handoff_done || lead.lead_status === 'needs_attention';
  const statusFromUrgency = (tier === 'emergency' || tier === 'urgent')
    ? 'needs_attention'
    : (alreadyEscalated ? 'needs_attention' : 'engaged');

  // Update lead status — they replied, they're engaged
  db.prepare(
    'UPDATE leads SET lead_status = ?, location_hint = COALESCE(?, location_hint), urgency_level = COALESCE(?, urgency_level), updated_at = datetime(\'now\') WHERE id = ?'
  ).run(statusFromUrgency, inferredLocation, tier, lead.id);

  // Cancel pending follow-ups since they replied
  db.prepare('UPDATE follow_ups SET status = ? WHERE lead_id = ? AND status = ?')
    .run('cancelled', lead.id, 'pending');

  // --- Emergency tier: hardcoded safety response only, no AI qualifying, immediate owner alert ---
  if (tier === 'emergency') {
    const emergencyReply = EMERGENCY_RESPONSE_TEMPLATE.replace('{business_name}', business.name);
    let twilioSid = null;
    try {
      const twilioMsg = await sendSMS(callerPhone, emergencyReply);
      twilioSid = twilioMsg.sid;
    } catch (err) {
      console.log(`⚠️ Emergency response SMS send failed: ${err.message}`);
    }

    db.prepare(
      'INSERT INTO messages (lead_id, direction, body, twilio_sid) VALUES (?, ?, ?, ?)'
    ).run(lead.id, 'outbound', emergencyReply, twilioSid);

    db.prepare('UPDATE leads SET ai_handoff_done = 1, updated_at = datetime(\'now\') WHERE id = ?').run(lead.id);

    await notifyOwner(business, 'emergency', `Caller said: "${body}"`);

    return db.prepare('SELECT * FROM leads WHERE id = ?').get(lead.id);
  }

  // First time this lead crosses into 'urgent', alert the owner immediately — don't wait for handoff.
  if (tier === 'urgent' && priorUrgencyLevel !== 'urgent' && priorUrgencyLevel !== 'emergency') {
    await notifyOwner(business, 'urgent', `Caller said: "${body}"`);
  }

  // A handed-off lead that's gone quiet for a while is treated as a fresh conversation again,
  // rather than staying stuck on the post-handoff ack indefinitely. Uses lead.updated_at from the
  // original SELECT at the top of the function (pre-dates any UPDATEs run above).
  if (lead.ai_handoff_done) {
    const lastUpdatedUtc = new Date(`${lead.updated_at.replace(' ', 'T')}Z`);
    const hoursSinceUpdate = (Date.now() - lastUpdatedUtc.getTime()) / (1000 * 60 * 60);
    if (hoursSinceUpdate > HANDOFF_RESET_HOURS) {
      db.prepare(
        'UPDATE leads SET ai_turn_count = 0, ai_handoff_done = 0, updated_at = datetime(\'now\') WHERE id = ?'
      ).run(lead.id);
      lead.ai_turn_count = 0;
      lead.ai_handoff_done = 0;
      console.log(`🔄 Lead ${lead.id}: handoff auto-reset after ${hoursSinceUpdate.toFixed(1)}h of inactivity`);
    }
  }

  // --- AI Reply Agent ---
  if (business && !lead.ai_handoff_done && business.ai_enabled) {
    const aiReply = await generateReply(business, lead, body);
    const fallbackReply = buildFallbackIntakeQuestion(business, lead);
    const replyBody = aiReply || fallbackReply;

    if (!aiReply) {
      console.log('🤖 AI agent unavailable, using fallback response');
    }

    // Send the generated or fallback reply
    let twilioSid = null;
    try {
      const twilioMsg = await sendSMS(callerPhone, replyBody);
      twilioSid = twilioMsg.sid;
    } catch (err) {
      console.log(`⚠️ Auto-reply SMS send failed: ${err.message}`);
    }

    // Log the outbound message (even if send failed — we still want the record)
    db.prepare(
      'INSERT INTO messages (lead_id, direction, body, twilio_sid) VALUES (?, ?, ?, ?)'
    ).run(lead.id, 'outbound', replyBody, twilioSid);

    // Increment turn count
    const newTurnCount = (lead.ai_turn_count || 0) + 1;
    const maxTurns = business.max_ai_turns || 3;
    const ownerCallbackIntent = /have\s+\w+\s+reach\s+out|reach\s+out\s+shortly|call\s+you\s+shortly|owner\s+will\s+reach\s+out/i.test(replyBody);
    const isHandoff = ownerCallbackIntent || newTurnCount >= maxTurns;
    const statusAfterReply = (isHandoff || tier === 'emergency' || tier === 'urgent') ? 'needs_attention' : 'engaged';

    db.prepare(
      'UPDATE leads SET ai_turn_count = ?, ai_handoff_done = ?, lead_status = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).run(newTurnCount, isHandoff ? 1 : 0, statusAfterReply, lead.id);

    if (isHandoff) {
      // Build summary for the business owner
      const allMessages = db.prepare(
        'SELECT direction, body FROM messages WHERE lead_id = ? ORDER BY sent_at ASC'
      ).all(lead.id);
      const summary = buildHandoffSummary(lead, allMessages);

      db.prepare('UPDATE leads SET notes = ? WHERE id = ?').run(summary, lead.id);
      console.log(`🤝 AI handoff complete for lead ${lead.id}: ${summary}`);
      await notifyOwner(business, tier, summary);
    }
  } else if (business && lead.ai_handoff_done) {
    // Already handed off before this message. Try a quick factual answer first; fall back to the
    // static ack if AI is unavailable. Either way: doesn't touch turn count or handoff state, and
    // doesn't re-run emergency/urgent tier logic (already handled earlier in this function).
    const staticAck = `Thanks — I'll make sure ${business.owner_name || 'the owner'} sees that before reaching out.`;
    const aiReply = await generatePostHandoffReply(business, lead, body);
    const replyBody = aiReply || staticAck;

    let twilioSid = null;
    try {
      const twilioMsg = await sendSMS(callerPhone, replyBody);
      twilioSid = twilioMsg.sid;
    } catch (err) {
      console.log(`⚠️ Post-handoff reply SMS send failed: ${err.message}`);
    }

    db.prepare(
      'INSERT INTO messages (lead_id, direction, body, twilio_sid) VALUES (?, ?, ?, ?)'
    ).run(lead.id, 'outbound', replyBody, twilioSid);
  }

  // --- Auto-extract customer name from conversation ---
  if (!lead.caller_name) {
    const allMsgs = db.prepare(
      'SELECT direction, body FROM messages WHERE lead_id = ? ORDER BY sent_at ASC'
    ).all(lead.id);
    const name = await extractName(allMsgs);
    if (name) {
      db.prepare('UPDATE leads SET caller_name = ? WHERE id = ?').run(name, lead.id);
      console.log(`📛 Auto-extracted name for lead ${lead.id}: ${name}`);
    }
  }

  return lead;
}

/**
 * Send a Google review request after a job is done
 */
async function sendReviewRequest(leadId) {
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
  if (!lead) throw new Error(`Lead ${leadId} not found`);
  if (lead.sms_opt_out) throw new Error('Lead has opted out of SMS');

  const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(lead.business_id);

  let body = `Thanks for choosing ${business.name}! We'd really appreciate a quick Google review — it helps other neighbors find us. ⭐`;
  if (business.review_link) {
    body += `\n${business.review_link}`;
  }

  const twilioMsg = await sendSMS(lead.caller_phone, body);

  db.prepare(
    'INSERT INTO messages (lead_id, direction, body, twilio_sid) VALUES (?, ?, ?, ?)'
  ).run(lead.id, 'outbound', body, twilioMsg.sid);

  db.prepare('UPDATE leads SET lead_status = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run('review_sent', lead.id);

  return { success: true };
}

/**
 * Process all due follow-ups (called by cron job)
 */
async function processDueFollowUps() {
  const dueFollowUps = db.prepare(
    'SELECT f.*, l.caller_phone, l.lead_status, l.sms_opt_out FROM follow_ups f JOIN leads l ON f.lead_id = l.id WHERE f.status = ? AND f.scheduled_for <= datetime(\'now\')'
  ).all('pending');

  let sent = 0;
  let skipped = 0;

  for (const fu of dueFollowUps) {
    // Don't follow up if lead already engaged or converted
    if (fu.sms_opt_out || ['engaged', 'converted', 'review_sent'].includes(fu.lead_status)) {
      db.prepare('UPDATE follow_ups SET status = ? WHERE id = ?').run('cancelled', fu.id);
      skipped++;
      continue;
    }

    try {
      const twilioMsg = await sendSMS(fu.caller_phone, fu.message_template);

      db.prepare(
        'INSERT INTO messages (lead_id, direction, body, twilio_sid) VALUES (?, ?, ?, ?)'
      ).run(fu.lead_id, 'outbound', fu.message_template, twilioMsg.sid);

      db.prepare('UPDATE follow_ups SET status = ?, sent_at = datetime(\'now\') WHERE id = ?')
        .run('sent', fu.id);

      sent++;
    } catch (err) {
      console.error(`Failed to send follow-up ${fu.id}:`, err.message);
    }
  }

  return { sent, skipped, total: dueFollowUps.length };
}

module.exports = {
  handleMissedCall,
  handleInboundSMS,
  sendReviewRequest,
  processDueFollowUps,
  CARRIER_FORWARD_CONSENT,
};
