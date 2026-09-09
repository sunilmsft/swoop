const crypto = require('crypto');

// Single shared admin password — not per-user auth. Good enough to keep the console from being
// wide open to anyone with the URL; not a long-term auth story.

function hashValue(value) {
  return crypto.createHash('sha256').update(String(value)).digest();
}

// Fixed-length digest comparison so timingSafeEqual never throws on a length mismatch and
// comparison time doesn't leak how much of the candidate matched.
function passwordMatches(candidate) {
  const expected = process.env.ADMIN_PASSWORD || '';
  if (!expected) return false; // misconfigured — never accept with no password configured
  return crypto.timingSafeEqual(hashValue(candidate || ''), hashValue(expected));
}

function isAuthenticated(req) {
  return !!(req.session && req.session.authenticated === true);
}

// For browser page routes (/, /admin, ...) — bounce to the login form.
function requirePageAuth(req, res, next) {
  if (isAuthenticated(req)) return next();
  res.redirect('/login');
}

// For JSON API routes — no page to redirect to, just refuse.
function requireApiAuth(req, res, next) {
  if (isAuthenticated(req)) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

module.exports = { passwordMatches, isAuthenticated, requirePageAuth, requireApiAuth };
