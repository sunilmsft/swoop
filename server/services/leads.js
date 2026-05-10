const db = require('../db/database');
const { sendSMS } = require('./twilio');

/**
 * Handle a missed call:
 * 1. Find or create the lead
 * 2. Send auto-reply text
 * 3. Schedule follow-up sequence (day 1, day 3, day 7)
 */
async function handleMissedCall(businessId, callerPhone) {
  const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(businessId);
  if (!business) throw new Error(`Business ${businessId} not found`);

  // Find existing lead or create new one
  let lead = db.prepare(
    'SELECT * FROM leads WHERE business_id = ? AND caller_phone = ? ORDER BY created_at DESC LIMIT 1'
  ).get(businessId, callerPhone);

  if (!lead) {
    const result = db.prepare(
      'INSERT INTO leads (business_id, caller_phone, call_status) VALUES (?, ?, ?)'
    ).run(businessId, callerPhone, 'missed');
    lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid);
  } else {
    // Update existing lead with new missed call
    db.prepare('UPDATE leads SET call_status = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run('missed', lead.id);
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
 */
async function handleInboundSMS(businessId, callerPhone, body) {
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

  // Update lead status — they replied, they're engaged
  db.prepare('UPDATE leads SET lead_status = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run('engaged', lead.id);

  // Cancel pending follow-ups since they replied
  db.prepare('UPDATE follow_ups SET status = ? WHERE lead_id = ? AND status = ?')
    .run('cancelled', lead.id, 'pending');

  return lead;
}

/**
 * Send a Google review request after a job is done
 */
async function sendReviewRequest(leadId) {
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
  if (!lead) throw new Error(`Lead ${leadId} not found`);

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
    'SELECT f.*, l.caller_phone, l.lead_status FROM follow_ups f JOIN leads l ON f.lead_id = l.id WHERE f.status = ? AND f.scheduled_for <= datetime(\'now\')'
  ).all('pending');

  let sent = 0;
  let skipped = 0;

  for (const fu of dueFollowUps) {
    // Don't follow up if lead already engaged or converted
    if (['engaged', 'converted', 'review_sent'].includes(fu.lead_status)) {
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
};
