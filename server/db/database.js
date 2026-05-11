const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'swoop.db'));

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS businesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    forward_phone TEXT,
    owner_name TEXT,
    timezone TEXT DEFAULT 'America/Los_Angeles',
    auto_reply_message TEXT DEFAULT 'Hey! Sorry we missed your call. What do you need help with?',
    review_link TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    caller_phone TEXT NOT NULL,
    caller_name TEXT,
    call_status TEXT DEFAULT 'missed',
    lead_status TEXT DEFAULT 'new',
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (business_id) REFERENCES businesses(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER NOT NULL,
    direction TEXT NOT NULL CHECK(direction IN ('inbound', 'outbound')),
    body TEXT NOT NULL,
    twilio_sid TEXT,
    sent_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (lead_id) REFERENCES leads(id)
  );

  CREATE TABLE IF NOT EXISTS follow_ups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER NOT NULL,
    scheduled_for TEXT NOT NULL,
    message_template TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'cancelled')),
    sent_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (lead_id) REFERENCES leads(id)
  );

  CREATE INDEX IF NOT EXISTS idx_leads_business ON leads(business_id);
  CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(caller_phone);
  CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON follow_ups(status, scheduled_for);
`);

module.exports = db;
