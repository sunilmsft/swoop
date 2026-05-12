const express = require('express');
const db = require('../db/database');
const { sendReviewRequest } = require('../services/leads');
const { sendSMS } = require('../services/twilio');

const router = express.Router();

/**
 * GET /api/dashboard — Summary stats for the dashboard
 */
router.get('/dashboard', (req, res) => {
  const stats = {
    totalLeads: db.prepare('SELECT COUNT(*) as count FROM leads').get().count,
    newLeads: db.prepare('SELECT COUNT(*) as count FROM leads WHERE lead_status = ?').get('new').count,
    engagedLeads: db.prepare('SELECT COUNT(*) as count FROM leads WHERE lead_status = ?').get('engaged').count,
    convertedLeads: db.prepare('SELECT COUNT(*) as count FROM leads WHERE lead_status = ?').get('converted').count,
    needsAttention: db.prepare('SELECT COUNT(*) as count FROM leads WHERE lead_status = ?').get('needs_attention').count,
    reviewsSent: db.prepare('SELECT COUNT(*) as count FROM leads WHERE lead_status = ?').get('review_sent').count,
    messagesSent: db.prepare('SELECT COUNT(*) as count FROM messages WHERE direction = ?').get('outbound').count,
    messagesReceived: db.prepare('SELECT COUNT(*) as count FROM messages WHERE direction = ?').get('inbound').count,
    pendingFollowUps: db.prepare('SELECT COUNT(*) as count FROM follow_ups WHERE status = ?').get('pending').count,
  };

  res.json(stats);
});

/**
 * GET /api/leads — List all leads with latest message
 */
router.get('/leads', (req, res) => {
  const leads = db.prepare(`
    SELECT l.*, b.name as business_name,
      (SELECT body FROM messages WHERE lead_id = l.id ORDER BY sent_at DESC LIMIT 1) as last_message,
      (SELECT COUNT(*) FROM messages WHERE lead_id = l.id) as message_count
    FROM leads l
    JOIN businesses b ON l.business_id = b.id
    ORDER BY l.updated_at DESC
    LIMIT 50
  `).all();

  res.json(leads);
});

/**
 * GET /api/leads/:id — Single lead with full message history
 */
router.get('/leads/:id', (req, res) => {
  const lead = db.prepare('SELECT l.*, b.name as business_name FROM leads l JOIN businesses b ON l.business_id = b.id WHERE l.id = ?')
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
    totalLeads: db.prepare('SELECT COUNT(*) as c FROM leads').get().c,
    totalMessages: db.prepare('SELECT COUNT(*) as c FROM messages').get().c,
    outboundMessages: db.prepare('SELECT COUNT(*) as c FROM messages WHERE direction = ?').get('outbound').c,
    inboundMessages: db.prepare('SELECT COUNT(*) as c FROM messages WHERE direction = ?').get('inbound').c,
    aiHandoffs: db.prepare('SELECT COUNT(*) as c FROM leads WHERE ai_handoff_done = 1').get().c,
    totalAiTurns: db.prepare('SELECT COALESCE(SUM(ai_turn_count), 0) as c FROM leads').get().c,
    convertedLeads: db.prepare('SELECT COUNT(*) as c FROM leads WHERE lead_status = ?').get('converted').c,
    needsAttention: db.prepare('SELECT COUNT(*) as c FROM leads WHERE lead_status = ?').get('needs_attention').c,
    pendingFollowUps: db.prepare('SELECT COUNT(*) as c FROM follow_ups WHERE status = ?').get('pending').c,
  };
  res.json(stats);
});

/**
 * GET /api/admin/businesses — All businesses with usage metrics
 */
router.get('/admin/businesses', (req, res) => {
  const businesses = db.prepare(`
    SELECT b.*,
      (SELECT COUNT(*) FROM leads WHERE business_id = b.id) as lead_count,
      (SELECT COUNT(*) FROM leads WHERE business_id = b.id AND lead_status = 'converted') as converted_count,
      (SELECT COUNT(*) FROM leads WHERE business_id = b.id AND lead_status = 'needs_attention') as attention_count,
      (SELECT COUNT(*) FROM messages m JOIN leads l ON m.lead_id = l.id WHERE l.business_id = b.id) as message_count,
      (SELECT COALESCE(SUM(l.ai_turn_count), 0) FROM leads l WHERE l.business_id = b.id) as ai_turns_used,
      (SELECT MAX(l.updated_at) FROM leads l WHERE l.business_id = b.id) as last_lead_activity
    FROM businesses b
    ORDER BY b.created_at DESC
  `).all();
  res.json(businesses);
});

module.exports = router;
