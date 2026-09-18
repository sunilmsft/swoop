const OpenAI = require('openai');
const db = require('../db/database');

let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Explicit machine-readable handoff signal. Detecting "is this a handoff reply" by pattern-matching
// arbitrary phrasing (e.g. "owner will reach out") is unreliable — real replies use wording that
// doesn't match any hardcoded phrase. Instead, the model is instructed to emit this exact token on
// its own line whenever it's ending the conversation for an owner follow-up; leads.js checks for its
// presence/absence as the sole source of truth for isHandoff, then strips it before the customer sees it.
const HANDOFF_TOKEN = '[[HANDOFF]]';

/**
 * Build a system prompt from the business profile.
 * This grounds the AI agent in the business's identity, services, and rules.
 */
function buildSystemPrompt(business, lead = null) {
  let prompt = `You are a friendly text-message assistant for ${business.name}.`;

  if (business.owner_name) {
    prompt += ` The owner's name is ${business.owner_name}.`;
  }

  if (business.description) {
    prompt += `\n\nABOUT THE BUSINESS:\n${business.description}`;
  }

  if (business.services) {
    prompt += `\n\nSERVICES OFFERED:\n${business.services}`;
  }

  if (business.pricing) {
    prompt += `\n\nPRICING:\n${business.pricing}`;
  }

  if (business.service_area) {
    prompt += `\n\nSERVICE AREA: ${business.service_area}`;
  }

  if (business.hours) {
    prompt += `\n\nBUSINESS HOURS: ${business.hours}`;
  }

  if (business.emergency_policy) {
    prompt += `\n\nEMERGENCY/AFTER-HOURS: ${business.emergency_policy}`;
  }

  if (business.faqs) {
    prompt += `\n\nFREQUENTLY ASKED QUESTIONS:\n${business.faqs}`;
  }

  // Tone
  const tone = business.tone || 'friendly';
  prompt += `\n\nTONE: Be ${tone}. Match the style a small business owner would use when texting a customer.`;

  // Rules
  prompt += `\n\nRULES:
- Keep responses SHORT — 1-3 sentences max. This is SMS, not email.
- Be warm and helpful but don't over-promise.
- Never make up information not provided above.
- If you don't know the answer, say "${business.owner_name || 'the owner'} can give you more details on that."
- Never badmouth competitors.
- Never sign up the customer for marketing, newsletters, or anything they didn't ask for. They consented to a service reply only.`;

  if (business.never_say) {
    prompt += `\n- NEVER SAY OR DO: ${business.never_say}`;
  }

  prompt += `\n\nYOUR GOAL: Acknowledge the customer's need, ask one qualifying question (like location, timeline, or scope), then confirm you'll have ${business.owner_name || 'someone'} reach out to them.`;

  prompt += `\n\nHANDOFF SIGNAL: Whenever your reply ends the conversation because ${business.owner_name || 'the owner'} will personally follow up with the customer — whether because you now have enough info (name, location, and the service need) to hand off early, or because you were explicitly told this is the final turn — end your reply with a new line containing EXACTLY the token ${HANDOFF_TOKEN} and nothing else on that line. This is a system signal, not something the customer should ever see: never mention it, explain it, or refer to it in any way. If your reply does NOT end the conversation for an owner follow-up, do not include this token at all.`;

  const knownName = lead && lead.caller_name ? lead.caller_name : null;
  const knownLocation = lead && lead.location_hint ? lead.location_hint : null;
  const knownUrgency = lead && lead.urgency_level ? lead.urgency_level : null;
  prompt += `\n\nKNOWN CUSTOMER CONTEXT:
- Name: ${knownName || 'UNKNOWN'}
- Location: ${knownLocation || 'UNKNOWN'}
- Urgency: ${knownUrgency || 'UNKNOWN'}`;

  prompt += `\n\nFRONT DESK INTAKE FLOW (SMS):
1) Name: ask for name if unknown.
2) Service need: clarify the actual issue/job.
3) Location: ask city/location if unknown.
4) Urgency: ask whether this is urgent right now.
5) Callback timing: ask best callback window.
6) Confirm contact: confirm this phone is best number.

Rules for the flow:
- If BOTH name and city are unknown, always ask for them together in one short message (e.g. "What's your name and what city are you in?") — never split them into two separate turns.
- If only one of name or city is unknown, ask for just that one.
- Do not repeat fields already known.
- If customer indicates emergency/urgent risk, prioritize urgency and escalate fast.
- Once name + location + service need are known, you may hand off without exhausting all questions.`;

  const missingName = !lead || !lead.caller_name;
  const missingLocation = !lead || !lead.location_hint;
  if (missingName && missingLocation) {
    prompt += `\n\nCAPTURE REQUIREMENT: Name and city are both unknown — your next message MUST ask for both together (e.g. "What's your name and what city are you in?"), not one at a time.`;
  } else if (missingName) {
    prompt += `\n\nCAPTURE REQUIREMENT: Prioritize collecting their name before ending the conversation.`;
  } else if (missingLocation) {
    prompt += `\n\nCAPTURE REQUIREMENT: Prioritize collecting their city/location before ending the conversation.`;
  }

  return prompt;
}

/**
 * Generate an AI reply for an inbound SMS.
 *
 * @param {object} business - The business record
 * @param {object} lead - The lead record (with ai_turn_count)
 * @param {string} inboundMessage - The customer's latest text
 * @returns {string|null} The AI reply text, or null if AI is disabled/unavailable
 */
async function generateReply(business, lead, inboundMessage) {
  if (!openai) {
    console.log('🤖 AI agent: OpenAI not configured (no OPENAI_API_KEY)');
    return null;
  }

  if (!business.ai_enabled) {
    console.log('🤖 AI agent: Disabled for this business');
    return null;
  }

  const maxTurns = business.max_ai_turns || 3;
  const currentTurn = (lead.ai_turn_count || 0) + 1; // This reply will be the next turn

  // Check if we've already handed off
  if (lead.ai_handoff_done) {
    console.log('🤖 AI agent: Handoff already done, skipping AI reply');
    return null;
  }

  // The single most-repeated, most-important step in the flow — don't trust the LLM to follow
  // the "ask both together" instruction reliably (it doesn't, in practice). On the very first
  // turn, if both are unknown, always ask for them together with a fixed template instead of
  // calling OpenAI at all.
  const missingName = !lead.caller_name;
  const missingLocation = !lead.location_hint;
  const isFirstTurn = (lead.ai_turn_count || 0) === 0;
  if (missingName && missingLocation && isFirstTurn) {
    console.log('🤖 AI agent: name + city both unknown on first turn — using deterministic ask');
    return "Got it — what's your name, and what city is this for?";
  }

  // If this is the last turn, append handoff instruction
  const isHandoffTurn = currentTurn >= maxTurns;

  // Load conversation history for context
  const messages = db.prepare(
    'SELECT direction, body FROM messages WHERE lead_id = ? ORDER BY sent_at ASC'
  ).all(lead.id);

  // Build chat messages array
  const chatMessages = [
    { role: 'system', content: buildSystemPrompt(business, lead) },
  ];

  // Add conversation history
  for (const msg of messages) {
    chatMessages.push({
      role: msg.direction === 'inbound' ? 'user' : 'assistant',
      content: msg.body,
    });
  }

  // Add the new inbound message
  chatMessages.push({ role: 'user', content: inboundMessage });

  // If it's handoff turn, add a system instruction
  if (isHandoffTurn) {
    const handoffTime = isAfterHours(business)
      ? (business.handoff_after_hours_msg || 'first thing tomorrow morning')
      : `within ${business.handoff_minutes || 120} minutes`;

    chatMessages.push({
      role: 'system',
      content: `IMPORTANT: This is your final reply. You MUST end this message by telling the customer that ${business.owner_name || 'the owner'} will personally reach out to them ${handoffTime}. Be warm and reassuring. Do NOT ask any more questions. As instructed, end with a new line containing EXACTLY ${HANDOFF_TOKEN} and nothing else — the customer must never see this token.`,
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: chatMessages,
      max_tokens: 160, // SMS-length replies
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) return null;

    console.log(`🤖 AI agent: Turn ${currentTurn}/${maxTurns}${isHandoffTurn ? ' (HANDOFF)' : ''}`);
    return reply;
  } catch (err) {
    console.error('🤖 AI agent error:', err.message);
    return null;
  }
}

/**
 * Build a factual-only system prompt for answering a customer after handoff has already
 * happened. Deliberately excludes the qualifying/intake-flow instructions from
 * buildSystemPrompt — the goal here is to answer from known facts, not keep gathering intake.
 */
function buildPostHandoffSystemPrompt(business) {
  let prompt = `You are a text-message assistant for ${business.name}. This customer's request has already been handed off to the owner for a personal follow-up.`;

  if (business.owner_name) {
    prompt += ` The owner's name is ${business.owner_name}.`;
  }

  if (business.description) {
    prompt += `\n\nABOUT THE BUSINESS:\n${business.description}`;
  }

  if (business.services) {
    prompt += `\n\nSERVICES OFFERED:\n${business.services}`;
  }

  if (business.pricing) {
    prompt += `\n\nPRICING:\n${business.pricing}`;
  }

  if (business.service_area) {
    prompt += `\n\nSERVICE AREA: ${business.service_area}`;
  }

  if (business.hours) {
    prompt += `\n\nBUSINESS HOURS: ${business.hours}`;
  }

  if (business.emergency_policy) {
    prompt += `\n\nEMERGENCY/AFTER-HOURS: ${business.emergency_policy}`;
  }

  if (business.faqs) {
    prompt += `\n\nFREQUENTLY ASKED QUESTIONS:\n${business.faqs}`;
  }

  if (business.forward_phone) {
    prompt += `\n\nOWNER'S DIRECT PHONE: ${business.forward_phone}`;
  }

  prompt += `\n\nRULES:
- Answer the customer's question briefly — 1-2 sentences max, SMS length.
- Use ONLY the facts provided above. Never make up information.
- Do NOT ask any new qualifying question (no asking for their name, location, timeline, etc.) — intake is already complete.
- A "do/can/will you do X" question is an availability check, not a booking request. Resolve it into exactly ONE of these three outcomes — do not blend them or hedge between them:
  1) EXPLICITLY LISTED: X matches something in SERVICES OFFERED, allowing reasonable phrasing/synonyms of that SAME listed item (e.g. "water heater install" matches "water heater installation") but NOT inventing a related-but-different service. Answer with a confident yes stating the matching service (e.g. "Yes, water heater installation is one of our services.").
  2) DIFFERENT TRADE: X is a clearly different trade/category than what ABOUT THE BUSINESS says this business specializes in (e.g. asking a plumbing business about electrical, roofing, or HVAC work). Answer with a confident, polite no (e.g. "That's outside what we do — we focus on residential plumbing.").
  3) UNCERTAIN: everything else — a plausible-sounding request in the same general trade that is NOT explicitly listed in SERVICES OFFERED (e.g. faucet repair, sump pump work, appliance hookups for a plumber whose list doesn't mention them). Do NOT guess yes or no. Say something like "That's worth confirming with ${business.owner_name || 'the owner'} directly — I'll make sure he covers it when he reaches out."
- Outside of case 3 above, only mention that ${business.owner_name || 'the owner'} will follow up if you truly cannot answer the question at all from the facts given.
- If you fully answered the question from the facts above (cases 1 or 2, or any other fact-based question), stop there. Do NOT add "${business.owner_name || 'the owner'} will reach out" or similar as a sign-off — the customer already heard that during handoff, and repeating it on every message is filler that dilutes the real answer and reads as robotic.
- Never promise a specific appointment time, technician, or booking — confirming a fact ("yes we service that") is fine; committing to a job is not.`;

  if (business.never_say) {
    prompt += `\n- NEVER SAY OR DO: ${business.never_say}`;
  }

  return prompt;
}

/**
 * Generate a single lightweight reply to a customer message arriving AFTER handoff has already
 * happened. Answers from known business facts only — no qualifying questions, no intake flow,
 * no conversation history. Does not touch turn/handoff state; the caller owns that.
 *
 * @returns {string|null} The reply text, or null if AI is disabled/unavailable/errors out.
 */
async function generatePostHandoffReply(business, lead, inboundMessage) {
  if (!openai) {
    console.log('🤖 Post-handoff reply: OpenAI not configured (no OPENAI_API_KEY)');
    return null;
  }

  if (!business.ai_enabled) {
    console.log('🤖 Post-handoff reply: Disabled for this business');
    return null;
  }

  const chatMessages = [
    { role: 'system', content: buildPostHandoffSystemPrompt(business) },
    { role: 'user', content: inboundMessage },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: chatMessages,
      max_tokens: 100,
      temperature: 0.5,
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) return null;

    console.log(`🤖 Post-handoff reply generated for lead ${lead.id}`);
    return reply;
  } catch (err) {
    console.error('🤖 Post-handoff reply error:', err.message);
    return null;
  }
}

/**
 * Check if current time is outside business hours.
 * Simple heuristic — assumes 8am-6pm local time.
 * TODO: Use business.hours + business.timezone for real parsing.
 */
function isAfterHours(business) {
  const now = new Date();
  const hour = now.getHours(); // Server local time — good enough for v1
  return hour < 8 || hour >= 18;
}

/**
 * Build a short handoff summary for the business owner from the lead's captured fields.
 * Deliberately NOT a join of every raw inbound message — that got unreadable fast, and after
 * repeated test resets on the same lead, mixed unrelated old messages into one confusing blob.
 */
function buildHandoffSummary(lead, messages) {
  const firstInbound = messages.find(m => m.direction === 'inbound');
  const request = firstInbound ? firstInbound.body : 'their request';
  const truncatedRequest = request.length > 140 ? request.slice(0, 140) + '…' : request;

  const who = lead.caller_name || 'Customer';
  const where = lead.location_hint || 'their area';
  const urgency = lead.urgency_level || 'not stated';

  return `${who} in ${where} needs help with: ${truncatedRequest}. Urgency: ${urgency}.`;
}

/**
 * Extract the customer's name from conversation messages.
 * Returns the name if found, or null if not mentioned.
 */
async function extractName(messages) {
  if (!openai) return null;

  const convo = messages
    .filter(m => m.direction === 'inbound')
    .map(m => m.body)
    .join('\n');

  if (!convo.trim()) return null;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Extract the customer\'s first name (or full name) from these text messages. Reply with ONLY the name, nothing else. If no name is mentioned, reply with "NONE".' },
        { role: 'user', content: convo },
      ],
      max_tokens: 20,
      temperature: 0,
    });

    const result = completion.choices[0]?.message?.content?.trim();
    if (!result || result === 'NONE' || result.length > 50) return null;
    return result;
  } catch (err) {
    console.error('🤖 Name extraction error:', err.message);
    return null;
  }
}

module.exports = { generateReply, generatePostHandoffReply, buildHandoffSummary, buildSystemPrompt, extractName, HANDOFF_TOKEN };
