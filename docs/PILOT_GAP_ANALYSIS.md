# Pilot Gap Analysis — Target Journey vs. Current Implementation

Captured August 24, 2026. Compares [`docs/PILOT_ONBOARDING_JOURNEY.md`](PILOT_ONBOARDING_JOURNEY.md) (the desired pilot experience) against the code actually in this repo today. Method: read `server/routes/*.js`, `server/services/*.js`, `server/db/database.js`, `public/*.html`, and cross-checked against `BACKLOG.md` and `docs/07_KNOWN_ISSUES.md` so this doesn't duplicate what's already tracked there — it points at those items where relevant.

No product code was changed to produce this file.

**Updated Sept 10, 2026:** four items below — "Secure owner access," "Business-level configuration isolation," "Conditional-forwarding behavior," and "Duplicate-event protection" — were revised to reflect what's shipped since the original pass. Everything else in this document is unchanged from August 24 and has not been re-verified against current code.

## Severity at a glance

| Area | Severity |
|---|---|
| Business-level configuration isolation | 🔴 Hard blocker — top remaining item (Sept 10 update) |
| Secure owner access | 🟢 Login shipped (Sept 10 update) — see isolation above |
| Conditional-forwarding behavior | 🟡 Core fix shipped (Sept 10 update) — carrier verification still open |
| Owner notifications | 🔴 Hard blocker |
| Emergency escalation | 🔴 Hard blocker |
| ON/OFF control | 🔴 Hard blocker |
| Duplicate-event protection | 🟢 Shipped (Sept 10 update) |
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

**Update (Sept 10, 2026):** A single shared-password, session-based login gate shipped (commits `2e866b2`, `777a71b`, `ca7f7f9`) covering the whole owner/admin console — see "Secure owner access" below. That closed the login half of the twin gap these two sections describe, but not this one: the gate is one password for the entire app, not one identity per business, so an authenticated session still has zero `business_id` scoping. Everything described below as missing is **still missing, unchanged**. This is now the single largest remaining hard blocker before any pilot with more than one business — the shared password stops a stranger from finding the console by URL, but does nothing to stop one business's owner (or anyone else who has the password) from seeing every other business's leads, messages, and settings.

**Currently exists:** A normalized schema (`businesses` → `leads` → `messages`/`follow_ups`) that's structurally ready to be scoped per business. `is_test` flags keep demo data out of production stats. A session now exists (see "Secure owner access" below) but carries no `business_id` — there's nothing yet to scope by.

**Missing / broken:** No query anywhere filters by `business_id`. `GET /api/leads`, `GET /api/businesses`, `PUT /api/businesses/:id`, and every admin endpoint return data across **all** businesses to any authenticated session, because there is exactly one shared credential rather than one per business. This is documented in the repo's own `docs/07_KNOWN_ISSUES.md` (KI-2) and `BACKLOG.md` ("Anyone who knows the URL... can see all businesses, all leads, all messages") — the shared-password gate narrows that from "anyone who knows the URL" to "anyone who knows the one password," which is progress, but does not resolve the underlying multi-tenancy gap.

**Recommended next step (Medium):** Per-business login (magic-link or phone+code) that maps a session to a `business_id`, plus middleware that scopes every `/api/leads*` and `/api/businesses/:id*` call to that ID. Already scoped as a single sprint in `BACKLOG.md` ("Open auth implementation sprint"). The shared-password gate that shipped should be treated as an interim step, not a substitute for this build.

**Severity:** 🔴 Hard blocker — now the top remaining item on this list. It was bundled with "Secure owner access" as one build; that bundling is now half-finished, and this is the unfinished half.

---

## Conditional-forwarding behavior for unanswered / declined / busy calls

**Update (Sept 10, 2026): core fix shipped, one recommended follow-up still open.** A `businesses.call_mode` column now exists (`direct_dial` default = today's demo flow, unchanged; `carrier_forward` = new). `/webhooks/voice` branches on it: a `carrier_forward` business skips the disclosure and the `<Dial>` entirely and goes straight into `handleMissedCall()`, exactly the fix this section recommended. `/webhooks/voice-status` was also updated so it doesn't double-fire for `carrier_forward` businesses, and a real `UNIQUE`-index-backed dedup guard (see "Duplicate-event protection" below, also addressed) stops a Twilio webhook retry from sending a second text for the same call. Settable per business from `admin.html`. **Not done:** this section's other recommendation — logging `ForwardedFrom` and raw Twilio params to build a per-carrier compatibility matrix — was not implemented; `ForwardedFrom` is still not captured anywhere in `webhooks.js`. Per-carrier real-world behavior (see the caveat below) also still hasn't been tested, since that requires live pilot calls, not code.

**Currently exists:** Both flows now: the original *demo* flow (Twilio answers directly, disclosure, `<Dial>` `forward_phone`, `/webhooks/voice-dial-result` classifies the outcome) for `direct_dial` businesses, and the *production* carrier-forwarded flow described below for `carrier_forward` businesses. `/webhooks/voice-status` fallback and its double-send guard (originally described here) still exist and were extended to cover the new mode too.

**Missing / broken:** `ForwardedFrom` and other raw Twilio call params are still not logged anywhere, so there's no data yet to build the per-carrier compatibility matrix this section originally called for. The distinction between an owner's explicit "Decline" and a generic no-answer — which the target journey's own caveat already flags as carrier-dependent and possibly not cleanly detectable — remains untested against real carriers; it can only be validated with live pilot calls, not more code.

**What's actually detectable (per the target journey's own caveat):** unchanged from the original pass — Twilio's `DialCallStatus`/`CallStatus` may not cleanly distinguish "Decline" from generic no-answer, and this varies by carrier. That's a real constraint, not a code gap, and still needs to be tested and documented per-carrier during the pilot's first live calls.

**Recommended next step (Small):** Before relying on this with a real pilot business's dedicated number, log `ForwardedFrom` and the full raw Twilio param set on every `carrier_forward` call for the first pilot business, and use those first real calls to build the per-carrier compatibility notes this section always intended. The code-side blocker is resolved; this is now a verification/logging task, not a build.

**Severity:** 🟡 Core fix shipped — no longer a hard code blocker. Downgraded from 🔴 because the actual branching bug (double disclosure/double ring on a forwarded call) is fixed; kept above 🟢 because the recommended carrier-verification logging hasn't happened yet and shouldn't be skipped before a real pilot business goes live on a dedicated number.

---

## Duplicate-event protection — "exactly one text-back, zero for answered calls"

**Update (Sept 10, 2026): shipped.** `call_events(call_sid, event_source)` now has a real partial `UNIQUE` index (`WHERE call_sid IS NOT NULL`, wrapped in try/catch at startup so a DB with pre-existing duplicate rows can't crash the boot). `logCallEvent()` reports back whether its insert actually happened or was rejected as a duplicate, and `/voice-dial-result`, `/voice-status`, and the new `carrier_forward` path in `/voice` all now only call `handleMissedCall()` when that insert was the first for that `CallSid`/event-source pair — a retried Twilio webhook delivery is now a no-op instead of a second text. Live-tested by resending the same `CallSid` and confirming exactly one lead/message was created.

**Currently exists:** Everything described below, now fully addressed — see the mechanism above.

**Missing / broken:** Nothing outstanding on this specific item. Not yet reflected in `docs/07_KNOWN_ISSUES.md`, which this section originally noted should be updated — still worth doing, now to mark it resolved rather than open.

**Recommended next step:** None remaining. Original recommendation (a real `UNIQUE` constraint plus a guard before the send) is exactly what shipped.

**Severity:** 🟢 Shipped.

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

**Update (Sept 10, 2026): login half shipped.** A single shared-password, session-based gate (`server/middleware/auth.js`, wired into `server/index.js` and `server/routes/api.js`) now sits in front of both `index.html` and `admin.html` and every route they depend on — unauthenticated requests are redirected to `/login` (page routes) or get a `401` (API routes). URL obscurity is no longer the only protection. This was deliberately built as one shared credential, not per-user or per-business auth, so it resolves "who can log in" but not "what they can see once in" — see "Business-level configuration isolation" above, which this did not touch and which is now the more urgent of the two.

**Currently exists:** The login/session layer described above, plus the same underlying schema as the isolation item. Destructive endpoints (e.g., `DELETE /api/businesses/:id/leads`) also still have the production env-var guard (`ALLOW_LEAD_PURGE`), which protects against accidental data loss, not unauthorized access — unchanged by the new login gate.

**Missing / broken:** The gate is app-wide, not per-business — every authenticated session can see every business's data, since there's one password rather than one identity per business. That remaining gap is now tracked entirely under "Business-level configuration isolation" above rather than here, since this item was specifically about "who can log in," and that question now has an answer.

**Recommended next step:** None remaining under this specific heading — the login mechanism is built. The real remaining work (per-business identity + scoped queries) belongs to, and is now fully described under, "Business-level configuration isolation."

**Severity:** 🟢 Login shipped. The bundled gap this was paired with is not resolved — see "Business-level configuration isolation" (still 🔴, now the top remaining item).

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
