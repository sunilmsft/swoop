const express = require('express');
const db = require('../db/database');
const { sendReviewRequest } = require('../services/leads');

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
  const { name, phone, forward_phone, owner_name, auto_reply_message, review_link } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'name and phone are required' });
  }

  try {
    const result = db.prepare(
      'INSERT INTO businesses (name, phone, forward_phone, owner_name, auto_reply_message, review_link) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, phone, forward_phone || null, owner_name || null, auto_reply_message || null, review_link || null);

    const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(business);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'A business with that phone number already exists' });
    }
    throw err;
  }
});

module.exports = router;
