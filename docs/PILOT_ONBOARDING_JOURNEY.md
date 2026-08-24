# Swoop — Pilot Onboarding Journey (Target Experience)

Captured August 24, 2026. This describes the **desired** pilot experience — not a claim that the current implementation already supports every part of it. See the companion gap analysis for what's built vs. what's missing.

## Onboarding (concierge, not self-serve)

Once an owner says yes, we schedule a short onboarding conversation. They keep their existing customer-facing number; eligible unanswered calls conditionally forward to a dedicated Swoop/Twilio number.

**"Unanswered" for pilot purposes includes:**
- Rings, not answered
- Owner actively declines/rejects
- Owner's line is busy

Swoop doesn't need to determine *why* a call was unanswered — if the carrier forwards it to Swoop's number, that triggers exactly one text-back. If the owner answers the original call, Swoop is never reached and nothing is sent.

**Carrier variability caveat:** forwarding behavior varies by carrier, phone, and voicemail config — validate these scenarios per pilot business before promising they're supported. (Note: Twilio call status may not always cleanly distinguish "declined" from generic "no-answer" depending on carrier — confirm what's actually detectable.)

## Information collected during onboarding

- Business name, type, owner's name
- Existing customer-facing number and carrier
- Owner's preferred contact number
- Services offered and service area
- Business hours
- What Swoop should collect from callers
- What counts as urgent/emergency for this business
- How and when the owner wants to be notified
- Tone and style Swoop should use
- Preferred callback/service windows (no confirmed appointment promises)

## Provisioning and testing (before touching the owner's live number)

- Provision a dedicated Twilio local number for the business
- Configure messages and qualification flow
- Test internally first

## Activation

Guided activation session: give the owner exact carrier-specific conditional-forwarding instructions, walk them through enabling it. They shouldn't have to research carrier codes alone.

**Test scenarios run together before go-live:**
1. Phone rings until unanswered
2. Owner presses Decline while ringing
3. Call arrives while owner is on another call
4. Owner answers the original call normally (control case — no text should fire)
5. Routine service request handled through text
6. Urgent property issue identified and escalated
7. Genuine safety emergency identified and handled appropriately
8. Caller doesn't respond to the initial text
9. Qualified lead handed to the owner
10. Owner pauses and resumes Swoop
11. Owner disables conditional forwarding as the carrier-level fallback

**Invariant to verify:** unanswered/declined/busy → exactly one text-back each. Normally answered → zero text-backs.

Owner reviews and approves customer-facing messages before activation.

## Owner control: ON / OFF

Owner has direct, immediate control — no need to contact us.

**ON:** new eligible unanswered calls trigger text-back + qualification.

**PAUSED:**
- New forwarded calls do not trigger automatic texts
- Scheduled follow-ups stop
- AI responses in active conversations stop
- Existing leads and conversation history preserved
- Owner is alerted to conversations that may need manual follow-up

Interface must clearly show current status, when it last changed, and what each state means. Immediate confirmation on every status change.

Conditional call forwarding remains the owner's independent carrier-level fallback — but they shouldn't need to touch phone settings just to pause Swoop temporarily.

## Pilot monitoring (3–4 weeks)

Owner receives lead/urgent notifications through the simplest reliable channel — likely SMS initially — with a secure, simple dashboard if ready.

**Check-ins (first few days, then weekly) should surface:**
- Is forwarding/text-back working reliably?
- Do declined and busy calls behave as expected?
- Does each eligible call generate exactly one text-back?
- Do answered calls correctly generate none?
- Are leads useful and sufficiently qualified?
- Does Swoop represent the business appropriately?
- Do owners understand and trust the ON/OFF control?
- What's confusing or needs manual help?
- What should eventually become self-service?

At pilot end: review results with the owner, decide whether to continue.

## The experience, in one line

> "Tell us how your business works, approve how Swoop communicates with your customers, test it with us, and we'll help you turn it on. Once live, you remain fully in control and can pause or resume it whenever you want."

## Ask for the first Claude Code pass

Compare this journey against the current implementation. Identify gaps clearly, especially:
- Dedicated local-number provisioning
- Business-level configuration isolation
- Conditional-forwarding behavior for unanswered / declined / busy calls
- Duplicate-event protection (the "exactly one text-back" invariant)
- Owner notifications
- Emergency escalation
- Secure owner access
- The ON/OFF control and its behavior
- Pilot monitoring
