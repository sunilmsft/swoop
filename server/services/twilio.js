const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const MOCK_MODE = ['1', 'true', 'yes', 'on'].includes((process.env.TWILIO_MOCK_MODE || '').toLowerCase());

function makeMockSid() {
  return `SM_MOCK_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Send an SMS message via Twilio
 */
async function sendSMS(to, body) {
  if (MOCK_MODE) {
    const mockMessage = {
      sid: makeMockSid(),
      from: FROM_NUMBER || '+10000000000',
      to,
      body,
      status: 'queued',
      mock: true,
    };
    console.log(`🧪 [MOCK SMS] ${mockMessage.from} -> ${to}: ${body}`);
    return mockMessage;
  }

  const message = await client.messages.create({
    body,
    from: FROM_NUMBER,
    to,
  });
  return message;
}

/**
 * Validate that an incoming request is actually from Twilio
 */
function validateTwilioRequest(req, res, next) {
  console.log('🔒 NODE_ENV:', process.env.NODE_ENV, '| Auth token exists:', !!process.env.TWILIO_AUTH_TOKEN);
  if (process.env.NODE_ENV === 'development') {
    return next(); // Skip validation in dev for easy testing
  }

  const twilioSignature = req.headers['x-twilio-signature'] || '';
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const isValid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN,
    twilioSignature,
    url,
    req.body
  );

  if (isValid) {
    next();
  } else {
    res.status(403).send('Forbidden — invalid Twilio signature');
  }
}

module.exports = { sendSMS, validateTwilioRequest, MOCK_MODE };
