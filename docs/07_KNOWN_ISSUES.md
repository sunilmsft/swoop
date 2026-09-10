# 07 — Known Issues, Bugs, and Tech Debt

> Things that work today but a future engineer will trip over. Ordered by impact, not severity.

**Reconciled Sept 10, 2026:** every item below was reviewed against current code, `docs/STATUS.md`, and `docs/PILOT_GAP_ANALYSIS.md`. KI-2 (auth), KI-9 (DB backups), and KI-21 (production forwarding) are marked resolved below. Everything else was checked and is still genuinely open — no other items changed status.

---

## Compliance / Risk

### KI-1 — No automated tests for STOP / START / HELP
- **Impact:** A future code change could silently break opt-out enforcement on one of the four send paths (auto-reply, AI reply, follow-up, review request). A TCPA complaint or Twilio audit would be expensive.
- **Today's mitigation:** Manual testing via Test Console. Every PR runs through Test Console scenarios "Opt-Out" and "Opt-Out → Back-In".
- **Fix:** Add a small test file (`node:test` or `vitest`, no framework dep) that hits `handleInboundSMS()` directly with each keyword and asserts `sms_opt_out` state + subsequent send blocking. Maybe 15 tests, ~half a day's work.
- **Flagged by:** Morgan persona. 🔴 Blocker before first paying customer.

### KI-2 — No auth on `/admin` or `/` — ✅ RESOLVED Sept 9, 2026 (commit `2e866b2`)
- **What shipped:** A shared-password, session-based gate (`server/middleware/auth.js`) now sits in front of `public/index.html`, `public/admin.html`, and every API route they depend on — unauthenticated requests redirect to `/login` (pages) or get `401` (API). Anonymous URL access to all businesses/leads/messages is closed.
- **What's still open (a different, ongoing issue — not this one):** The gate is one shared password for the whole app, not per-business auth — anyone who *has* the password still sees every business's data mixed together. That's tracked separately as "Business-level configuration isolation" in `docs/PILOT_GAP_ANALYSIS.md` and the root `BACKLOG.md`, and per `docs/STATUS.md` is currently the #1 remaining blocker. Don't reopen this item for it.
- **Original fix description (for reference):** "Magic-link auth tied to owner phone or email. Scope all queries to the authenticated business. Add admin gate to `/admin*`." Only the admin-gate portion shipped; magic-link and per-business scoping did not.
- **Flagged by:** Priya, Morgan.

### KI-3 — Notification Email on Twilio Trust Hub is still the personal Gmail
- **Impact:** Future Twilio communication risks "domain mismatch" warnings on edits to the bundle (we hit this exact error code `18606` on June 10).
- **Today's mitigation:** Business Profile is already approved, so no immediate functional impact.
- **Fix:** Log into Twilio Console → Trust Hub → Bundle `BUf71fa573b0fd6173b0cc31daba2ba41b` → update Notification Email to `hello@welcomematdigital.com`.

---

## Security

### KI-4 — `.env` lives inside OneDrive folder
- **Impact:** Live Twilio + OpenAI secrets sit in OneDrive cloud sync. If OneDrive is bound to a corporate Microsoft account, those secrets are in M365 cloud. If access is revoked, the local file vanishes but the cloud copy may persist.
- **Today's mitigation:** `.gitignore` covers it — never reached GitHub.
- **Fix:** Either (a) move the entire repo out of OneDrive to `C:\dev\swoop` (preferred), or (b) add `.env` to OneDrive's excluded-files list. Render dashboard remains the source of truth for production env vars.

### KI-5 — No rate limiting on webhooks or API
- **Impact:** Any actor with the webhook URL can hammer `/webhooks/sms`. Twilio signature validation rejects unsigned requests in production, so this is partially mitigated. `/api/*` now sits behind the session auth gate (KI-2, resolved Sept 9) but that's authentication, not throttling — an authenticated (or correctly-signed) caller can still send unlimited requests.
- **Today's mitigation:** Render provides upstream traffic protection; Twilio signature validation protects webhook routes in production; `/api/*` also requires a valid session as of Sept 9, 2026.
- **Fix:** `express-rate-limit` on `/api/*` and `/webhooks/*`. Still not built — this item remains open.

### KI-6 — Phone numbers not strictly validated as E.164
- **Impact:** Junk input in the Add Business form could create rows with malformed phone numbers, causing downstream send failures.
- **Today's mitigation:** Twilio rejects malformed numbers, so failures surface as send errors, not silent bad data.
- **Fix:** Server-side validation with a tight E.164 regex or `libphonenumber-js` (one new dep).

---

## Operational / Reliability

### KI-7 — No CI/CD beyond Render auto-deploy
- **Impact:** A bad push goes to production immediately. No staging environment, no PR checks, no linting gate.
- **Today's mitigation:** Local review before push is mandated in `.github/copilot-instructions.md` ("never auto-push to remote") and lessons-learned memory.
- **Fix:** Tiny GitHub Action: run tests (once they exist), run `node --check server/index.js` syntax check, ensure no `.env` accidentally committed. Maybe add a `staging` branch tied to a free Render preview environment.

### KI-8 — No error monitoring / observability
- **Impact:** A production crash or failed SMS send is only visible in Render logs, which are ephemeral and not searchable past the dashboard buffer.
- **Today's mitigation:** Manual Render log check.
- **Fix:** Sentry free tier (10k events/mo) is sufficient. Wire `app.use(Sentry.errorHandler())` and capture SMS send failures inside `services/twilio.js`.

### KI-9 — No DB backup strategy — ✅ RESOLVED (predates this session, never updated here)
- **What shipped:** `server/services/maintenance.js` → `backupDatabase()`, called on every startup (`server/index.js`) and on a daily `25 3 * * *` cron, with retention rotation. Verified directly in code (`grep backupDatabase` finds it wired into both paths) and confirmed live — this session's own local test runs logged `Backup created (startup): ...` on every boot. Already checked off in the root `BACKLOG.md` ("Automatic SQLite backups added... with retention rotation") — this file just never got updated to match.
- **Residual gap:** Backups are file-copy snapshots, not point-in-time/continuous — a corruption between backups could still lose recent writes. That's a narrower, different risk than "nothing meaningful exists," which is what this item originally described.

### KI-10 — Render paid runtime still has cold-start watch risk
- **Impact:** The service is now on Render Starter ($7/mo), so the Free-plan sleep warning is gone, but startup and webhook timing still need observation during real traffic.
- **Today's mitigation:** A 1 GB persistent disk is mounted at `/var/data`; direct voice and SMS testing passed after the upgrade.
- **Fix:** Monitor the first real pilot calls and add uptime/error monitoring if webhook latency or startup failures recur.

### KI-11 — Voice webhook URL still points at `swoop-x79g.onrender.com`
- **Impact:** Cosmetic / brand consistency. If the Render URL ever changes, the voice webhook breaks.
- **Today's mitigation:** Render URLs don't randomly change.
- **Fix:** Point Twilio voice webhook at `welcomematdigital.com/webhooks/voice` (requires routing in the frontdesk-ai app, or a Cloudflare worker shim).

### KI-21 — Demo voice flow is not the production forwarded-call flow — 🟡 CORE FIX SHIPPED Sept 9, 2026 (commit `2e866b2`)
- **What shipped:** `businesses.call_mode` (`direct_dial` default / `carrier_forward`). `carrier_forward` businesses skip the disclosure and the redial entirely and go straight into the missed-call SMS flow — exactly this item's original "Fix." A real `UNIQUE`-index-backed guard also stops a Twilio webhook retry from sending a second text for the same call.
- **What's still open:** Twilio's `ForwardedFrom` metadata is still not captured/logged anywhere, so there's no per-carrier compatibility data yet. Real-carrier behavior (does "Decline" look different from generic no-answer?) is untested — needs live pilot calls, not more code. See `docs/PILOT_GAP_ANALYSIS.md` → "Conditional-forwarding behavior" for the full writeup.
- **Flagged by:** Ray, Priya, Morgan. Downgraded from 🔴 to 🟡 — no longer a hard code blocker, but shouldn't be treated as fully closed before a real pilot business goes live on a dedicated number.

### KI-22 — Toll-free caller reputation warning
- **Impact:** A tester's phone classified `(833) 783-0902` as possible fraud and recommended hanging up. This can prevent a demo caller from reaching Swoop even though Twilio voice webhooks are configured correctly.
- **Today's mitigation:** Treat the number as internal demo/test only and use local numbers for production customers.
- **Fix:** Submit a caller-ID reputation correction through Twilio and relevant carrier reputation providers; do not rely on toll-free voice as the customer-facing number.

---

## Code Smells

### KI-12 — Schema migrations are inline `ALTER TABLE` checks
- **Impact:** `server/db/database.js` runs a `PRAGMA table_info()` check on boot and ALTERs missing columns. Works but doesn't scale to schema changes that involve data transformation, renames, or constraint changes.
- **Today's mitigation:** Each new column is appended manually with a short check block.
- **Fix:** Bring in `better-sqlite3-migrate` or roll a 50-line migration runner when the schema grows past v0.4 settings panel needs.

### KI-13 — Demo / seed businesses still have the OLD auto-reply template
- **Impact:** "Mike's Plumbing" and "Sara's Cleaning" in `server/seed.js` (or whatever the current seed has) may not carry the v0.2.7 carrier-compliant template. New demos look fine because new businesses inherit the schema default, but old seed rows on the persistent disk still hold pre-v0.2.7 text.
- **Today's mitigation:** The build runs `npm run seed` which re-seeds, but seed.js may have its own template literal that diverged from the default. Verify before next demo.
- **Fix:** Either drop the seed templates and let DB default win, or update `seed.js` to use the canonical compliant text.

### KI-14 — Mixed CommonJS in a modern stack
- **Impact:** Codebase uses `require()` throughout. Modern Node ergonomics (top-level await, native ESM imports of some libs) are unavailable.
- **Today's mitigation:** None needed — works fine for the current scale.
- **Fix:** Migrate to ESM (`"type": "module"`) when there's a real reason. Don't do it preemptively.

### KI-15 — Single-file dashboards getting large
- **Impact:** `public/index.html` and `public/admin.html` are growing past comfortable single-file size. Future settings-panel work will push them past where vanilla makes sense.
- **Today's mitigation:** It's still readable. Maintain by section.
- **Fix:** When the owner settings panel ships (v0.4), introduce a lightweight component model — htmx, Alpine.js, or Lit — not a full SPA framework. Keep build-step-free if possible.

---

## Documentation Drift

### KI-16 — README.md says pricing is $79–$149/mo; product vision says $29–$49/mo
- **Impact:** Confusing for any new reader.
- **Today's mitigation:** README.md was an early draft; the real number is in `BACKLOG.md` and PLAYBOOK.html.
- **Fix:** One-line README edit. Source of truth = [02_PRODUCT_VISION.md](02_PRODUCT_VISION.md).

### KI-17 — README.md says "Built by Sunil & Tim"
- **Impact:** Historical — Tim was an early collaborator who is no longer involved. Confusing for new contributors.
- **Fix:** Update README footer when convenient.

### KI-18 — README.md says "v2 — Close the lead" but v0.2.5+ already does AI conversations
- **Impact:** README is out of sync with reality. Anyone reading README first will be confused.
- **Fix:** Rewrite README to match current state. Or shrink README to a pointer to `docs/` and `PLAYBOOK.html`.

### KI-19 — PLAYBOOK.html mentions "OpenAI / Azure OpenAI"
- **Impact:** Misleading — only OpenAI is actually used. No Azure OpenAI dependency.
- **Fix:** Drop "/ Azure OpenAI" from PLAYBOOK.html (~line 178).

### KI-20 — `frontdesk-ai` content is not version-locked with this repo
- **Impact:** Privacy/Terms/Consent live in **two places** — `public/consent.html` here and `frontdesk-ai/public/swoop/{consent,privacy,terms}.html`. The frontdesk-ai versions are what Twilio reviewers actually fetch. They've drifted apart slightly in the past.
- **Today's mitigation:** When updating consent.html, manually mirror to frontdesk-ai. Documented in [12_TWILIO_VERIFICATION_HISTORY.md](12_TWILIO_VERIFICATION_HISTORY.md).
- **Fix:** Either (a) collapse to a single source of truth in frontdesk-ai with this repo redirecting via Cloudflare worker, or (b) add a tiny pre-commit hook that warns if `public/consent.html` changes without a matching frontdesk-ai edit.

---

## Open Bugs (none currently confirmed)

No untriaged runtime bug is currently confirmed. KI-22 remains an operational blocker (external Twilio/carrier reputation, not code) until a local production number replaces the toll-free demo line. KI-21's core code blocker shipped Sept 9, 2026 (see above) — it's now a verification task, not an open bug.

Two real runtime bugs were found and fixed within the same session they were introduced-or-discovered (Sept 9–10, 2026), so they were never carried as open items here: a false-`304` caching bug on `/api/*` JSON responses (Express's default ETag), and a DOM bug where the dashboard's empty-state element was destroyed by its own re-render. Both fixed same-day — see `BACKLOG.md` for commit references.

---

## Where to Look First When Things Break

| Symptom | First place to check |
|---|---|
| SMS not sending | Render logs → `services/twilio.js` errors. Then Twilio Console → Messaging Logs. |
| AI replies stop working | OpenAI dashboard — out of credits? Then `services/ai-agent.js` error logging. |
| Dashboard 500s | Render logs. Most often: SQLite locked (concurrent write), missing env var, or template rendering on a freshly-added column. |
| Twilio webhook 403 | Signature validation failure. Check `trust proxy = 1` is still set and `TWILIO_MOCK_MODE` is not accidentally `true` in prod. |
| Cold-start timeouts | Render Starter is active; inspect Render logs and `/health` if startup latency recurs. |
| Consent URL 404 | Cloudflare DNS or frontdesk-ai Render app. NOT this repo. |
