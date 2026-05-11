const express = require('express');
const { validateTwilioRequest } = require('../services/twilio');
const { handleMissedCall, handleInboundSMS } = require('../services/leads');
const db = require('../db/database');

const router = express.Router();

/**
 * POST /webhooks/voice — Twilio calls this when a call comes in
 *
 * If the business has a forward_phone, ring that phone for 20 seconds.
 * If nobody answers, the /webhooks/voice-dial-result callback handles the missed call.
 */
router.post('/voice', validateTwilioRequest, async (req, res) => {
  console.log('📞 /webhooks/voice hit:', req.body.From, '→', req.body.To, 'Status:', req.body.CallStatus);
  const { From, To } = req.body;
  const VoiceResponse = require('twilio').twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  const business = db.prepare('SELECT * FROM businesses WHERE phone = ?').get(To);

  if (business && business.forward_phone) {
    // Ring the business owner's cell phone for 20 seconds
    console.log(`📞 Forwarding call to ${business.forward_phone}`);
    twiml.dial({ timeout: 20, action: '/webhooks/voice-dial-result' }, business.forward_phone);
  } else {
    // No forwarding number — just end the call (status callback will handle it)
    twiml.say('');
  }

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
  const { DialCallStatus, DialCallDuration, From, To } = req.body;
  console.log('📞 /webhooks/voice-dial-result:', DialCallStatus, `(${DialCallDuration || 0}s)`, 'From:', From, 'To:', To);
  const VoiceResponse = require('twilio').twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  const isMissed = ['no-answer', 'busy', 'failed', 'canceled'].includes(DialCallStatus);
  const isVoicemail = DialCallStatus === 'completed' && Number(DialCallDuration || 0) < 15;

  if (isMissed || isVoicemail) {
    if (isVoicemail) {
      console.log('📞 Short "completed" call — likely voicemail, treating as missed');
    }

    const business = db.prepare('SELECT * FROM businesses WHERE phone = ?').get(To);

    if (business) {
      try {
        await handleMissedCall(business.id, From);
        console.log(`🦅 Missed call from ${From} → auto-reply sent`);
      } catch (err) {
        console.error('Error handling missed call:', err.message);
      }
    }

    const bizName = business ? business.name : 'us';
    twiml.say(`Thanks for calling ${bizName}! Sorry we missed you. We just sent you a text message.`);
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
    } catch (err) {
      console.error('Error handling inbound SMS:', err.message);
    }
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

module.exports = router;
