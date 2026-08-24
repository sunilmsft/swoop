# Pilot Gap Analysis — Target Journey vs. Current Implementation

Captured August 24, 2026. Compares [`docs/PILOT_ONBOARDING_JOURNEY.md`](PILOT_ONBOARDING_JOURNEY.md) (the desired pilot experience) against the code actually in this repo today. Method: read `server/routes/*.js`, `server/services/*.js`, `server/db/database.js`, `public/*.html`, and cross-checked against `BACKLOG.md` and `docs/07_KNOWN_ISSUES.md` so this doesn't duplicate what's already tracked there — it points at those items where relevant.

No product code was changed to produce this file.

## Severity at a glance

| Area | Severity |
|---|---|
| Business-level configuration isolation | 🔴 Hard blocker |
| Secure owner access | 🔴 Hard blocker |
| Conditional-forwarding behavior | 🔴 Hard blocker |
| Owner notifications | 🔴 Hard blocker |
| Emergency escalation | 🔴 Hard blocker |
| ON/OFF control | 🔴 Hard blocker |
| Duplicate-event protection | 🟡 Should fix before pilot |
| Dedicated local-number provisioning | 🟡 Operational blocker, not a code blocker |
| Pilot monitoring / check-in reporting | 🟢 Can wait — needed within the pilot window, not before day one |

---

## Dedicated local-number provisioning (one per business)

**Currently exists:** The data model and webhook routing already support multiple businesses on distinct numbers — `businesses.phone` is unique, and `findBusinessByPhone()` in `server/routes/webhooks.js` looks up the right business by the Twilio `To` number on every voice/SMS webhook. Today there is exactly one live number in use: the toll-free demo line `+18337830902` (TFV-approved). A2P 10DLC brand + campaign registration — the actual production path for per-customer local numbers — is tracked as in-progress in `BACKLOG.md` ("PARALLEL: begin A2P 10DLC brand vetting").

**Missing / broken:** No code exists to buy or configure a Twilio number programmatically. Nothing in `admin.html`'s "Add Business" flow provisions a number — an operator would have to buy a number in the Twilio console and hand-enter it. The 10DLC brand/campaign itself hasn't been submitted yet (external process, not code).

**Recommended next step (Small for pilot, Large for self-serve):** For a 3–5 business pilot, manual provisioning is fine — buy each local number in the Twilio console, attach it to the shared 10DLC campaign once approved, and set `businesses.phone` by hand via the admin API. That's a checklist item, not a build. Automated self-serve provisioning (buy-on-signup, auto-attach campaign) is explicitly deferred to v0.4 in `BACKLOG.md` and should stay deferred — building it before there's a second real customer is premature.

**Severity:** Not a code blocker — the app already handles multiple numbers correctly. The real blocker is external (10DLC approval), already tracked and in progress.

---

## Business-level configuration isolation (auth/data separation)

**Currently exists:** A normalized schema (`businesses` → `leads` → `messages`/`follow_ups`) that's structurally ready to be scoped per business. `is_test` flags keep demo data out of production stats.

**Missing / broken:** There is no authentication anywhere in the codebase — no login, session, token, or API key on any route. `GET /api/leads`, `GET /api/businesses`, `PUT /api/businesses/:id`, and every admin endpoint are fully public and return data across **all** businesses to anyone with the URL. This is documented in the repo's own `docs/07_KNOWN_ISSUES.md` (KI-2) and `BACKLOG.md` ("Anyone who knows the URL... can see all businesses, all leads, all messages").

**Recommended next step (Medium):** Magic-link or phone+code auth that maps a session to a `business_id`, plus middleware that scopes every `/api/leads*` and `/api/businesses/:id*` call to that ID. This is already scoped as a single sprint in `BACKLOG.md` ("Open auth implementation sprint"). Bundle with the Secure Owner Access item below — they're the same build.

**Severity:** 🔴 Hard blocker. Already flagged 🔴 by two personas in the repo's own review notes and called out repeatedly as the top item before any real (non-demo) customer.

---

## Conditional-forwarding behavior for unanswered / declined / busy calls

**Currently exists:** A working *demo* voice flow: Twilio answers the call directly, plays a verbal consent disclosure, `<Dial>`s `business.forward_phone` for 20 seconds, and `/webhooks/voice-dial-result` classifies the outcome (`no-answer`/`busy`/`failed`/`canceled` → missed; short `completed` calls under 15s → treated as voicemail → also missed) and fires `handleMissedCall()`. A `/webhooks/voice-status` fallback exists for the case where there's no `forward_phone` at all, with an explicit guard so it doesn't double-fire when the dial path already handled it (this exact double-send bug was hit and fixed once already, per `BACKLOG.md`).

**Missing / broken:** This is still the *demo* flow, not the *production* flow the pilot journey requires. In production, the caller dials the business's **existing** number (their own cell/landline), that phone rings normally, and only on no-answer/busy/decline does the carrier forward the call to Swoop's Twilio number — Twilio never needs to dial anyone, because the owner's real phone already rang via the carrier. The current `/webhooks/voice` handler doesn't distinguish these two cases: it always plays the disclosure and always tries to `<Dial>` `forward_phone` again, which for a real forwarded call means the caller experiences a second ring and a second disclosure after already hearing the business's normal phone ring once. This is explicitly flagged as `KI-21` (🔴 blocker) in `docs/07_KNOWN_ISSUES.md` and in `docs/04_ARCHITECTURE.md` ("Production forwarding design still needed"). There's no per-business mode flag to switch behavior, and Twilio's `ForwardedFrom` metadata — which could help detect a genuinely carrier-forwarded call — is not currently captured or logged anywhere in `webhooks.js`.

**What's actually detectable (per the target journey's own caveat):** the pilot journey document itself notes that Twilio's `DialCallStatus`/`CallStatus` may not cleanly distinguish an owner's explicit "Decline" from a generic no-answer, and that this varies by carrier — that's a real constraint, not a code gap. The fix here is to test and document per-carrier behavior, not to assume the code can be made to detect something Twilio/carriers don't expose.

**Recommended next step (Medium–Large):** Add an explicit `call_mode` (or similar) column on `businesses` distinguishing `demo_dial` from `carrier_forwarded`. Branch `/webhooks/voice` so a forwarded-call business sends the SMS and ends the call without a second `<Dial>` or repeated disclosure. Log `ForwardedFrom` and all raw Twilio params during the first pilot calls to build a real per-carrier compatibility matrix before promising the "declined/busy/unanswered" distinction to any specific pilot business.

**Severity:** 🔴 Hard blocker. Already flagged 🔴 in the repo's own known-issues list; this is the single biggest gap between "demo works" and "a real customer's own number can be used."

---

## Duplicate-event protection — "exactly one text-back, zero for answered calls"

**Currently exists:** One known double-send path was already found and fixed — `/voice-dial-result` and `/voice-status` used to both call `handleMissedCall()` for the same forwarded call; the status-callback path now explicitly skips businesses that have a `forward_phone`, so the two callbacks are mutually exclusive today. `call_events` logs every dial/status callback with a `call_sid` column and an index on `(call_sid, event_source)`.

**Missing / broken:** That index isn't actually enforced as a uniqueness constraint, and nothing reads it before sending. Twilio is known to retry a webhook delivery if the app's response is slow or comes back non-2xx — if that happens on `/voice-dial-result`, `handleMissedCall()` would run a second time for the identical `CallSid`, because there is no check anywhere ("have I already sent a text for this exact call?") before the SMS goes out. Separately, `call_events` rows are inserted unconditionally with no dedup, so a retried webhook would also double-log the event. This is distinct from — and not covered by — the already-fixed dial-vs-status double-send bug.

**Recommended next step (Small):** Add a real `UNIQUE` constraint on `call_events(call_sid, event_source)` (or a small dedicated dedupe table) and a guard at the top of the missed-call path: if a row already exists for this `CallSid` with outcome `missed`/`voicemail`, skip the send and just return the existing lead. This is a narrow, well-understood fix — a few lines in `webhooks.js`/`leads.js`.

**Severity:** 🟡 Should fix before pilot. Not yet flagged in `docs/07_KNOWN_ISSUES.md` — worth adding there. Low probability per call, but a double-text is exactly the kind of visible reliability bug that erodes trust with both the pilot owner and their customer, and sits close to the compliance concerns the rest of the repo already treats seriously.

---

## Owner notifications (lead handoff, urgent/emergency escalation)

**Currently exists:** When the AI reaches its turn budget or detects owner-callback language, the lead's `lead_status` flips to `needs_attention` and a generated summary is written into `lead.notes` (`buildHandoffSummary()` in `server/services/ai-agent.js`). This is visible on the owner dashboard (`public/index.html`) if the owner is looking at it.

**Missing / broken:** There is no push of any kind to the owner — no SMS, no email, nothing. `needs_attention` only changes a row in the database; the owner finds out only by refreshing the dashboard. This is an open, unchecked item in `BACKLOG.md` under "Notifications" ("Text owner when a lead hits 'needs_attention'"). The Strategy Notes doc's own stated direction — "SMS-first reporting... not a dashboard the owner has to check" — is not built for the real-time case at all, only imagined for weekly summaries.

**Recommended next step (Small–Medium):** Send an SMS to the business's own contact number via the already-working `sendSMS()` whenever a handoff fires (`isHandoff === true` in `handleInboundSMS`) or when `inferredUrgency === 'high'`. The handoff summary text already exists and can be reused verbatim. This mostly wires up infrastructure that's already built.

**Severity:** 🔴 Hard blocker. The entire pitch — and the target journey's explicit requirement ("Owner receives lead/urgent notifications through the simplest reliable channel") — depends on the owner finding out about a lead promptly. Without this, a pilot owner has to babysit the dashboard, which defeats the point of the product.

---

## Emergency escalation handling

**Currently exists:** `inferUrgencyLevel()` in `server/services/leads.js` does keyword/regex matching (`emergency`, `flood`, `burst`, `no heat`, `gas leak`, etc.) to set `urgency_level = 'high'` and `lead_status = 'needs_attention'`. The AI system prompt (`buildSystemPrompt()`) includes the business's own `emergency_policy` text and an instruction to "prioritize urgency and escalate fast" when it detects emergency/risk language.

**Missing / broken:** "Escalate" in the current code means only: change a status flag and end the AI conversation sooner. It does not notify anyone (same gap as above) and does not distinguish between an **urgent property issue** (e.g., "no heat tonight") and a **genuine safety emergency** (e.g., a gas leak, where the right customer-facing answer may be "call 911, then we'll follow up") — the pilot onboarding journey explicitly treats these as two separate test scenarios (#6 and #7 in its go-live checklist), but the code only has one bucket, `urgency_level = 'high'`, for both. The regex is also a blunt heuristic that hasn't been tested against real customer phrasing — false negatives (a genuine emergency described in words the regex doesn't match) are untested and unmeasured.

**Recommended next step (Medium):** Needs a short product decision first (exact safety-emergency phrasing, and where the line is between "urgent job" and "call 911") before writing code. Once decided: add a distinct safety-emergency branch that responds with immediate safety guidance separate from the routine urgency escalation, and wire it into the owner-notification build above so a true emergency alerts the owner differently (or faster) than a routine handoff.

**Severity:** 🔴 Hard blocker. This is a safety/liability question, not just a UX gap, and the target journey explicitly requires it to be tested correct before any pilot business goes live.

---

## Secure owner access

**Currently exists:** Same underlying schema as the isolation item above; nothing owner-facing requires a login today. Destructive endpoints (e.g., `DELETE /api/businesses/:id/leads`) at least have a production env-var guard (`ALLOW_LEAD_PURGE`), but that protects against accidental data loss, not unauthorized access.

**Missing / broken:** No authentication layer exists at all — this is the access-control half of the same gap as "business-level configuration isolation" above, called out separately here because the journey document treats them as distinct concerns (who can log in, vs. what they can see once in). Today, URL obscurity is the only protection, which `docs/07_KNOWN_ISSUES.md` (KI-2) already calls out directly as unacceptable for a real customer.

**Recommended next step (Medium):** Same build as the isolation item — a magic-link or phone+code login is both the authentication and, combined with scoped queries, the authorization. Don't build these as two separate efforts.

**Severity:** 🔴 Hard blocker — identical urgency to the isolation gap above. Repeatedly named as the single biggest blocker across `BACKLOG.md` and `docs/07_KNOWN_ISSUES.md`.

---

## The ON/OFF control and its behavior

**Currently exists:** A single related field: `businesses.ai_enabled` (boolean, default on), editable only via `PUT /api/businesses/:id` — there is no dashboard UI for the owner to flip it themselves (`BACKLOG.md`: "Toggle AI on/off from dashboard" is still open). Even where it's set, `ai_enabled` only gates the AI-generated reply step inside `handleInboundSMS()`.

**Missing / broken:** There is no real ON/OFF control anywhere close to what the pilot journey describes. Specifically, flipping `ai_enabled` off does **not** stop the missed-call auto-reply SMS (`handleMissedCall()` sends unconditionally, with no check of `ai_enabled` at all), does **not** stop scheduled follow-ups from firing (`processDueFollowUps()` has no such check either), and there is no owner-facing UI, no visible status/last-changed indicator, and no "alert the owner to conversations that may need manual follow-up" behavior on pause — all of which the target journey specifies explicitly.

**Recommended next step (Medium):** Add a `businesses.active` (or `paused_at`) column. Add short-circuit guards at the top of `handleMissedCall()`, `handleInboundSMS()`, and inside the `processDueFollowUps()` loop so a paused business does none of: new auto-replies, new AI replies, or follow-up sends — while leaving existing leads/messages untouched (already naturally true, since pausing wouldn't delete anything). Add a dashboard toggle with a clear status banner ("Swoop is ON / PAUSED since [time]") and immediate confirmation on change. This is a small, well-isolated change once decided, but broader in scope than the existing "AI on/off" backlog item — it needs to gate the whole pipeline, not just the AI layer.

**Severity:** 🔴 Hard blocker. The pilot onboarding journey's core trust promise — "you remain fully in control and can pause or resume it whenever you want" — is currently just not true of the running system.

---

## Pilot monitoring / check-in reporting

**Currently exists:** `GET /api/dashboard` and the admin equivalents (`/api/admin/overview`, `/api/admin/businesses`) already expose real-time counts: leads by status, messages sent/received, pending follow-ups, AI turns, handoffs, and 24-hour call/missed-call/answered-call counts via the `call_events` table. That's a reasonable raw-data foundation for someone actively querying it.

**Missing / broken:** Nothing packages this into the check-ins the pilot journey describes. There's no scheduled weekly-summary SMS or email to the owner (the Strategy Notes doc's own stated direction — "SMS-first reporting" — isn't built). There's no aggregate view built specifically around the invariants the journey wants monitored day-to-day (does every eligible call generate exactly one text-back? do answered calls generate zero? how many opt-outs this week?) — opt-out state is stored per-lead but never rolled up anywhere. A full analytics dashboard is explicitly and correctly deferred elsewhere in `BACKLOG.md` ("premature — need real data from real customers first"), and that reasoning still holds; this gap is narrower than that.

**Recommended next step (Small–Medium):** For the first few days of pilot, an operator can query `/api/admin/businesses` directly — no build required to start. Before the 3–4 week unattended window runs long, add a cron-based weekly-summary SMS per business (reusing `sendSMS()` and the existing dashboard queries scoped by `business_id`) and a lightweight invariant-check script/view (calls vs. texts sent, opt-outs, AI failures) an operator can glance at between check-ins.

**Severity:** 🟢 Can wait relative to the items above — not needed to *start* a pilot, but should land before the pilot's own weekly check-in cadence needs it, i.e., within the pilot window rather than before day one.
