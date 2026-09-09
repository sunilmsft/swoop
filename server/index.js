require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const cron = require('node-cron');
const { processDueFollowUps } = require('./services/leads');
const { ensureDefaultBusiness } = require('./services/bootstrap');
const { backupDatabase, cleanOrphanedRows } = require('./services/maintenance');
const { passwordMatches, requirePageAuth } = require('./middleware/auth');
const db = require('./db/database');

const app = express();
app.set('trust proxy', 1); // Trust Render's reverse proxy (fixes req.protocol for Twilio signature validation)
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === 'production') {
  if (!process.env.ADMIN_PASSWORD) {
    throw new Error('Production requires ADMIN_PASSWORD to be set — refusing to start with the console unprotected.');
  }
  if (!process.env.SESSION_SECRET) {
    throw new Error('Production requires SESSION_SECRET to be set (any long random string).');
  }
}

ensureDefaultBusiness();
cleanOrphanedRows();
backupDatabase('startup');
console.log(`DB path: ${db.__dbPath || process.env.DB_PATH || 'unknown'}`);

// Middleware
app.use(express.urlencoded({ extended: false })); // Twilio sends form-encoded
app.use(express.json()); // API endpoints use JSON

// Single shared admin password gate — session-based, in-memory store. Sessions reset on
// restart/redeploy; this is a prototype-scale gate, not meant to survive a multi-instance deploy.
app.use(session({
  secret: process.env.SESSION_SECRET || 'swoop-dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
}));

// Login/logout — must stay reachable without a session.
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});
app.post('/login', (req, res) => {
  if (passwordMatches(req.body.password)) {
    req.session.authenticated = true;
    return res.redirect('/');
  }
  res.redirect('/login?error=1');
});
app.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// Gated pages — registered before express.static so these exact paths can't bypass the session
// check by falling through to the static file server.
app.get(['/', '/index.html'], requirePageAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});
app.get(['/admin', '/admin.html'], requirePageAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});
app.get('/consent', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'consent.html'));
});

// Everything else under public/ (consent.html, login.html, any shared assets) — not sensitive,
// stays unauthenticated. index.html/admin.html are shadowed by the explicit gated routes above.
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.use('/webhooks', require('./routes/webhooks'));
app.use('/api/test', require('./routes/test'));
app.use('/api', require('./routes/api'));

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

  // Daily backup at 03:25 server time.
  cron.schedule('25 3 * * *', () => {
    backupDatabase('daily');
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
