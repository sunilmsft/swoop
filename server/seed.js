/**
 * Seed script — populates the database with sample data for testing.
 * Run: node server/seed.js
 *
 * Safe to run multiple times — clears existing data first.
 */

const db = require('./db/database');

console.log('🌱 Seeding database...\n');

// Clear existing data (order matters for FK constraints)
db.exec('DELETE FROM follow_ups');
db.exec('DELETE FROM messages');
db.exec('DELETE FROM leads');
db.exec('DELETE FROM businesses');

// ---- Businesses ----
const biz1 = db.prepare(`
  INSERT INTO businesses (name, phone, forward_phone, owner_name, auto_reply_message, review_link,
    description, services, pricing, service_area, hours, emergency_policy, tone, faqs, max_ai_turns)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  "Mike's Plumbing",
  '+18337830902',
  '+14257867232',
  'Mike',
  "{business_name}: Sorry we missed your call. What can we help with today? Reply with your issue and best time. We'll send up to 7 msgs about this request. Msg&data rates may apply. Reply STOP to opt out, HELP for help. Terms: welcomematdigital.com/swoop",
  'https://g.page/r/mikes-plumbing/review',
  'Residential plumbing — repairs, installations, and emergencies. Family-owned, serving the Seattle metro area for 10 years. Licensed and insured.',
  'Leak repair, water heater installation, drain cleaning, faucet replacement, pipe repair, toilet repair, garbage disposal, sump pump',
  '$75 service call fee. Most jobs $150-800. Free estimates for jobs over $200. Water heater install starts at $1,200.',
  'Seattle metro area, 25-mile radius from downtown',
  'Mon-Fri 7am-6pm, Sat 8am-2pm, closed Sunday',
  '24/7 emergency service available. $150 after-hours surcharge.',
  'friendly',
  'Do you offer free estimates? → Yes for jobs over $200\nAre you licensed and insured? → Yes — owner will share license # on request\nDo you work weekends? → Saturdays 8am-2pm\nHow fast can you come out? → Usually same-day or next-day for non-emergencies\nDo you do commercial work? → Residential only',
  3
);

const biz2 = db.prepare(`
  INSERT INTO businesses (name, phone, owner_name, auto_reply_message, review_link,
    description, services, pricing, service_area, hours, tone, max_ai_turns)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  "Sara's Electric",
  '+12065552000',
  'Sara',
  "{business_name}: Sorry we missed your call. What can we help with today? Reply with your issue and best time. We'll send up to 7 msgs about this request. Msg&data rates may apply. Reply STOP to opt out, HELP for help. Terms: welcomematdigital.com/swoop",
  'https://g.page/r/saras-electric/review',
  'Licensed electrician specializing in residential and light commercial work. Panel upgrades, EV charger installations, rewiring, and troubleshooting.',
  'Panel upgrade, EV charger install, outlet/switch install, rewiring, lighting, ceiling fan, circuit breaker, troubleshooting',
  'Service calls start at $95. Most jobs $200-1,500. Free estimates for panel upgrades and EV chargers.',
  'Greater Seattle area including Bellevue, Redmond, Kirkland',
  'Mon-Fri 8am-5pm',
  'professional',
  3
);

const bizId1 = biz1.lastInsertRowid;
const bizId2 = biz2.lastInsertRowid;

// ---- Leads ----
function insertLead(businessId, phone, name, callStatus, leadStatus, daysAgo) {
  const result = db.prepare(`
    INSERT INTO leads (business_id, caller_phone, caller_name, call_status, lead_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now', ? || ' days'), datetime('now', ? || ' days'))
  `).run(businessId, phone, name, callStatus, leadStatus, `-${daysAgo}`, `-${daysAgo}`);
  return result.lastInsertRowid;
}

const lead1 = insertLead(bizId1, '+12065559001', 'John Rivera', 'missed', 'engaged', 0);
const lead2 = insertLead(bizId1, '+12065559002', 'Lisa Chen', 'missed', 'new', 1);
const lead3 = insertLead(bizId1, '+12065559003', 'Dave Thompson', 'missed', 'converted', 3);
const lead4 = insertLead(bizId1, '+12065559004', null, 'missed', 'new', 0);
const lead5 = insertLead(bizId2, '+12065559005', 'Maria Garcia', 'missed', 'engaged', 2);
const lead6 = insertLead(bizId2, '+12065559006', 'Tom Wilson', 'missed', 'review_sent', 5);

// ---- Messages ----
function insertMsg(leadId, direction, body, daysAgo, hoursAgo) {
  db.prepare(`
    INSERT INTO messages (lead_id, direction, body, twilio_sid, sent_at)
    VALUES (?, ?, ?, ?, datetime('now', ? || ' days', ? || ' hours'))
  `).run(leadId, direction, body, `SM${Date.now()}${Math.random().toString(36).slice(2, 8)}`, `-${daysAgo}`, `-${hoursAgo}`);
}

// Lead 1 — John (engaged, replied today)
insertMsg(lead1, 'outbound', "Hey! Sorry we missed your call. What do you need help with? — Mike's Plumbing", 0, 2);
insertMsg(lead1, 'inbound', "Hi! I have a leaking faucet in my kitchen. Can you come take a look?", 0, 1);

// Lead 2 — Lisa (new, auto-reply sent yesterday)
insertMsg(lead2, 'outbound', "Hey! Sorry we missed your call. What do you need help with? — Mike's Plumbing", 1, 0);

// Lead 3 — Dave (converted, full conversation)
insertMsg(lead3, 'outbound', "Hey! Sorry we missed your call. What do you need help with? — Mike's Plumbing", 3, 0);
insertMsg(lead3, 'inbound', "Need a water heater replaced", 3, -2);
insertMsg(lead3, 'outbound', "Still need help? Mike's Plumbing has openings tomorrow. Just reply here to book.", 2, 0);
insertMsg(lead3, 'inbound', "Yes! Tomorrow afternoon works", 2, -1);

// Lead 4 — Unknown caller (new, auto-reply sent)
insertMsg(lead4, 'outbound', "Hey! Sorry we missed your call. What do you need help with? — Mike's Plumbing", 0, 1);

// Lead 5 — Maria (engaged, Sara's Electric)
insertMsg(lead5, 'outbound', "Hi! We missed your call. How can we help? — Sara's Electric", 2, 0);
insertMsg(lead5, 'inbound', "I need an outlet installed in my garage", 2, -3);

// Lead 6 — Tom (review sent)
insertMsg(lead6, 'outbound', "Hi! We missed your call. How can we help? — Sara's Electric", 5, 0);
insertMsg(lead6, 'inbound', "Panel upgrade needed", 5, -2);
insertMsg(lead6, 'outbound', "Thanks for choosing Sara's Electric! We'd really appreciate a quick Google review ⭐\nhttps://g.page/r/saras-electric/review", 1, 0);

// ---- Follow-ups ----
function insertFollowUp(leadId, daysFromNow, message, status) {
  db.prepare(`
    INSERT INTO follow_ups (lead_id, scheduled_for, message_template, status, sent_at)
    VALUES (?, datetime('now', ? || ' days'), ?, ?, ${status === 'sent' ? "datetime('now')" : 'NULL'})
  `).run(leadId, `+${daysFromNow}`, message, status);
}

// Lead 1 — follow-ups cancelled (they replied)
insertFollowUp(lead1, 1, "Still need help? Mike's Plumbing has openings tomorrow.", 'cancelled');
insertFollowUp(lead1, 3, "Just checking in — want us to schedule a visit?", 'cancelled');
insertFollowUp(lead1, 7, "Last chance! We'd love to help. — Mike's Plumbing", 'cancelled');

// Lead 2 — follow-ups pending
insertFollowUp(lead2, 0, "Still need help? Mike's Plumbing has openings tomorrow.", 'pending');
insertFollowUp(lead2, 2, "Just checking in — want us to schedule a visit?", 'pending');
insertFollowUp(lead2, 6, "Last chance! We'd love to help. — Mike's Plumbing", 'pending');

// Lead 4 — follow-ups pending
insertFollowUp(lead4, 1, "Still need help? Mike's Plumbing has openings tomorrow.", 'pending');
insertFollowUp(lead4, 3, "Just checking in — want us to schedule a visit?", 'pending');
insertFollowUp(lead4, 7, "Last chance! We'd love to help. — Mike's Plumbing", 'pending');

console.log('✅ Seed complete!\n');
console.log(`   Businesses: 2`);
console.log(`   Leads:      6`);
console.log(`   Messages:   ${6 + 5 + 2} (outbound + inbound)`);
console.log(`   Follow-ups: 9`);
console.log(`\n   Run "npm run dev" and open http://localhost:3000`);
