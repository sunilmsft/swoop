# Swoop — Pilot Docs Index

Master reference for `docs/`. Read this first to find the right doc — don't re-read everything from scratch. Originally indexed just the pilot-readiness doc set added in the August 24, 2026 planning session; expanded September 10, 2026 to index the full live doc set, since the untracked pre-existing docs were exactly the kind of thing that goes stale unnoticed.

**Note:** a handful of older docs were archived rather than indexed — see "Archived" at the bottom. Anything still in `docs/` and not listed below is an oversight, not intentional.

## If you're picking this up cold, read in this order

**Always first: [`docs/STATUS.md`](STATUS.md).** Rewritten at the end of every work session — it's the one file guaranteed to reflect what's true right now (what's live, the #1 remaining blocker, open/undecided items). Everything below has more depth but can go stale between sessions.

1. **STRATEGY_NOTES.html** — the core decision and why.
2. **PILOT_GAP_ANALYSIS.md** — what's actually built vs. what's missing.
3. **PILOT_READINESS_WORKBACK_PLAN.md** — the full checklist across every workstream.
4. Everything else, as needed — see table below.

## The docs

| Document | What it covers | Read this when you need to... |
|---|---|---|
| `STRATEGY_NOTES.html` | The core decision to focus on Swoop over WelcomeMat's broader repositioning, why, pricing reconsideration, 3-phase roadmap (text → prove/price → voice), dashboard simplification direction, how chat + Claude Code work together | Remember *why* we're doing what we're doing, or explain it to someone else |
| `PILOT_GAP_ANALYSIS.md` | Claude Code's honest audit of what's actually built vs. the target pilot journey, area by area, with severity | Know what's a real blocker vs. already working, before starting new build work |
| `PILOT_ONBOARDING_JOURNEY.md` | The target *experience* — what onboarding, activation, ON/OFF control, and pilot monitoring should feel like from the owner's side | Design or evaluate any owner-facing flow |
| `SWOOP_BUSINESS_ONBOARDING_OPERATIONS.md` | The operator runbook — concrete steps you actually click through for each new business, including Twilio number provisioning and emergency address setup | Actually onboard a real pilot business, step by step |
| `PILOT_READINESS_WORKBACK_PLAN.md` | The full checklist across every workstream: naming/legal, domain, marketing, pilot recruitment, feedback mechanism, internal tracking, build sequence, compliance, and a "future considerations" parking lot | Get the full picture of what's left before pilot, across more than just code |
| `EMERGENCY_ESCALATION_POLICY.md` | The three-tier (emergency/urgent/routine) policy decision, trade applicability, exact hardcoded caller-facing wording, notification approach — this is what got built and live-verified today | Understand or modify the emergency escalation feature |
| `TRADEMARK_QUESTIONS.md` | Specific questions to bring to a trademark attorney re: the "Swoop" naming risk found during research | Prep for or follow up on a lawyer consultation |
| `12_TWILIO_VERIFICATION_HISTORY.md` | The full TFV/Business-Profile compliance saga and current verification status — self-declared mandatory reading | **Before touching anything on the compliance surface**: consent page, STOP/HELP, `auto_reply_message`, the AI's anti-marketing rule |
| `04_ARCHITECTURE.md` | System diagram + code/folder map of the Swoop repo | Get oriented on where a piece of functionality lives before making a change |
| `02_PRODUCT_VISION.md` | The problem/solution in one sentence each, target persona ("Ray"), pricing hypothesis, explicit non-targets | Explain why Swoop exists, or check a feature idea against the target persona |
| `05_DECISION_LOG.md` | Chronological record of major architecture/product/compliance decisions, with what/why/revisit-if for each | Understand why something was built a certain way before proposing to change it |
| `11_RELATED_PROJECTS.md` | How the sibling repo `frontdesk-ai` relates — which compliance pages must be mirrored, what lives where | Before editing `public/consent.html` or anything that also exists on welcomematdigital.com |
| `09_ONBOARDING.md` | Step-by-step human/AI checklist for inheriting the project — account access, verification steps | A new person (or AI with no memory) needs to get fully oriented and verify access, not just read about the product |
| `SWOOP_ONBOARDING_BRIEF.html` | Share-safe collaborator brief — vision, opportunity, current status, pilot strategy, blockers, first-session path | Send to a new collaborator or investor who needs the story without repo access |
| `00_START_HERE.md` | Legacy entry-point doc — a required-reading order plus a "report back: summary/status/priorities/risks/next actions" template for a cold AI session | Rarely, on its own — `STATUS.md` + this index now serve the "get oriented" purpose. ⚠️ Its own reading order still points to two files archived in this pass (`01_EXECUTIVE_SUMMARY.md`, `10_NEXT_STEPS.md`) — needs a follow-up fix, not done as part of this reconciliation |

## Current status

See [`docs/STATUS.md`](STATUS.md) — rewritten at the end of every work session, so it's the one place guaranteed to reflect what's actually true right now. (This section used to restate a point-in-time snapshot inline; that's exactly the kind of duplication that let the forwarded-call-mode fix go stale, unnoticed, in two other places at once. Don't add status bullets back here — update `STATUS.md` instead.)

## Archived (historical, superseded)

Moved to `docs/archive/` on September 10, 2026 — not deleted, just no longer part of the live doc set: `01_EXECUTIVE_SUMMARY.md`, `03_CURRENT_STATE.md`, and `10_NEXT_STEPS.md` (all superseded by `STATUS.md`), `06_BACKLOG.md` (superseded by the root `BACKLOG.md`), and `SWOOP_MVP_PILOT_WORKBOOK.html` (superseded by the Aug 24 pilot-readiness doc set indexed above).
