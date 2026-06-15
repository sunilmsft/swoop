# 02 — Product Vision

## The Problem (in one sentence)

A small home-service owner with no front desk loses 3–5 jobs per week — worth $200–$500 each — because they can't pick up the phone when they're elbow-deep in a job, and the caller dials a competitor within 30 seconds.

## The Solution (in one sentence)

When a call goes unanswered, Swoop sends the caller a branded SMS within five seconds, holds the conversation with AI for up to three turns, and hands off cleanly to the owner with a written summary — so the owner walks back to the truck with the lead already qualified.

## Who It's For

**Primary persona — "Ray, the owner-operator"**
- Solo or 1–3 person trade business: plumber, electrician, HVAC tech, landscaper, cleaner, locksmith, garage-door tech, pool service, handyman
- Annual revenue $80k–$500k. Charges $150–$800 per job.
- Phone-first. Texts more than emails. Hates logins. Hates dashboards. Will open Swoop maybe twice a day, on his phone, while sitting in his truck.
- Already paying for: a Yelp listing, maybe Google Local Service Ads, definitely a domain he never updates.
- Already losing leads to: voicemails customers don't leave, callers who hang up after one ring, callers who immediately try the next result on Google.

**Explicit non-targets:**
- Multi-location HVAC chains with a dispatcher (use Avoca / ServiceTitan)
- Restaurants, salons, retail (use Podium / Birdeye — different problem shape)
- Enterprise / "we need a sales call to evaluate" (we don't have a sales team)

## Pricing Hypothesis

- **$29–$49/mo per business**, flat. No usage tiers at first — owners hate "what does this bill mean".
- **Founding cohort:** first 5 free for 30 days, $19/mo locked in for life if they stay.
- **Upgrade trigger:** revisit when MRR > $1k or when one customer crosses 1,000 missed-call texts/mo.
- **Long-run ceiling:** ~$99/mo for the standalone Swoop product. Bundles with FrontDesk AI (sibling product) can go higher.

## Design Principles (the four rules)

These are baked into `.github/copilot-instructions.md`. Every feature decision is filtered through them.

1. **Modular.** A new business is a new row in the `businesses` table, not new code.
2. **Self-service.** Owners manage their own profile, FAQs, hours. We do not run support for every config change.
3. **Light-touch.** Minimum onboarding. If the owner needs a manual, the feature is too complex.
4. **Cheap.** Keep infra near zero until traction proves otherwise. Today's whole stack costs ~$15–20/mo.

## Differentiation (vs. the field)

| Competitor | Why we are not them |
|---|---|
| **Avoca.ai** ($1B valuation) | Enterprise HVAC chains. Long sales cycles. Per-seat pricing. We go SMB, self-serve, flat-rate. |
| **Podium / Birdeye** | Reviews + payments + chat platform for restaurants/retail. Not built around the missed-call moment. |
| **GoHighLevel** | Power-user agency tool. 400 features. Owner-operators bounce off the UI on day 1. |
| **Handraiser.ai** | GoHighLevel reseller bundle at $297/$497. We undercut on price AND simplicity. |
| **Sendblue / Sent.dm** | iMessage-only or no A2P. Breaks for Android callers. We use carrier-compliant SMS from day 1. |

**Our wedge:** the cheapest, simplest product an owner-operator can adopt in 10 minutes without a sales call.

## The 4-Persona Squad Review

Every meaningful change runs through these four (see `.github/copilot-instructions.md` for full descriptions). They are our internal sanity check until we have real users.

- **Ray** (owner-operator) — Will this get me more jobs? Is it simple enough that I'd actually use it?
- **Priya** (customer success) — Will this generate support tickets I can't answer alone?
- **Jordan** (power user / competitor watcher) — Is this competitive with Avoca / Podium / Handraiser?
- **Morgan** (compliance / Twilio risk) — Will this survive a TCPA complaint or a Twilio audit?

**Rule:** all four must give 👍 (or 🤷 with rationale) before a feature ships. If anyone gives 👎, discuss before pushing.

## Three-Horizon Roadmap

**v1 — Capture the lead.** (✅ shipped)
Missed call → instant SMS → AI conversation → follow-ups → review request.

**v2 — Close the lead.** (next)
- Per-business owner auth (the v0.3 blocker)
- Owner-editable profile + FAQs + tone (true self-service)
- 10DLC for customer numbers (so we can actually onboard a paying customer)
- Owner SMS alert on handoff
- Stripe billing

**v3 — Keep the customer.** (later)
- Appointment booking via text
- Warranty / service-due reminders
- Lifecycle marketing (with explicit additional opt-in)
- AI voice agent that picks up the actual call (Avoca / Broccoli territory — only if market demands)

## What We're Deliberately NOT Building

These were flagged by the Squad and consciously deferred. See `BACKLOG.md` → "By Design" table for the full list. Highlights:

- Native mobile app — web-first works for trades. Revisit at 10+ paying customers.
- Built-in CRM — owners already have one (Housecall Pro / Jobber / ServiceTitan). Integrate, don't replace.
- Multi-tenant white-label — agency model, premature without proof.
- Analytics dashboards — premature without 30 days of real usage data.

## How Success Is Measured

Today's measure (no paying customers yet): is the Twilio pipeline unblocked + can we onboard a real customer in <30 minutes of manual work.

Once live, the only metrics that matter:
1. **Missed calls captured per customer per week** (the core promise)
2. **Reply rate within 24h** (are the messages working)
3. **Customer-reported jobs booked attributable to Swoop** (the dollars)
4. **Churn at month 2 and month 6** (does the magic wear off)

Everything else is vanity until we have those four.
