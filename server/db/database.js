const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'swoop.db');
const db = new Database(dbPath);

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
    auto_reply_message TEXT DEFAULT '{business_name}: Sorry we missed your call. What can we help with today? Reply with your issue and best time. We''ll send up to 7 msgs about this request. Msg&data rates may apply. Reply STOP to opt out, HELP for help. Terms: welcomematdigital.com/swoop',
    review_link TEXT,
    description TEXT,
    services TEXT,
    pricing TEXT,
    service_area TEXT,
    hours TEXT,
    emergency_policy TEXT,
    tone TEXT DEFAULT 'friendly',
    faqs TEXT,
    never_say TEXT,
    max_ai_turns INTEGER DEFAULT 3,
    handoff_minutes INTEGER DEFAULT 120,
    handoff_after_hours_msg TEXT DEFAULT 'first thing tomorrow morning',
    ai_enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    caller_phone TEXT NOT NULL,
    caller_name TEXT,
    call_status TEXT DEFAULT 'missed',
    lead_status TEXT DEFAULT 'new',
    ai_turn_count INTEGER DEFAULT 0,
    ai_handoff_done INTEGER DEFAULT 0,
    consent_method TEXT,
    consent_source TEXT,
    consent_recorded_at TEXT,
    consent_script_version TEXT,
    consent_notes TEXT,
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

  CREATE TABLE IF NOT EXISTS call_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER,
    from_phone TEXT,
    to_phone TEXT,
    call_sid TEXT,
    call_status TEXT,
    dial_status TEXT,
    dial_duration INTEGER,
    outcome TEXT,
    event_source TEXT DEFAULT 'dial_result',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (business_id) REFERENCES businesses(id)
  );

  CREATE INDEX IF NOT EXISTS idx_leads_business ON leads(business_id);
  CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(caller_phone);
  CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON follow_ups(status, scheduled_for);
  CREATE INDEX IF NOT EXISTS idx_call_events_business_created ON call_events(business_id, created_at);
`);

// Lightweight schema migrations for existing local DBs.
const leadColumns = db.prepare('PRAGMA table_info(leads)').all().map((col) => col.name);
if (!leadColumns.includes('sms_opt_out')) {
  db.exec('ALTER TABLE leads ADD COLUMN sms_opt_out INTEGER DEFAULT 0');
}
if (!leadColumns.includes('opt_out_at')) {
  db.exec('ALTER TABLE leads ADD COLUMN opt_out_at TEXT');
}
if (!leadColumns.includes('is_test')) {
  db.exec('ALTER TABLE leads ADD COLUMN is_test INTEGER DEFAULT 0');
  db.exec('CREATE INDEX IF NOT EXISTS idx_leads_is_test ON leads(is_test)');
}
if (!leadColumns.includes('consent_method')) {
  db.exec('ALTER TABLE leads ADD COLUMN consent_method TEXT');
}
if (!leadColumns.includes('consent_source')) {
  db.exec('ALTER TABLE leads ADD COLUMN consent_source TEXT');
}
if (!leadColumns.includes('consent_recorded_at')) {
  db.exec('ALTER TABLE leads ADD COLUMN consent_recorded_at TEXT');
}
if (!leadColumns.includes('consent_script_version')) {
  db.exec('ALTER TABLE leads ADD COLUMN consent_script_version TEXT');
}
if (!leadColumns.includes('consent_notes')) {
  db.exec('ALTER TABLE leads ADD COLUMN consent_notes TEXT');
}

const messageColumns = db.prepare('PRAGMA table_info(messages)').all().map((col) => col.name);
if (!messageColumns.includes('is_test')) {
  db.exec('ALTER TABLE messages ADD COLUMN is_test INTEGER DEFAULT 0');
}

const callEventColumns = db.prepare('PRAGMA table_info(call_events)').all().map((col) => col.name);
if (!callEventColumns.includes('call_sid')) {
  db.exec('ALTER TABLE call_events ADD COLUMN call_sid TEXT');
}
if (!callEventColumns.includes('event_source')) {
  db.exec("ALTER TABLE call_events ADD COLUMN event_source TEXT DEFAULT 'dial_result'");
}

db.exec('CREATE INDEX IF NOT EXISTS idx_call_events_sid_source ON call_events(call_sid, event_source)');

module.exports = db;
