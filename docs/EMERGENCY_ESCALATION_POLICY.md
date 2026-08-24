# Swoop — Emergency Escalation Policy

Decided August 24, 2026. Resolves the open item flagged in `PILOT_GAP_ANALYSIS.md` ("Emergency escalation" — needs a product decision before code).

## Three tiers

**🚨 Genuine safety emergency** — active, immediate danger to life or property right now.
Examples: gas smell/suspected leak, CO alarm going off, sparking outlet or visible smoke/fire risk, active flooding with electrical involvement, sewage backup creating a health hazard.

**🟡 Urgent** — costly or painful if delayed, not life-threatening.
Examples: no heat/AC in extreme weather, no hot water, a leak that isn't actively flooding, locked out, power outage with no fire/shock risk.

**Routine** — everything else.

## Trade applicability — assigned per business at onboarding, not hardcoded

Rather than checking a hardcoded trade whitelist at runtime, each business is explicitly assigned one of two categories during onboarding:

- **Emergency-tier businesses** — plumbing, electrical, HVAC, and similar trades with genuine safety/property-damage exposure
- **Standard businesses** — cleaning and other trades with no genuine safety-emergency exposure (only urgent/routine tiers apply)

**Defaults during onboarding:**
- Known high-risk trades (matching existing admin demo-template categories — Plumber, HVAC contractor, Electrician) default to Emergency-tier
- Known low-risk trades (House cleaning, etc.) default to Standard
- Any new or unlisted trade type gets an explicit decision at onboarding — no assumed default. The operator judges the actual risk profile of that specific business rather than relying on a list that has to be kept up to date as new trades get onboarded

This is a single field on the business record (e.g. `emergency_tier_enabled`), set once during onboarding and editable later if a business's classification needs to change — not runtime trade-matching logic.

## Caller-facing response (emergency tier)

One single, hardcoded, pre-approved response — never AI-generated or improvised — used for any detected emergency, regardless of the specific scenario:

> "That sounds like it could be a safety emergency. Please call 911 right away — if you smell gas, get to fresh air first, then call 911 or your gas company's emergency line. [Business name] will follow up once you're safe."

The AI stops qualifying immediately on detection — no booking attempt, no further questions.

## Owner notification

- **Emergency:** distinctly-flagged SMS, visually separate from routine leads — not just different wording, a clearly different format/prefix.
- **Urgent:** SMS with a clear prefix (e.g. "🟡 URGENT") to avoid getting buried among routine leads.
- **Routine:** standard notification, no special flagging.

A phone call to the owner was considered and deliberately not required for pilot v1 — since the caller is always instructed to call 911 themselves, Swoop's owner-notification is a heads-up, not the emergency response itself. A well-flagged SMS is sufficient; building outbound-calling infrastructure for this is over-engineering for a 3-5 business pilot.

## Implementation notes for Claude Code

- Extend `inferUrgencyLevel()` in `server/services/leads.js` to distinguish `emergency` from `urgent`/`routine` (currently only one `high` bucket exists)
- Add an `emergency_tier_enabled` field on the business record, set during onboarding (default suggested from trade type where known, but always confirmable/overridable — never silently assumed for an unfamiliar trade)
- Gate emergency-tier detection on this field, not a hardcoded trade-name check
- Add this as a step in the admin "Add Business" flow, not just the database schema
- Add the hardcoded emergency response as a literal constant, not part of the AI system prompt — it must never be paraphrased or regenerated
- Wire emergency detection into the owner-notification build (already planned) with distinct formatting from routine/urgent notifications
- Test against real phrasing variety before pilot go-live — the existing keyword/regex approach (`emergency`, `flood`, `burst`, `gas leak`, etc.) is a starting point, not guaranteed to catch every real caller's wording
