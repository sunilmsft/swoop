/**
 * Test Console routes — only mounted when TWILIO_MOCK_MODE is on.
 * Powers the in-dashboard simulator so the owner can exercise the full
 * missed-call → text-back → AI reply → follow-up → review flow without
 * needing Twilio to actually deliver any messages.
 */

const express = require('express');
const db = require('../db/database');
const { MOCK_MODE } = require('../services/twilio');
const {
  handleMissedCall,
  handleInboundSMS,
  processDueFollowUps,
  sendReviewRequest,
} = require('../services/leads');

const router = express.Router();

/**
 * Tag a lead and all its messages as test data so production stats,
 * lead lists, and admin exports can exclude them. Idempotent.
 */
function tagLeadAsTest(leadId) {
  if (!leadId) return;
  db.prepare('UPDATE leads SET is_test = 1 WHERE id = ?').run(leadId);
  db.prepare('UPDATE messages SET is_test = 1 WHERE lead_id = ?').run(leadId);
}

/**
 * Re-tag messages on every existing test lead. Used after fire_followups
 * since the cron writes new outbound rows we need to mark.
 */
function retagAllTestLeadMessages() {
  db.prepare('UPDATE messages SET is_test = 1 WHERE lead_id IN (SELECT id FROM leads WHERE is_test = 1)').run();
}

/**
 * GET /api/test/status — Is mock mode active? Used by the dashboard
 * to show the banner + Test Console section.
 */
router.get('/status', (req, res) => {
  res.json({ mockMode: MOCK_MODE });
});

/**
 * POST /api/test/simulate — Run a single scenario against real services.
 * Body: { scenario, businessId, phone?, name?, body?, leadId? }
 */
router.post('/simulate', async (req, res) => {
  if (!MOCK_MODE) {
    return res.status(403).json({ error: 'Test Console is disabled (TWILIO_MOCK_MODE is off).' });
  }

  const { scenario, businessId, phone, name, body, leadId } = req.body || {};

  try {
    switch (scenario) {
      case 'missed_call': {
        const bizId = businessId || getDefaultBusinessId();
        const callerPhone = phone || randomDemoPhone();
        const lead = await handleMissedCall(bizId, callerPhone);
        if (name && !lead.caller_name) {
          db.prepare('UPDATE leads SET caller_name = ?, updated_at = datetime(\'now\') WHERE id = ?')
            .run(name, lead.id);
        }
        tagLeadAsTest(lead.id);
        return res.json({
          ok: true,
          scenario,
          leadId: lead.id,
          message: `📞 Simulated missed call from ${name || callerPhone}. Auto-reply sent (mock).`,
        });
      }

      case 'inbound_sms': {
        if (!body || !body.trim()) return res.status(400).json({ error: 'body is required' });
        const bizId = businessId || getDefaultBusinessId();
        // If leadId given, use that lead's phone so the reply lands on the same thread
        let callerPhone = phone;
        if (!callerPhone && leadId) {
          const lead = db.prepare('SELECT caller_phone FROM leads WHERE id = ?').get(leadId);
          callerPhone = lead && lead.caller_phone;
        }
        if (!callerPhone) return res.status(400).json({ error: 'phone or leadId is required' });
        await handleInboundSMS(bizId, callerPhone, body.trim());
        const lead = db.prepare('SELECT id FROM leads WHERE business_id = ? AND caller_phone = ? ORDER BY created_at DESC LIMIT 1')
          .get(bizId, callerPhone);
        if (lead) tagLeadAsTest(lead.id);
        return res.json({
          ok: true,
          scenario,
          leadId: lead ? lead.id : null,
          message: `💬 Simulated inbound text: "${body.trim()}". AI/keyword logic ran (mock).`,
        });
      }

      case 'fire_followups': {
        // Backdate all pending follow-ups so they're due now, then process them.
        const target = leadId
          ? db.prepare('UPDATE follow_ups SET scheduled_for = datetime(\'now\', \'-1 minute\') WHERE status = ? AND lead_id = ?')
              .run('pending', leadId)
          : db.prepare('UPDATE follow_ups SET scheduled_for = datetime(\'now\', \'-1 minute\') WHERE status = ?')
              .run('pending');
        const result = await processDueFollowUps();
        retagAllTestLeadMessages();
        return res.json({
          ok: true,
          scenario,
          message: `🔁 Fired ${result.sent} follow-up(s), skipped ${result.skipped} (e.g., already engaged or opted out). ${target.changes} were backdated.`,
        });
      }

      case 'send_review': {
        if (!leadId) return res.status(400).json({ error: 'leadId is required' });
        await sendReviewRequest(Number(leadId));
        tagLeadAsTest(Number(leadId));
        return res.json({
          ok: true,
          scenario,
          leadId,
          message: `⭐ Review request sent (mock).`,
        });
      }

      case 'reset': {
        // Wipe ONLY test-tagged data — real leads/messages stay untouched.
        db.prepare('DELETE FROM follow_ups WHERE lead_id IN (SELECT id FROM leads WHERE is_test = 1)').run();
        db.prepare('DELETE FROM messages WHERE is_test = 1').run();
        const del = db.prepare('DELETE FROM leads WHERE is_test = 1').run();
        return res.json({ ok: true, scenario, message: `🧹 Cleared ${del.changes} test lead(s). Real data and businesses kept.` });
      }

      default:
        return res.status(400).json({ error: `Unknown scenario: ${scenario}` });
    }
  } catch (err) {
    console.error('Test simulate error:', err);
    res.status(500).json({ error: err.message });
  }
});

function getDefaultBusinessId() {
  const row = db.prepare('SELECT id FROM businesses ORDER BY created_at ASC LIMIT 1').get();
  if (!row) throw new Error('No businesses found. Add a business first.');
  return row.id;
}

function randomDemoPhone() {
  const last4 = String(Math.floor(1000 + Math.random() * 9000));
  return `+1425555${last4}`;
}

module.exports = router;
