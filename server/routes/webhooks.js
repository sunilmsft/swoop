const express = require('express');
const { validateTwilioRequest } = require('../services/twilio');
const { handleMissedCall, handleInboundSMS } = require('../services/leads');
const db = require('../db/database');

const router = express.Router();

/**
 * POST /webhooks/voice — Twilio calls this when a call comes in
 *
 * Twilio sends CallStatus: "no-answer", "busy", "completed", etc.
 * We care about missed calls (no-answer, busy, failed).
 */
router.post('/voice', validateTwilioRequest, async (req, res) => {
  const { CallStatus, From, To } = req.body;
  const VoiceResponse = require('twilio').twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  // Let the phone ring normally — Twilio will call our status callback
  // when the call ends (missed, answered, etc.)
  twiml.say('');
  // Or ring for 20 seconds then hang up:
  // twiml.dial({ timeout: 20 }, businessPhone);

  res.type('text/xml');
  res.send(twiml.toString());
});

/**
 * POST /webhooks/voice-status — Called after a call ends
 * This is where we detect missed calls and trigger the auto-reply
 */
router.post('/voice-status', validateTwilioRequest, async (req, res) => {
  const { CallStatus, From, To } = req.body;

  if (['no-answer', 'busy', 'failed'].includes(CallStatus)) {
    // Find the business by their Twilio number
    const business = db.prepare('SELECT * FROM businesses WHERE phone = ?').get(To);

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

  const business = db.prepare('SELECT * FROM businesses WHERE phone = ?').get(To);

  if (business) {
    try {
      await handleInboundSMS(business.id, From, Body);
      console.log(`Inbound SMS from ${From}: "${Body}"`);
      // Don't auto-reply to inbound texts in v1 — just log them
      // v2 will add AI two-way conversations here
    } catch (err) {
      console.error('Error handling inbound SMS:', err.message);
    }
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

module.exports = router;
