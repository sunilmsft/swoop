/**
 * seed-businesses.js — Idempotent business seeder, safe to run on every deploy.
 *
 * - Inserts businesses by phone number if they don't already exist (INSERT OR IGNORE).
 * - NEVER touches leads, messages, or follow_ups — real customer data is never affected.
 * - Run via: npm run seed:businesses
 */

require('dotenv').config();
const db = require('./db/database');

const businesses = [
  {
    name: "Mike's Plumbing",
    phone: '+18337830902',
    forward_phone: '+14257867232',
    owner_name: 'Mike',
    auto_reply_message:
      "Hi, thanks for calling {business_name}! Sorry we couldn't answer. I'm Mike's automated assistant and can help get things started — what do you need help with?\n\nWe may send up to 7 messages about your request. Msg&data rates may apply. Reply STOP to unsubscribe. Terms: welcomematdigital.com/swoop",
    review_link: 'https://g.page/r/mikes-plumbing/review',
    description:
      'Residential plumbing — repairs, installations, and emergencies. Family-owned, serving the Seattle metro area for 10 years. Licensed and insured.',
    services:
      'Leak repair, water heater installation, drain cleaning, faucet replacement, pipe repair, toilet repair, garbage disposal, sump pump',
    pricing:
      '$75 service call fee. Most jobs $150-800. Free estimates for jobs over $200. Water heater install starts at $1,200.',
    service_area: 'Seattle metro area, 25-mile radius from downtown',
    hours: 'Mon-Fri 7am-6pm, Sat 8am-2pm, closed Sunday',
    emergency_policy: '24/7 emergency service available. $150 after-hours surcharge.',
    tone: 'friendly',
    faqs:
      'Do you offer free estimates? → Yes for jobs over $200\nAre you licensed and insured? → Yes — owner will share license # on request\nDo you work weekends? → Saturdays 8am-2pm\nHow fast can you come out? → Usually same-day or next-day for non-emergencies\nDo you do commercial work? → Residential only',
    max_ai_turns: 3,
  },
];

const insert = db.prepare(`
  INSERT OR IGNORE INTO businesses
    (name, phone, forward_phone, owner_name, auto_reply_message, review_link,
     description, services, pricing, service_area, hours, emergency_policy,
     tone, faqs, max_ai_turns)
  VALUES
    (@name, @phone, @forward_phone, @owner_name, @auto_reply_message, @review_link,
     @description, @services, @pricing, @service_area, @hours, @emergency_policy,
     @tone, @faqs, @max_ai_turns)
`);

let inserted = 0;
let skipped = 0;

for (const biz of businesses) {
  const result = insert.run(biz);
  if (result.changes > 0) {
    console.log(`✅ Inserted: ${biz.name} (${biz.phone})`);
    inserted++;
  } else {
    console.log(`⏭  Already exists: ${biz.name} (${biz.phone})`);
    skipped++;
  }
}

console.log(`\nDone. ${inserted} inserted, ${skipped} already existed. Leads untouched.`);
