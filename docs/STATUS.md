# Swoop — Current Status

**Read this first in any new session.** For full history and background, see `docs/PILOT_DOCS_INDEX.md`. This file gets fully rewritten at the end of each work session — it's a snapshot, not a log.

Last updated: September 10, 2026 (end of session)

## What's live in production right now

- Carrier-forward call routing (`call_mode`: `direct_dial` vs `carrier_forward`) — dedicated local numbers skip the redial/disclosure and go straight to missed-call SMS
- Duplicate-event protection (Twilio webhook retries can't double-fire)
- Accurate consent metadata per call_mode (no more false "disclosure was played" claim on carrier-forward calls)
- Admin console password gate (shared password, session-based) covering `admin.html` + `index.html` + their APIs — NOT covering `/webhooks/*` or `/api/test/*`
- 401 handling fix (session expiry now redirects to `/login` instead of showing a broken dashboard)
- API caching bug fix (JSON endpoints no longer served as false HTTP 304s)
- Dashboard empty-state bug fixed (commit `ca7f7f9`) — `#empty-state` was coded as a child of `#lead-list`, so the first lead-list refresh destroyed it; the next 30s auto-refresh then hit `document.getElementById('empty-state') === null` and threw, which the dashboard's generic error handling mislabeled as "Cannot reach API source" / Offline, even though the server was healthy. Fixed by making `#empty-state` a sibling instead of a child. Deployed and verified live.

## Documentation reconciliation completed today

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

## Process reminders (hard-won this session)

- Never trust a "committed and pushed" claim — always verify with `git log`/`git status`, then confirm the matching commit is live in Render's Events tab.
- Stay in manual mode (not auto-accept) for anything touching real logic, not just cosmetic changes.
- Documentation drifts silently and duplicates worse than code does — nothing enforces it at build time. The forwarded-call-mode fix went stale in two different backlog entries at once before anyone noticed. `CLAUDE.md` now has standing rules for `docs/STATUS.md` and `BACKLOG.md` specifically to keep this from recurring.
