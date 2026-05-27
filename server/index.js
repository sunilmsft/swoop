require('dotenv').config();

const express = require('express');
const path = require('path');
const cron = require('node-cron');
const { processDueFollowUps } = require('./services/leads');

const app = express();
app.set('trust proxy', 1); // Trust Render's reverse proxy (fixes req.protocol for Twilio signature validation)
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: false })); // Twilio sends form-encoded
app.use(express.json()); // API endpoints use JSON
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.use('/webhooks', require('./routes/webhooks'));
app.use('/api/test', require('./routes/test'));
app.use('/api', require('./routes/api'));

// Pretty routes for static pages
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});
app.get('/consent', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'consent.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Process follow-ups every 15 minutes (skip in dev to avoid blocking with fake seed data)
if (process.env.NODE_ENV !== 'development') {
  cron.schedule('*/15 * * * *', async () => {
    try {
      const result = await processDueFollowUps();
      if (result.total > 0) {
        console.log(`Follow-ups processed: ${result.sent} sent, ${result.skipped} skipped`);
      }
    } catch (err) {
      console.error('Cron error:', err.message);
    }
  });
}

app.listen(PORT, () => {
  console.log(`
  ┌─────────────────────────────────────────┐
  │                                         │
  │   🦅  Swoop v0.1.0                      │
  │   Never miss a lead again.              │
  │                                         │
  │   Server:    http://localhost:${PORT}       │
  │   Dashboard: http://localhost:${PORT}       │
  │   Health:    http://localhost:${PORT}/health │
  │                                         │
  │   Twilio Webhooks:                      │
  │   Voice:  /webhooks/voice               │
  │   Status: /webhooks/voice-status        │
  │   SMS:    /webhooks/sms                 │
  │                                         │
  └─────────────────────────────────────────┘
  `);
});
