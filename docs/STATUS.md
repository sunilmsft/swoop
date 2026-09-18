# Swoop — Current Status

**Read this first in any new session.** For full history and background, see `docs/PILOT_DOCS_INDEX.md`. This file gets fully rewritten at the end of each work session — it's a snapshot, not a log.

Last updated: September 18, 2026 (end of session)

## What's live in production right now

- Carrier-forward call routing (`call_mode`: `direct_dial` vs `carrier_forward`) — dedicated local numbers skip the redial/disclosure and go straight to missed-call SMS
- Duplicate-event protection (Twilio webhook retries can't double-fire)
- Accurate consent metadata per call_mode (no more false "disclosure was played" claim on carrier-forward calls)
- Admin console password gate (shared password, session-based) covering `admin.html` + `index.html` + their APIs — NOT covering `/webhooks/*` or `/api/test/*`
- 401 handling fix (session expiry now redirects to `/login` instead of showing a broken dashboard)
- API caching bug fix (JSON endpoints no longer served as false HTTP 304s)
- Dashboard empty-state bug fixed (commit `ca7f7f9`) — `#empty-state` was coded as a child of `#lead-list`, so the first lead-list refresh destroyed it; the next 30s auto-refresh then hit `document.getElementById('empty-state') === null` and threw, which the dashboard's generic error handling mislabeled as "Cannot reach API source" / Offline, even though the server was healthy. Fixed by making `#empty-state` a sibling instead of a child. Deployed and verified live.
- Twilio Console config for the toll-free demo number (`+18337830902`) verified directly against the live Twilio API — VoiceUrl/VoiceMethod, status callback, and SMS URL all already pointed at the right webhooks with POST. No change was needed; this was confirmed, not assumed.
- `PATCH /api/leads/:id` extended to accept `ai_handoff_done`, `ai_turn_count`, and `urgency_level` (commit `a4af847`) — lets one stuck lead be reset without wiping a business's other leads (the only prior option, `DELETE /api/businesses/:id/leads`, was too broad).
- **Post-handoff SMS silence fixed** (commit `8092476`) — once a lead's `ai_handoff_done=1`, any further inbound text used to get zero reply at all (`generateReply` returned null immediately and the whole AI block was skipped). Added `generatePostHandoffReply()`: a lightweight, facts-only OpenAI call (no qualifying questions, no scheduling commitments) with a deterministic ack-template fallback when AI is unavailable.
- **Post-handoff `lead_status` downgrade bug fixed** (commit `8092476`) — a routine post-handoff follow-up text no longer resets an already-escalated (`needs_attention`) lead back to `engaged`; only emergency/urgent tiers can change status once a lead is escalated.
- **Handoff auto-reset** (commit `8092476`, threshold tuned 24h → 2h in commit `102461f`) — a handed-off lead that goes quiet for `HANDOFF_RESET_HOURS` (currently 2h, named constant in `server/services/leads.js`) re-enters the normal AI intake flow on its next text instead of getting the post-handoff ack forever.
- **Post-handoff capability-check answers refined to three explicit outcomes** (commit `6e8235b`), verified live against a real OpenAI key and Mike's Plumbing's actual production data: a service explicitly in `business.services` → confident yes; a clearly different trade (e.g. asking a plumber about roofing) → confident, polite no; a plausible-sounding but unlisted request (e.g. faucet repair) → defers to the owner instead of guessing either way.
- **Unreliable LLM-driven "ask name and city together" step made deterministic** (commit `915bfc1`) — a live demo run showed the model didn't reliably follow that instruction even though the system prompt said to. `generateReply` now returns a fixed template ("Got it — what's your name, and what city is this for?") on the very first AI turn when both are unknown, without calling OpenAI at all.
- **Handoff summary rewritten** (commit `915bfc1`) — was a raw `" | "`-joined dump of every inbound message, which got unreadable fast and, after repeated test resets on the same lead, mixed unrelated old messages into one blob. Now a short structured summary built from the lead's actual captured fields (name, location, first request, urgency).
- "First name" wording changed to "name" throughout the AI system prompt's intake-flow instructions (commit `915bfc1`).

## Live production DB access (working pattern established this session)

There is no direct DB shell/SQL access to the Render instance from a local machine. The only way to read or write live SQLite data is through the deployed app's own authenticated `/api/*` routes: log into `https://swoop-x79g.onrender.com/login` with the production `ADMIN_PASSWORD` to get a session cookie, then call `/api/businesses`, `/api/leads`, `/api/leads/:id`, etc. over HTTPS. This was used repeatedly tonight to confirm real production state (Twilio config, specific lead rows) instead of trusting seed defaults or local dev data, and to manually un-stick specific leads via `PATCH /api/leads/:id` — verified each time by an independent re-fetch afterward, not just the write response.

## Documentation reconciliation completed (Sept 9–10, 2026 session)

`docs/`, `BACKLOG.md`, `CLAUDE.md`, and `.github/copilot-instructions.md` had drifted from what's actually shipped and from each other — this got a full pass:

- **`BACKLOG.md` + `docs/PILOT_GAP_ANALYSIS.md`** reconciled against shipped code (commits `4591082`, `d6d1f94`) — stale duplicate-tracked items closed, new done entries added, scattered per-business-auth items consolidated into one prioritized entry.
- **Docs reconciliation, three phases:**
  - **Phase 1** (commit `b1dc2ea`) — fixed an actively-wrong claim in `docs/08_AI_CONTEXT.md`'s "Hard Operating Rules": it said to always push as a separate, later step after commit ("never combine commit + push in one command"), which directly contradicted the real `CLAUDE.md`-governed workflow.
  - **Phase 2** (commit `ad226c0`) — rewrote `docs/PILOT_DOCS_INDEX.md` into the real source of truth: `docs/STATUS.md` added as the mandatory first-read, real index entries added for 8 previously-unindexed docs, 5 superseded docs (`01_EXECUTIVE_SUMMARY.md`, `03_CURRENT_STATE.md`, `10_NEXT_STEPS.md`, `06_BACKLOG.md`, `SWOOP_MVP_PILOT_WORKBOOK.html`) moved to `docs/archive/` via `git mv` (history preserved, nothing deleted), and all 6 resulting broken relative links in other docs fixed so nothing points at a dead path.
  - **Phase 3** (commit `6af14d1`) — reconciled the two partially-stale files rather than archiving them: `docs/04_ARCHITECTURE.md` now documents `server/middleware/auth.js` and the `call_mode` split (folder map, component detail, and its "production forwarding" section rewritten from "still needed" to "shipped"); `docs/07_KNOWN_ISSUES.md` had KI-2 (auth) and KI-21 (production forwarding) marked resolved and KI-9 (DB backups — predates this session, verified directly in code) marked resolved, with every other catalogued issue reviewed and left open where still genuinely open.
- **Squad Review / Backlog Sync retirement** (commit `4784b46`) — `.github/copilot-instructions.md`'s Squad Review gate (the Ray/Priya/Jordan/Morgan approval table) hadn't actually been followed all session despite `CLAUDE.md` pointing to it as authoritative. Marked retired/historical in place (content kept, not deleted) rather than left silently unused; `CLAUDE.md`'s commit/push rule is now the sole documented process governing commits.

## The #1 remaining blocker

**Business-level data isolation.** The password gate keeps strangers out, but does NOT scope data per business — anyone logged in currently sees every business's leads/data mixed together. This blocks running more than one pilot business at once. The fix is already designed in `BACKLOG.md` as one sprint (magic-link or phone+code auth mapped to `business_id`, plus middleware scoping every relevant API call). Not yet built.

## Carrier forwarding test results

| Carrier | Status |
|---|---|
| T-Mobile | ✅ Confirmed working, no special steps |
| AT&T | ✅ Confirmed working, requires disabling iOS 18+ Live Voicemail first |
| Xfinity Mobile | ❌ Broken — escalated to Xfinity tier 3 support, awaiting response |
| Native Verizon | ❓ Untested — plan was a Visible SIM to test independently of Xfinity |

## Open, undecided

- **Trademark:** awaiting final verification of attorney Lizmary López Álvarez's Puerto Rico bar status (informal search inconclusive, but 21 live USPTO trademarks under her name is strong independent evidence). Decision pending on the $250 consultation. Other attorneys contacted, no responses yet.
- **Naming/rebrand:** paused pending the trademark question.

## Next big topic (flagged, not yet started)

**The owner-facing dashboard/console needs a real UX rethink before onboarding real pilot businesses.** Current console feels too complex and not built mobile-first. What's needed: something simple, easily accessible and navigable on a phone, that gives the business owner a clear understanding of how things stand the moment they open it — not something they have to study. Hasn't been designed yet — this is the next major thing to work through with fresh focus.

## Known open item from tonight

A `BACKLOG.md` update (new "Done (Sept 17, 2026)" section documenting this session's post-handoff-silence fixes) was drafted locally during the session but, as of this file's last edit, had not yet been committed — it needs explicit sign-off (per the standing diff-then-confirm rule) before it's pushed.

## Process reminders (hard-won this session)

- Verify the actual Twilio Console config via the live API before assuming it's misconfigured — tonight's "is VoiceUrl wrong" concern turned out to already be correct; the real bug was downstream in the app's own handoff-state logic, not Twilio config.
- A lead stuck in `ai_handoff_done=1` goes completely silent on every further text, with no error logged — it looks like nothing happened at all. There are now two ways out: `PATCH /api/leads/:id` for a manual reset, and the automatic `HANDOFF_RESET_HOURS` (currently 2h) reset after inactivity.
- Don't trust the LLM to reliably follow a multi-field instruction like "ask name and city together," even when the system prompt says to do it every time — a live demo showed it silently didn't. Enforce single-shot, high-repetition flow steps deterministically in code instead of relying only on the system prompt.
- AI-driven prompt changes need testing with a real, working OpenAI key, not just mock mode — mock-mode/invalid-key testing only proves the code path runs, not that the replies are good. Real-key testing this session caught a hallucinated "yes" to a service that wasn't actually listed, and a redundant "owner will reach out" sign-off tacked onto answers that had already fully answered the question.
- Never trust a "committed and pushed" claim — always verify with `git log`/`git status`, then confirm the matching commit is live in Render's Events tab.
- Documentation drifts silently; the standing `CLAUDE.md` rules for `docs/STATUS.md` and `BACKLOG.md` exist specifically to catch this.
