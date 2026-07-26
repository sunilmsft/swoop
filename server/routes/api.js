const express = require('express');
const fs = require('fs');
const db = require('../db/database');
const { sendReviewRequest } = require('../services/leads');
const { sendSMS } = require('../services/twilio');
const { buildSystemPrompt } = require('../services/ai-agent');

const router = express.Router();

async function proxyRequest(baseUrl, path, req, res) {
  const targetBase = String(baseUrl || '').trim().replace(/\/+$/, '');
  const targetPath = String(path || '').startsWith('/') ? String(path || '') : `/${path || ''}`;

  if (!/^https?:\/\//i.test(targetBase)) {
    return res.status(400).json({ error: 'Invalid proxy base URL' });
  }

  const targetUrl = new URL(targetPath, targetBase).toString();
  const headers = { 'Content-Type': req.headers['content-type'] || 'application/json' };
  const init = { method: req.method, headers };

  if (!['GET', 'HEAD'].includes(req.method)) {
    init.body = JSON.stringify(req.body ?? {});
  }

  const upstream = await fetch(targetUrl, init);
  const contentType = upstream.headers.get('content-type') || '';

  res.status(upstream.status);
  if (contentType.includes('application/json')) {
    return res.json(await upstream.json());
  }

  const text = await upstream.text();
  return res.type(contentType || 'text/plain').send(text);
}

router.all('/proxy', async (req, res) => {
  try {
    const { base, path } = req.query;
    await proxyRequest(base, path, req, res);
  } catch (err) {
    res.status(500).json({ error: `Proxy request failed: ${err.message}` });
  }
});

/**
 * GET /api/dashboard — Summary stats for the dashboard
 */
router.get('/dashboard', (req, res) => {
  const stats = {
    totalLeads: db.prepare('SELECT COUNT(*) as count FROM leads WHERE is_test = 0').get().count,
    openLeads: db.prepare("SELECT COUNT(*) as count FROM leads WHERE is_test = 0 AND lead_status IN ('new', 'engaged', 'needs_attention')").get().count,
    newLeads: db.prepare('SELECT COUNT(*) as count FROM leads WHERE is_test = 0 AND lead_status = ?').get('new').count,
    engagedLeads: db.prepare('SELECT COUNT(*) as count FROM leads WHERE is_test = 0 AND lead_status = ?').get('engaged').count,
    convertedLeads: db.prepare('SELECT COUNT(*) as count FROM leads WHERE is_test = 0 AND lead_status = ?').get('converted').count,
    needsAttention: db.prepare('SELECT COUNT(*) as count FROM leads WHERE is_test = 0 AND lead_status = ?').get('needs_attention').count,
    reviewsSent: db.prepare('SELECT COUNT(*) as count FROM leads WHERE is_test = 0 AND lead_status = ?').get('review_sent').count,
    messagesSent: db.prepare('SELECT COUNT(*) as count FROM messages WHERE is_test = 0 AND direction = ?').get('outbound').count,
    messagesReceived: db.prepare('SELECT COUNT(*) as count FROM messages WHERE is_test = 0 AND direction = ?').get('inbound').count,
    pendingFollowUps: db.prepare("SELECT COUNT(*) as count FROM follow_ups f JOIN leads l ON l.id = f.lead_id WHERE f.status = 'pending' AND l.is_test = 0").get().count,
    followUpsDueNow: db.prepare("SELECT COUNT(*) as count FROM follow_ups f JOIN leads l ON l.id = f.lead_id WHERE f.status = 'pending' AND l.is_test = 0 AND f.scheduled_for <= datetime('now')").get().count,
    initialTextsSent: db.prepare("SELECT COUNT(*) as count FROM leads l WHERE l.is_test = 0 AND EXISTS (SELECT 1 FROM messages m WHERE m.lead_id = l.id AND m.direction = 'outbound' AND COALESCE(m.is_test, 0) = 0)").get().count,
    customerReplyLeads: db.prepare("SELECT COUNT(*) as count FROM leads l WHERE l.is_test = 0 AND EXISTS (SELECT 1 FROM messages m WHERE m.lead_id = l.id AND m.direction = 'inbound' AND COALESCE(m.is_test, 0) = 0)").get().count,
    callsLast24h: db.prepare("SELECT COUNT(*) as count FROM call_events WHERE created_at >= datetime('now', '-1 day') AND event_source IN ('dial_result', 'voice_status')").get().count,
    missedCallsLast24h: db.prepare("SELECT COUNT(*) as count FROM call_events WHERE created_at >= datetime('now', '-1 day') AND event_source IN ('dial_result', 'voice_status') AND outcome IN ('missed', 'voicemail')").get().count,
    answeredCallsLast24h: db.prepare("SELECT COUNT(*) as count FROM call_events WHERE created_at >= datetime('now', '-1 day') AND event_source IN ('dial_result', 'voice_status') AND outcome = 'answered'").get().count,
  };

  res.json(stats);
});

/**
 * GET /api/leads — List all leads with latest message
 */
router.get('/leads', (req, res) => {
  const includeTest = req.query.includeTest === '1';
  const where = includeTest ? '' : 'WHERE l.is_test = 0';
  const leads = db.prepare(`
    SELECT l.*, b.name as business_name,
      (SELECT body FROM messages WHERE lead_id = l.id ORDER BY sent_at DESC LIMIT 1) as last_message,
      (SELECT COUNT(*) FROM messages WHERE lead_id = l.id) as message_count
    FROM leads l
    JOIN businesses b ON l.business_id = b.id
    ${where}
    ORDER BY l.updated_at DESC
    LIMIT 50
  `).all();

  res.json(leads);
});

/**
 * GET /api/leads/:id — Single lead with full message history
 */
router.get('/leads/:id', (req, res) => {
  const lead = db.prepare('SELECT l.*, b.name as business_name, b.owner_name as business_owner_name, b.handoff_minutes as business_handoff_minutes FROM leads l JOIN businesses b ON l.business_id = b.id WHERE l.id = ?')
    .get(req.params.id);

  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const messages = db.prepare('SELECT * FROM messages WHERE lead_id = ? ORDER BY sent_at ASC')
    .all(lead.id);

  const followUps = db.prepare('SELECT * FROM follow_ups WHERE lead_id = ? ORDER BY scheduled_for ASC')
    .all(lead.id);

  res.json({ ...lead, messages, followUps });
});

/**
 * PATCH /api/leads/:id — Update lead status or notes
 */
router.patch('/leads/:id', (req, res) => {
  const { lead_status, notes, caller_name } = req.body;
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const updates = [];
  const values = [];

  if (lead_status) { updates.push('lead_status = ?'); values.push(lead_status); }
  if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }
  if (caller_name !== undefined) { updates.push('caller_name = ?'); values.push(caller_name); }

  if (updates.length > 0) {
    updates.push('updated_at = datetime(\'now\')');
    values.push(req.params.id);
    db.prepare(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  }

  const updated = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  res.json(updated);
});

/**
 * POST /api/leads/:id/review — Send a Google review request
 */
router.post('/leads/:id/review', async (req, res) => {
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  if (lead.sms_opt_out) return res.status(409).json({ error: 'Lead has opted out of SMS' });
  if (lead.lead_status !== 'converted') {
    return res.status(409).json({ error: 'Review requests can only be sent after the lead is marked converted.' });
  }

  try {
    await sendReviewRequest(Number(req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/leads/:id/sms — Send a manual SMS to a lead
 */
router.post('/leads/:id/sms', async (req, res) => {
  const { body } = req.body;
  if (!body || !body.trim()) {
    return res.status(400).json({ error: 'Message body is required' });
  }

  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  if (lead.sms_opt_out) return res.status(409).json({ error: 'Lead has opted out of SMS' });

  try {
    await sendSMS(lead.caller_phone, body.trim());

    db.prepare(
      'INSERT INTO messages (lead_id, direction, body, sent_at) VALUES (?, ?, ?, datetime(\'now\'))'
    ).run(lead.id, 'outbound', body.trim());

    db.prepare('UPDATE leads SET updated_at = datetime(\'now\') WHERE id = ?').run(lead.id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send SMS: ' + err.message });
  }
});

/**
 * GET /api/businesses — List businesses
 */
router.get('/businesses', (req, res) => {
  const businesses = db.prepare('SELECT * FROM businesses ORDER BY created_at DESC').all();
  res.json(businesses);
});

/**
 * GET /api/businesses/:id/system-prompt — Return the live system prompt the AI will see.
 * Useful as a "look under the hood" moment during demos.
 */
router.get('/businesses/:id/system-prompt', (req, res) => {
  const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.params.id);
  if (!business) return res.status(404).json({ error: 'Business not found' });
  const prompt = buildSystemPrompt(business);
  res.json({ businessId: business.id, name: business.name, prompt });
});

/**
 * POST /api/businesses — Create a new business
 */
router.post('/businesses', (req, res) => {
  const { name, phone, forward_phone, owner_name, auto_reply_message, review_link,
          description, services, pricing, service_area, hours, emergency_policy,
          tone, faqs, never_say, max_ai_turns, handoff_minutes, handoff_after_hours_msg } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'name and phone are required' });
  }

  try {
    const result = db.prepare(
      `INSERT INTO businesses (name, phone, forward_phone, owner_name, auto_reply_message, review_link,
        description, services, pricing, service_area, hours, emergency_policy,
        tone, faqs, never_say, max_ai_turns, handoff_minutes, handoff_after_hours_msg)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(name, phone, forward_phone || null, owner_name || null, auto_reply_message || null, review_link || null,
          description || null, services || null, pricing || null, service_area || null, hours || null, emergency_policy || null,
          tone || 'friendly', faqs || null, never_say || null, max_ai_turns || 3, handoff_minutes || 120, handoff_after_hours_msg || null);

    const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(business);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'A business with that phone number already exists' });
    }
    throw err;
  }
});

// ---- Admin Console Endpoints ----

/**
 * PUT /api/businesses/:id — Update a business (used by demo mode + admin)
 */
router.put('/businesses/:id', (req, res) => {
  const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.params.id);
  if (!business) return res.status(404).json({ error: 'Business not found' });

  const allowed = ['name', 'phone', 'forward_phone', 'owner_name', 'auto_reply_message', 'review_link',
    'description', 'services', 'pricing', 'service_area', 'hours', 'emergency_policy',
    'tone', 'faqs', 'never_say', 'max_ai_turns', 'handoff_minutes', 'handoff_after_hours_msg', 'ai_enabled'];

  const updates = [];
  const values = [];

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(req.body[key]);
    }
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  values.push(req.params.id);
  db.prepare(`UPDATE businesses SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const updated = db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.params.id);
  res.json(updated);
});

/**
 * DELETE /api/businesses/:id/leads — Clear all leads (and their messages/follow-ups) for a business
 */
router.delete('/businesses/:id/leads', (req, res) => {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_LEAD_PURGE !== 'true') {
    return res.status(403).json({
      error: 'Lead purges are disabled in production. Set ALLOW_LEAD_PURGE=true only for intentional maintenance.'
    });
  }

  const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.params.id);
  if (!business) return res.status(404).json({ error: 'Business not found' });

  const leadIds = db.prepare('SELECT id FROM leads WHERE business_id = ?').all(req.params.id).map(r => r.id);

  if (leadIds.length > 0) {
    const placeholders = leadIds.map(() => '?').join(',');
    db.prepare(`DELETE FROM follow_ups WHERE lead_id IN (${placeholders})`).run(...leadIds);
    db.prepare(`DELETE FROM messages WHERE lead_id IN (${placeholders})`).run(...leadIds);
    db.prepare(`DELETE FROM leads WHERE business_id = ?`).run(req.params.id);
  }

  res.json({ success: true, leadsDeleted: leadIds.length });
});

/**
 * GET /api/admin/overview — Platform-wide stats for the super admin
 */
router.get('/admin/overview', (req, res) => {
  const stats = {
    totalBusinesses: db.prepare('SELECT COUNT(*) as c FROM businesses').get().c,
    totalLeads: db.prepare('SELECT COUNT(*) as c FROM leads WHERE is_test = 0').get().c,
    totalMessages: db.prepare('SELECT COUNT(*) as c FROM messages WHERE is_test = 0').get().c,
    outboundMessages: db.prepare('SELECT COUNT(*) as c FROM messages WHERE is_test = 0 AND direction = ?').get('outbound').c,
    inboundMessages: db.prepare('SELECT COUNT(*) as c FROM messages WHERE is_test = 0 AND direction = ?').get('inbound').c,
    aiHandoffs: db.prepare('SELECT COUNT(*) as c FROM leads WHERE is_test = 0 AND ai_handoff_done = 1').get().c,
    totalAiTurns: db.prepare('SELECT COALESCE(SUM(ai_turn_count), 0) as c FROM leads WHERE is_test = 0').get().c,
    convertedLeads: db.prepare('SELECT COUNT(*) as c FROM leads WHERE is_test = 0 AND lead_status = ?').get('converted').c,
    needsAttention: db.prepare('SELECT COUNT(*) as c FROM leads WHERE is_test = 0 AND lead_status = ?').get('needs_attention').c,
    pendingFollowUps: db.prepare("SELECT COUNT(*) as c FROM follow_ups f JOIN leads l ON l.id = f.lead_id WHERE f.status = 'pending' AND l.is_test = 0").get().c,
    testLeads: db.prepare('SELECT COUNT(*) as c FROM leads WHERE is_test = 1').get().c,
  };
  res.json(stats);
});

/**
 * GET /api/admin/businesses — All businesses with usage metrics
 */
router.get('/admin/businesses', (req, res) => {
  const businesses = db.prepare(`
    SELECT b.*,
      (SELECT COUNT(*) FROM leads WHERE business_id = b.id AND is_test = 0) as lead_count,
      (SELECT COUNT(*) FROM leads WHERE business_id = b.id AND is_test = 0 AND lead_status = 'converted') as converted_count,
      (SELECT COUNT(*) FROM leads WHERE business_id = b.id AND is_test = 0 AND lead_status = 'needs_attention') as attention_count,
      (SELECT COUNT(*) FROM messages m JOIN leads l ON m.lead_id = l.id WHERE l.business_id = b.id AND l.is_test = 0) as message_count,
      (SELECT COALESCE(SUM(l.ai_turn_count), 0) FROM leads l WHERE l.business_id = b.id AND l.is_test = 0) as ai_turns_used,
      (SELECT MAX(l.updated_at) FROM leads l WHERE l.business_id = b.id AND l.is_test = 0) as last_lead_activity
    FROM businesses b
    ORDER BY b.created_at DESC
  `).all();
  res.json(businesses);
});

/**
 * GET /api/admin/storage-health — Verify DB path + file characteristics.
 */
router.get('/admin/storage-health', (req, res) => {
  const dbPath = db.__dbPath || process.env.DB_PATH || null;
  const fileExists = dbPath ? fs.existsSync(dbPath) : false;
  const stat = fileExists ? fs.statSync(dbPath) : null;

  res.json({
    nodeEnv: process.env.NODE_ENV || 'unset',
    dbPath,
    dbPathFromEnv: process.env.DB_PATH || null,
    allowEphemeralDb: process.env.ALLOW_EPHEMERAL_DB === 'true',
    isLikelyPersistentPath: dbPath ? String(dbPath).startsWith('/var/data/') : false,
    fileExists,
    fileSizeBytes: stat ? stat.size : 0,
    fileMtime: stat ? stat.mtime.toISOString() : null,
  });
});

module.exports = router;
