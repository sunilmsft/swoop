const express = require('express');
const { validateTwilioRequest } = require('../services/twilio');
const { handleMissedCall, handleInboundSMS, CARRIER_FORWARD_CONSENT } = require('../services/leads');
const db = require('../db/database');

const router = express.Router();

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function findBusinessByPhone(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;

  // Try exact match first, then normalized match as a fallback.
  return db.prepare(
    `SELECT * FROM businesses
     WHERE phone = ?
        OR REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone, '+', ''), '-', ''), '(', ''), ')', ''), ' ', '') = ?
     LIMIT 1`
  ).get(phone, normalized);
}

function webhookUrl(req, route) {
  return `${req.protocol}://${req.get('host')}/webhooks/${route}`;
}

function findBusinessById(id) {
  return id ? db.prepare('SELECT * FROM businesses WHERE id = ?').get(id) : null;
}

// Returns true if this event was newly recorded, false if it's a duplicate (same CallSid + event
// source already logged — e.g. a Twilio webhook retry) and should NOT trigger a second missed-call SMS.
function logCallEvent({
  businessId,
  fromPhone,
  toPhone,
  callSid = null,
  callStatus = null,
  dialStatus = null,
  dialDuration = 0,
  outcome = 'unknown',
  eventSource = 'dial_result',
}) {
  try {
    db.prepare(
      `INSERT INTO call_events (business_id, from_phone, to_phone, call_sid, call_status, dial_status, dial_duration, outcome, event_source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      businessId || null,
      fromPhone || null,
      toPhone || null,
      callSid,
      callStatus,
      dialStatus,
      Number(dialDuration || 0),
      outcome,
      eventSource
    );
    return true;
  } catch (err) {
    if (callSid && String(err.message).includes('UNIQUE constraint')) {
      console.log(`📞 Duplicate call event ignored (CallSid ${callSid}, source ${eventSource})`);
      return false;
    }
    console.error('Failed to log call event:', err.message);
    return true; // unexpected logging failure shouldn't block the missed-call flow
  }
}

/**
 * POST /webhooks/voice — Twilio calls this when a call comes in
 *
 * If the business has a forward_phone, ring that phone for 20 seconds.
 * If nobody answers, the /webhooks/voice-dial-result callback handles the missed call.
 */
router.post('/voice', validateTwilioRequest, async (req, res) => {
  console.log('📞 /webhooks/voice hit:', req.body.From, '→', req.body.To, 'Status:', req.body.CallStatus);
  const { From, To, CallSid } = req.body;
  const VoiceResponse = require('twilio').twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  const business = findBusinessByPhone(To);
  const businessName = business ? business.name : 'this business';

  if (business && business.call_mode === 'carrier_forward') {
    // Dedicated local number: the business's real line already carrier-forwarded here on
    // no-answer/busy/decline — the owner already had their shot. Skip the redial + disclosure
    // and go straight into the same missed-call SMS flow used elsewhere.
    console.log(`📞 carrier_forward mode for ${business.name} — treating as missed call directly`);

    const claimed = logCallEvent({
      businessId: business.id,
      fromPhone: From,
      toPhone: To,
      callSid: CallSid || null,
      outcome: 'missed',
      eventSource: 'carrier_forward',
    });

    if (claimed) {
      try {
        await handleMissedCall(business.id, From, CARRIER_FORWARD_CONSENT);
        console.log(`🦅 Missed call (carrier_forward) from ${From} → auto-reply sent`);
      } catch (err) {
        console.error('Error handling missed call:', err.message);
      }
    }

    twiml.say({ voice: 'Google.en-US-Neural2-F' }, `Thanks for calling ${businessName}! Sorry we missed you. We just sent you a text message.`);
    res.type('text/xml');
    res.send(twiml.toString());
    return;
  }

  // Verbal consent disclosure — plays on every inbound call for toll-free verification compliance.
  // Required: caller must hear the disclosure before consent is recorded via missed-call SMS.
  // Specifies: business name, kind of messages, frequency, Msg&data, opt-out.
  twiml.say(`Thank you for calling ${businessName}. If we miss your call, we will send you a text to follow up. You may receive up to 7 messages regarding your missed call — including responses to your questions and appointment reminders. Message and data rates may apply. Reply STOP at any time to stop all messages.`);

  if (business && business.forward_phone) {
    // Ring the business owner's cell phone for 20 seconds
    console.log(`📞 Forwarding call to ${business.forward_phone}`);
    twiml.dial({
      timeout: 20,
      action: `${webhookUrl(req, 'voice-dial-result')}?businessId=${business.id}`,
      method: 'POST',
    }, business.forward_phone);
  }
  // If no forwarding number, call ends after the disclosure; voice-status callback handles the missed-call SMS.

  res.type('text/xml');
  res.send(twiml.toString());
});

/**
 * POST /webhooks/voice-dial-result — Called after a <Dial> attempt completes
 * DialCallStatus: completed (answered), no-answer, busy, failed, canceled
 *
 * "completed" can mean voicemail picked up — check DialCallDuration to detect.
 * Real conversations are typically > 15 seconds. Voicemail pickups are < 10.
 */
router.post('/voice-dial-result', validateTwilioRequest, async (req, res) => {
  const { DialCallStatus, DialCallDuration, From, To, CallSid } = req.body;
  console.log('📞 /webhooks/voice-dial-result:', DialCallStatus, `(${DialCallDuration || 0}s)`, 'From:', From, 'To:', To);
  const VoiceResponse = require('twilio').twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  const isMissed = ['no-answer', 'busy', 'failed', 'canceled'].includes(DialCallStatus);
  const isVoicemail = DialCallStatus === 'completed' && Number(DialCallDuration || 0) < 15;
  const business = findBusinessById(req.query.businessId) || findBusinessByPhone(To);

  let outcome = 'answered';
  if (isVoicemail) outcome = 'voicemail';
  if (isMissed) outcome = 'missed';

  const claimed = logCallEvent({
    businessId: business ? business.id : null,
    fromPhone: From,
    toPhone: To,
    callSid: CallSid || null,
    dialStatus: DialCallStatus || null,
    dialDuration: DialCallDuration || 0,
    outcome,
    eventSource: 'dial_result',
  });

  if (isMissed || isVoicemail) {
    if (isVoicemail) {
      console.log('📞 Short "completed" call — likely voicemail, treating as missed');
    }

    if (business && claimed) {
      try {
        await handleMissedCall(business.id, From);
        console.log(`🦅 Missed call from ${From} → auto-reply sent`);
      } catch (err) {
        console.error('Error handling missed call:', err.message);
      }
    }

    const bizName = business ? business.name : 'us';
    twiml.say({ voice: 'Google.en-US-Neural2-F' }, `Thanks for calling ${bizName}! Sorry we missed you. We just sent you a text message.`);
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

/**
 * POST /webhooks/voice-status — Called after a call ends
 * This is where we detect missed calls and trigger the auto-reply
 */
router.post('/voice-status', validateTwilioRequest, async (req, res) => {
  console.log('📞 /webhooks/voice-status hit:', JSON.stringify(req.body));
  const { CallStatus, From, To, CallSid } = req.body;
  const business = findBusinessByPhone(To);

  // carrier_forward calls are fully handled by /voice itself — it never <Dial>s, so there's no
  // separate dial attempt for this callback to report on, and logging/triggering here again would
  // double the missed-call SMS for the same call.
  const isCarrierForward = business?.call_mode === 'carrier_forward';
  const shouldLogStatusEvent = !isCarrierForward && (!business || !business.forward_phone);

  let claimed = false;
  if (shouldLogStatusEvent && ['completed', 'busy', 'failed', 'no-answer', 'canceled'].includes(CallStatus)) {
    claimed = logCallEvent({
      businessId: business ? business.id : null,
      fromPhone: From,
      toPhone: To,
      callSid: CallSid || null,
      callStatus: CallStatus,
      outcome: ['no-answer', 'busy', 'failed', 'canceled'].includes(CallStatus) ? 'missed' : 'answered',
      eventSource: 'voice_status',
    });
  }

  // A forwarded call is handled by /voice-dial-result. The parent call's
  // status callback must not send a second auto-reply for the same attempt.
  if (!isCarrierForward && !business?.forward_phone && claimed && ['no-answer', 'busy', 'failed'].includes(CallStatus)) {
    if (business) {
      try {
        await handleMissedCall(business.id, From);
        console.log(`Missed call from ${From} → auto-reply sent`);
      } catch (err) {
        console.error('Error handling missed call:', err.message);
      }
    }
  }

  res.sendStatus(200);
});

/**
 * POST /webhooks/sms — Twilio calls this when an SMS comes in
 */
router.post('/sms', validateTwilioRequest, async (req, res) => {
  const { From, To, Body } = req.body;
  const MessagingResponse = require('twilio').twiml.MessagingResponse;
  const twiml = new MessagingResponse();

  const business = findBusinessByPhone(To);

  if (business) {
    try {
      await handleInboundSMS(business.id, From, Body);
      console.log(`Inbound SMS from ${From}: "${Body}"`);
    } catch (err) {
      console.error('Error handling inbound SMS:', err.message);
    }
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

module.exports = router;
