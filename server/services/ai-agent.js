const OpenAI = require('openai');
const db = require('../db/database');

let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Build a system prompt from the business profile.
 * This grounds the AI agent in the business's identity, services, and rules.
 */
function buildSystemPrompt(business) {
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
- Never badmouth competitors.`;

  if (business.never_say) {
    prompt += `\n- NEVER SAY OR DO: ${business.never_say}`;
  }

  prompt += `\n\nYOUR GOAL: Acknowledge the customer's need, ask one qualifying question (like location, timeline, or scope), then confirm you'll have ${business.owner_name || 'someone'} reach out to them.`;

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

  // If this is the last turn, append handoff instruction
  const isHandoffTurn = currentTurn >= maxTurns;

  // Load conversation history for context
  const messages = db.prepare(
    'SELECT direction, body FROM messages WHERE lead_id = ? ORDER BY sent_at ASC'
  ).all(lead.id);

  // Build chat messages array
  const chatMessages = [
    { role: 'system', content: buildSystemPrompt(business) },
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
      content: `IMPORTANT: This is your final reply. You MUST end this message by telling the customer that ${business.owner_name || 'the owner'} will personally reach out to them ${handoffTime}. Be warm and reassuring. Do NOT ask any more questions.`,
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
 * Build a handoff summary for the business owner.
 * This is shown on the dashboard when a lead needs attention.
 */
function buildHandoffSummary(lead, messages) {
  const inboundMsgs = messages.filter(m => m.direction === 'inbound');
  const summary = inboundMsgs.map(m => m.body).join(' | ');
  const truncated = summary.length > 200 ? summary.slice(0, 200) + '…' : summary;
  return `Customer said: "${truncated}" — ${inboundMsgs.length} messages exchanged, expecting callback.`;
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

module.exports = { generateReply, buildHandoffSummary, buildSystemPrompt, extractName };
