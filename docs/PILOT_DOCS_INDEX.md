# Swoop — Pilot Docs Index

Master reference for the docs created during the August 24, 2026 planning session. Read this first to find the right doc — don't re-read everything from scratch.

**Note:** this indexes the *pilot-readiness doc set* added this session. The pre-existing project docs (`00_START_HERE.md`, `04_ARCHITECTURE.md`, `SWOOP_ONBOARDING_BRIEF.html`, etc.) are the original project documentation and aren't duplicated here.

## If you're picking this up cold, read in this order

1. **STRATEGY_NOTES.html** — start here. The core decision and why.
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

## Status as of August 24, 2026

- ✅ Emergency escalation tiering — built, tested, live-verified with a real call/text
- ✅ Trade type + emergency-tier fields — added to admin console, persistence bug fixed
- ⏳ Trademark question — sent to multiple attorneys, awaiting response
- ⏳ A2P 10DLC registration — intentionally on hold pending naming resolution
- ⏳ Production forwarding mode, auth/isolation, ON/OFF control — not yet started (see `PILOT_GAP_ANALYSIS.md` for full list)
- One local Twilio test number purchased (`+1 425 645 5323`) for carrier-forwarding testing, separate from the naming/A2P timeline
