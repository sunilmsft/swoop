const db = require('../db/database');

function ensureDefaultBusiness() {
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER || '+18337830902';

  const defaultForwardPhone = process.env.DEFAULT_FORWARD_PHONE || '+14257867232';

  const result = db.prepare(`
    INSERT OR IGNORE INTO businesses
      (name, phone, forward_phone, owner_name, auto_reply_message, review_link,
       description, services, pricing, service_area, hours, emergency_policy,
       tone, max_ai_turns)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "Mike's Plumbing",
    twilioPhone,
    defaultForwardPhone,
    'Mike',
    "Hi, thanks for calling {business_name}! Sorry we couldn't answer. I'm Mike's automated assistant and can help get things started - what do you need help with?\n\nWe may send up to 7 messages about your request. Msg&data rates may apply. Reply STOP to unsubscribe. Terms: welcomematdigital.com/swoop",
    'https://g.page/r/mikes-plumbing/review',
    'Residential plumbing - repairs, installations, and emergencies.',
    'Leak repair, drain cleaning, water heater installation',
    '$75 service call. Most jobs $150-800.',
    'Seattle metro area',
    'Mon-Fri 7am-6pm, Sat 8am-2pm',
    '24/7 emergency service available.',
    'friendly',
    3
  );

  if (result.changes > 0) {
    console.log(`✅ Startup bootstrap: inserted default business for ${twilioPhone}`);
  } else {
    console.log(`ℹ️ Startup bootstrap: business already exists for ${twilioPhone}`);
  }
}

module.exports = { ensureDefaultBusiness };
