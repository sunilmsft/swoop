# Swoop — Business Onboarding Operations Runbook

Captured August 24, 2026. This is the operator checklist — the concrete steps you follow for each new pilot business. See `PILOT_ONBOARDING_JOURNEY.md` for the target experience from the business owner's perspective; this doc is "what you actually click and configure."

## Phase 1 — Pre-qualification (before scheduling anything)

- [ ] Confirm the business's trade (determines Emergency-tier default)
- [ ] Ask what phone system their public number runs on — standard cell/landline carrier, or VoIP (Google Voice, RingCentral, Grasshopper, etc.). VoIP systems often don't support carrier-code conditional forwarding the same way — flag this before committing an onboarding slot.
- [ ] Confirm you're ready to spend real time on the full sequence below — don't start onboarding conversations faster than you can support them.

## Phase 2 — Discovery conversation (concierge call with the owner)

Collect everything listed in `PILOT_ONBOARDING_JOURNEY.md`'s "Information collected during onboarding" section, including:
- [ ] **Physical business address** (needed for the emergency address step below — must be the business's real location, not yours)
- [ ] Everything else on that list (services, hours, tone, urgency definitions, etc.)

## Phase 3 — Twilio number provisioning

- [ ] Buy a dedicated local Twilio number for this business (Console → Develop → Phone Numbers → Manage → Buy a Number → US, Voice + SMS capability)
- [ ] **Create and assign an emergency address specific to this business's own location** — not WelcomeMat's, not reused from another business. One registered address per business number, matching where that business actually operates.
- [ ] Note: SMS on a freshly purchased number will show "A2P 10DLC registration required" until that's cleared — do not promise reliable SMS delivery to this business until registration is confirmed for their number (see Phase 6)

## Phase 4 — Admin console configuration

- [ ] Go to `admin.html`, use "Add New Business" (or edit if already created)
- [ ] Set Business Name, Owner Name, Forward Phone (owner's cell)
- [ ] Set **Trade Type** — confirm the auto-suggested Emergency-tier checkbox default is correct for this business, adjust if needed (don't assume the default is always right)
- [ ] Fill in Business Description, Auto-Reply Message
- [ ] Fill in grounding data (what the AI should know about this business)
- [ ] Save & Update — confirm the save actually took (check the confirmation message once that fix is live, or reload and verify)

## Phase 5 — Internal testing (before touching the owner's real number)

- [ ] Run through the 11 test scenarios from `PILOT_ONBOARDING_JOURNEY.md` using the Test Console (`?dev=1`) in mock mode
- [ ] Confirm all three urgency tiers behave correctly for this specific business's Trade Type / Emergency-tier setting
- [ ] Fix anything that doesn't match expected behavior before proceeding

## Phase 6 — Activation session (guided, with the owner)

- [ ] Confirm A2P 10DLC registration status for this number — do not go live on a number where SMS isn't cleared
- [ ] Give the owner carrier-specific conditional-forwarding instructions; walk them through enabling it live on the call
- [ ] Run the real-world test: call the business's public number, let it go unanswered/busy/declined, confirm it forwards correctly to the new Twilio number (check the Calls Log tab if uncertain)
- [ ] Repeat the 11 test scenarios live, this time for real, with the owner watching
- [ ] Owner reviews and approves the customer-facing messages before going live

## Phase 7 — Go live

- [ ] Mark the business active
- [ ] Confirm owner knows how to use the ON/OFF control once it exists
- [ ] Schedule first-few-days check-in
- [ ] Add to the internal operational tracker (per `PILOT_READINESS_WORKBACK_PLAN.md` §6)

## Notes / open dependencies

- The A2P 10DLC brand/campaign registration itself is a one-time setup (not per-business) — but is intentionally on hold pending the trademark/naming resolution. This entire runbook assumes that's been resolved before Phase 6 for any given business; earlier phases can proceed in parallel.
- Production forwarding mode (vs. the current demo-dial flow) is still a gap per `PILOT_GAP_ANALYSIS.md` — Phase 6's live call test depends on that being built first.
