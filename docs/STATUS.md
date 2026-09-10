# Swoop — Current Status

**Read this first in any new session.** For full history and background, see `docs/PILOT_DOCS_INDEX.md`. This file gets fully rewritten at the end of each work session — it's a snapshot, not a log.

Last updated: September 9/10, 2026 (late session)

## What's live in production right now

- Carrier-forward call routing (`call_mode`: `direct_dial` vs `carrier_forward`) — dedicated local numbers skip the redial/disclosure and go straight to missed-call SMS
- Duplicate-event protection (Twilio webhook retries can't double-fire)
- Accurate consent metadata per call_mode (no more false "disclosure was played" claim on carrier-forward calls)
- Admin console password gate (shared password, session-based) covering `admin.html` + `index.html` + their APIs — NOT covering `/webhooks/*` or `/api/test/*`
- 401 handling fix (session expiry now redirects to `/login` instead of showing a broken dashboard)
- API caching bug fix (JSON endpoints no longer served as false HTTP 304s)

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
