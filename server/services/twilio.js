const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;

/**
 * Send an SMS message via Twilio
 */
async function sendSMS(to, body) {
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

module.exports = { sendSMS, validateTwilioRequest };
