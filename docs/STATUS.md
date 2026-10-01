# Swoop — Current Status

**Read this first in any new session.** For full history and background, see `docs/PILOT_DOCS_INDEX.md`. This file gets fully rewritten at the end of each work session — it's a snapshot, not a log.

Last updated: October 1, 2026 (end of session — reflects all commits through `cfd4994`. Last deploy confirmed in Render's Events tab: `f7e69f4`. The one code commit since, `df147fc`, is pushed but its deploy hasn't been confirmed yet — see below)

## What's live in production right now

- Carrier-forward call routing (`call_mode`: `direct_dial` vs `carrier_forward`) — dedicated local numbers skip the redial/disclosure and go straight to missed-call SMS
- Duplicate-event protection (Twilio webhook retries can't double-fire)
- Accurate consent metadata per call_mode (no more false "disclosure was played" claim on carrier-forward calls)
- Admin console password gate (shared password, session-based) covering `admin.html` + `index.html` + their APIs — NOT covering `/webhooks/*` or `/api/test/*`
- 401 handling fix (session expiry now redirects to `/login` instead of showing a broken dashboard)
- API caching bug fix (JSON endpoints no longer served as false HTTP 304s)
- Dashboard empty-state bug fixed (commit `ca7f7f9`) — `#empty-state` was coded as a child of `#lead-list`, so the first lead-list refresh destroyed it; the next 30s auto-refresh then hit `document.getElementById('empty-state') === null` and threw, which the dashboard's generic error handling mislabeled as "Cannot reach API source" / Offline, even though the server was healthy. Fixed by making `#empty-state` a sibling instead of a child. Deployed and verified live.
- Twilio Console config for the toll-free demo number (`+18337830902`) verified directly against the live Twilio API — VoiceUrl/VoiceMethod, status callback, and SMS URL all already pointed at the right webhooks with POST. No change was needed; this was confirmed, not assumed.
- `PATCH /api/leads/:id` extended to accept `ai_handoff_done`, `ai_turn_count`, and `urgency_level` (commit `a4af847`) — lets one stuck lead be reset without wiping a business's other leads (the only prior option, `DELETE /api/businesses/:id/leads`, was too broad).
- **Post-handoff SMS silence fixed** (commit `8092476`) — once a lead's `ai_handoff_done=1`, any further inbound text used to get zero reply at all (`generateReply` returned null immediately and the whole AI block was skipped). Added `generatePostHandoffReply()`: a lightweight, facts-only OpenAI call (no qualifying questions, no scheduling commitments) with a deterministic ack-template fallback when AI is unavailable.
- **Post-handoff `lead_status` downgrade bug fixed** (commit `8092476`) — a routine post-handoff follow-up text no longer resets an already-escalated (`needs_attention`) lead back to `engaged`; only emergency/urgent tiers can change status once a lead is escalated.
- **Handoff auto-reset** (commit `8092476`, threshold tuned 24h → 2h in commit `102461f`) — a handed-off lead that goes quiet for `HANDOFF_RESET_HOURS` (currently 2h, named constant in `server/services/leads.js`) re-enters the normal AI intake flow on its next text instead of getting the post-handoff ack forever.
- **Post-handoff capability-check answers refined to three explicit outcomes** (commit `6e8235b`), verified live against a real OpenAI key and Mike's Plumbing's actual production data: a service explicitly in `business.services` → confident yes; a clearly different trade (e.g. asking a plumber about roofing) → confident, polite no; a plausible-sounding but unlisted request (e.g. faucet repair) → defers to the owner instead of guessing either way.
- **Unreliable LLM-driven "ask name and city together" step made deterministic** (commit `915bfc1`) — a live demo run showed the model didn't reliably follow that instruction even though the system prompt said to. `generateReply` now returns a fixed template ("Got it — what's your name, and what city is this for?") on the very first AI turn when both are unknown, without calling OpenAI at all. Narrowed in `df147fc` (below): skipped when the first message contains a `?`.
- **Handoff summary rewritten** (commit `915bfc1`) — was a raw `" | "`-joined dump of every inbound message, which got unreadable fast and, after repeated test resets on the same lead, mixed unrelated old messages into one blob. Now a short structured summary built from the lead's actual captured fields (name, location, first request, urgency).
- "First name" wording changed to "name" throughout the AI system prompt's intake-flow instructions (commit `915bfc1`).
- **Handoff detection now uses an explicit `[[HANDOFF]]` token instead of a regex** (commit `13249aa`). The old `ownerCallbackIntent` regex in `leads.js` only matched a few hardcoded phrasings, so a real early handoff ("Mike will reach out to you to help with replacing the faucets in Sammamish") was missed. `ai_handoff_done` never got set, the lead never reached `needs_attention`, and the owner was never notified. The regex could also false-positive on non-handoff replies ("I'll have Mike reach out... What's the best time?"). `buildSystemPrompt` now tells the model to end every handoff reply (early or forced final turn) with a bare `[[HANDOFF]]` line. `leads.js` uses only that token's presence to decide `isHandoff` and strips it before storing or sending. The regex and its `maxTurns` OR-fallback are gone. Verified live with a real OpenAI key.
- **Self-serve "Reset for testing" on each lead card** (commit `dc2ca57`, extended in `fc5f1d4`). New endpoint `POST /api/leads/:id/reset` sits behind the existing admin session gate. Default mode clears `ai_turn_count`/`ai_handoff_done`. `full=true` also clears `caller_name`/`location_hint` and, since `fc5f1d4`, **deletes that lead's message rows**. Without that, old messages kept feeding the AI's context and showing in the thread, because `generateReply`, `buildHandoffSummary`, and `extractName` load full history by `lead_id`. `follow_ups` are left untouched. The button and "full reset" checkbox show on every lead card in `index.html` with a confirm prompt and a "testing/demo only" note. **They are not hidden behind dev mode.** Tracked in `BACKLOG.md` (Security & Auth) as needing a server-side gate before a second business owner gets dashboard access.
- `PATCH /api/leads/:id` also accepts `location_hint` (commit `759b582`), so a lead can be reset all the way to a brand-new-caller state.
- **Dashboard tab's hidden second half fixed** (commit `fd3a7c3`). The prod tab's content was split across two `<div data-panel="prod">` blocks (dating back to tabs-split commit `1d0d6de`), and only the first was marked `active`. `switchTab()` only runs on clicks, so the setup banner, Recent Leads, and `#lead-list` stayed `display: none` from page load, even though `renderLeads()` kept filling them. Found while tracing why the new reset button wasn't visible.

## Pushed Oct 1, deploy not yet confirmed: `df147fc`

Check that Render's Events tab shows `df147fc` as live before treating these as production behaviour. Then send one real test text through the 833 to see the closing question.

- **Handoff closing question, appended in code.** `buildHandoffClosing()` in `leads.js` adds *"Is there anything else {owner} should know before reaching out, or anything else we can help with?"* to every handoff reply, right after `[[HANDOFF]]` is stripped. It's in the same text, with no extra turn. Both handoff prompts (final-turn instruction and HANDOFF SIGNAL) tell the model not to write its own closing question or sign-off.
- **Capability questions answered during intake, not just after handoff.** `buildSystemPrompt` now has the same three outcomes as the post-handoff prompt:
  - a listed service gets a confident yes
  - a different trade gets a polite no
  - unlisted work of the same kind gets an honest hedge ("Good question — that's not on our standard list, so {owner} can confirm when reaching out.") while intake continues
- **"Different trade" is decided from the description.** In both prompts, it's anchored on the ABOUT THE BUSINESS `description`, and the hedge is the stated default when unsure. This fixed a problem caught in local testing before anything shipped: the first version of the intake rule said a plumber doesn't install faucets, by copying the different-trade example sentence. The case-3 examples in the prompt deliberately don't include any tested items.
- **A question in the first message gets answered.** The first-turn name+city shortcut is skipped when the message contains `?`, so "Do you install garbage disposals?" gets answered, and the model still asks for name and city in the same text.
- **Post-handoff acknowledgement.** A reply after handoff that isn't a question ("Nope, that's it!", an extra detail) gets a brief acknowledgement instead of being answered as a question.
- **No-AI fallback handoff.** If OpenAI fails on the `max_ai_turns` turn, `buildFallbackHandoff()` sends a fixed handoff carrying `[[HANDOFF]]`, so the lead still hands off, the owner is notified, and the closing question is appended. Before this, the fallback reply never handed off, and leads sat past max turns indefinitely. The callback window now comes from a shared `getHandoffTimeframe()` in `ai-agent.js`.
- Owner references in both prompts no longer say "he".

**How it was tested:** with a live OpenAI key against a scratch copy of the DB, Twilio in mock mode, across 13 conversations. Faucet, toilet replacement and garbage disposal got the hedge 6 out of 6 times, including after handoff. Water heater got a yes; roofing and electrical got a no. Post-handoff acknowledgements and first-message questions worked. The no-AI fallback was tested separately with an invalid key. Two small follow-ups came out of it (below).

## Carrier-forward test setup (Oct 1, 2026)

The first real test of `carrier_forward` mode, on a separate test business. Mike's Plumbing wasn't touched.

- **Twilio numbers.** The account owns two numbers, both checked against the live Twilio API.
  - `+18337830902`: Mike's Plumbing demo line, unchanged.
  - `+14256455323`: a local number bought Aug 24 that had never been connected. Its `voiceUrl` and `smsUrl` now point at `/webhooks/voice` and `/webhooks/sms` (verified by re-fetching). To undo, set them back to `https://demo.twilio.com/welcome/voice/` and `/welcome/sms/reply`.
- **Production businesses.**

  | id | name | phone | call_mode |
  |---|---|---|---|
  | 1 | Mike's Plumbing | `+18337830902` | `direct_dial` (unchanged, verified field-for-field after the insert) |
  | 38 | Mike's Plumbing (Carrier-Forward Test) | `+14256455323` | `carrier_forward`, rest of the profile copied from Mike's |

  There's no API to delete a business; removing id 38 would need a small code change.
- **Result: the call leg works end to end.**
  - A test call was carrier-forwarded from a T-Mobile line to the 425 number.
  - Twilio logged `From = +14253123543` (the original caller) and `ForwardedFrom = +14254450174`, so **T-Mobile kept the original caller ID**.
  - `/voice` matched business 38, took the `carrier_forward` path, and texted the original caller.
- **Known gap: replies go to the wrong business.**
  - Every outbound text comes from the global `TWILIO_PHONE_NUMBER` (`twilio.js:8`), currently the 833.
  - So the customer's reply lands on the 833 and gets attributed to **Mike's Plumbing**, not the test business: the AI conversation, the handoff, and the owner alert all came from Mike's.
  - Tracked in `BACKLOG.md` (committed in `002df7e`), next to "Local number provisioning per customer". It's blocked in practice on 10DLC.
- **Reminders.**
  - While T-Mobile forwarding is on, anyone who calls that line and gets no answer will get a "Mike's Plumbing (Carrier-Forward Test)" text. Turn it off with `##61#`.
  - Don't set up carrier forwarding to the 833 while Mike's is `direct_dial`: it would redial the forwarding phone and could loop.

## Live production access

There is no direct DB shell or SQL access to the Render instance. Live data is read and written only through the app's authenticated `/api/*` routes: log in at `https://swoop-x79g.onrender.com/login` with the production `ADMIN_PASSWORD`, then call `/api/businesses`, `/api/leads`, etc. Verify every write by re-fetching independently, not just from the write response.

- **The admin password is stored locally** in the Windows user environment variable `SWOOP_ADMIN_PASSWORD`, for scripted access. It has appeared in chat several times, so consider rotating `ADMIN_PASSWORD` in Render and updating the variable to match.
- **Twilio** is reachable directly through the API with the credentials in the local `.env`, which point at the production account.
- **The local `OPENAI_API_KEY` was invalid until Oct 1**, when it was replaced. Check it works before relying on it for prompt testing.
- **Render logs** aren't reachable from this machine (no API key or CLI). Twilio's call and message records are the substitute.
- For routine demo resets, use the dashboard's per-lead "Reset for testing" button (`POST /api/leads/:id/reset`).

## Documentation reconciliation completed (Sept 9–10, 2026 session)

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
| T-Mobile | ✅ Confirmed working, no special steps. Oct 1: first end-to-end test in `carrier_forward` mode (to `+14256455323`); original caller ID kept |
| AT&T | ✅ Confirmed working, requires disabling iOS 18+ Live Voicemail first |
| Xfinity Mobile | ❌ Broken — escalated to Xfinity tier 3 support, awaiting response |
| Native Verizon | ❓ Untested — plan was a Visible SIM to test independently of Xfinity |

## Open, undecided

- **Trademark:** awaiting final verification of attorney Lizmary López Álvarez's Puerto Rico bar status (informal search inconclusive, but 21 live USPTO trademarks under her name is strong independent evidence). Decision pending on the $250 consultation. Other attorneys contacted, no responses yet.
- **Naming/rebrand:** paused pending the trademark question.

## Next big topic (flagged, not yet started)

**The owner-facing dashboard/console needs a real UX rethink before onboarding real pilot businesses.** Current console feels too complex and not built mobile-first. What's needed: something simple, easily accessible and navigable on a phone, that gives the business owner a clear understanding of how things stand the moment they open it — not something they have to study. Hasn't been designed yet — this is the next major thing to work through with fresh focus.

## Open items from recent testing

None of these have been started.

**From Oct 1 testing** (filed in `002df7e`, `df147fc`, `cfd4994`):

- 🔴 **Urgency only ever goes up.** It never reflects the customer's direct answer to "is this urgent?". An incidental "leak" keeps a lead urgent even after "not urgent", and out-of-scope roofing "leaks" alert the owner. Decided: keep the emergency-keyword path, and set the urgent/not-urgent tier only from the direct answer (Owner Dashboard — Leads).
- 🔴 **Garbled owner-notification text.** `extractName` picks up the owner's name ("Mike"), and `inferLocationHint` reads "in the next couple of days" as a location (Owner Dashboard — Leads).
- 🟡 **Outbound SMS should come from the business's own number,** not the global `TWILIO_PHONE_NUMBER`. This is the carrier-forward reply-attribution gap above (Messaging Infrastructure).
- 🟡 **Re-alert the owner** when the customer adds details after handoff (AI Features).
- 🟢 Follow-up: the no-sign-off rule only names "Talk soon!"; "Thanks for choosing us!" still got through once (AI Features).
- 🟢 Follow-up: after hedging on an unlisted service in the first message, the model re-asks "what issue do you need help with?" (AI Features).

**From Sept 17 demo testing** (filed in `f7e69f4`):

- 🔴 Declining a call can hit carrier/native voicemail before `<Dial>` reports no-answer/busy; a 15s+ voicemail interaction looks "answered" and no missed-call text goes out (Owner Dashboard — Leads).
- 🔴 "Next callback urgency" on the Owner Briefing may read a stale earlier lead: it showed "emergency" while the active lead was "urgent" (Owner Dashboard — Leads).
- 🟡 Owner alerts and the dashboard should show the actual SLA due-by time, not just an urgency label (Notifications).
- 🟢 Send a follow-up "update" text to the owner once name+location are captured on an urgent/emergency lead (Notifications).
- 🟡 Post-handoff replies should carry forward the specific callback commitment instead of generic boilerplate (AI Features).
- Open product decision: should urgency be required before an early handoff is allowed? (AI Features).

## Process reminders (hard-won this session)

- Verify the actual Twilio Console config via the live API before assuming it's misconfigured — tonight's "is VoiceUrl wrong" concern turned out to already be correct; the real bug was downstream in the app's own handoff-state logic, not Twilio config.
- Before `8092476`, a lead stuck in `ai_handoff_done=1` went completely silent on every further text, with no error logged, so it looked like nothing happened at all. Post-handoff texts now get a facts-only reply. To put a lead back into normal intake there are three ways: the dashboard's "Reset for testing" button, `PATCH /api/leads/:id`, and the automatic `HANDOFF_RESET_HOURS` (currently 2h) reset after inactivity.
- Don't trust the LLM to reliably follow a multi-field instruction like "ask name and city together," even when the system prompt says to do it every time — a live demo showed it silently didn't. Enforce single-shot, high-repetition flow steps deterministically in code instead of relying only on the system prompt.
- Don't infer state transitions from the LLM's free-text phrasing. The handoff regex both missed real handoffs and matched non-handoffs. Have the model emit an explicit machine-readable token (`[[HANDOFF]]`) and strip it before sending.
- A "full" test reset has to clear everything the AI reads, not just the lead row. Message history is loaded by `lead_id` regardless of turn/handoff fields.
- If shipped UI isn't visible, check the panel/visibility wiring before the feature itself. `fd3a7c3` was a pre-existing hidden-panel bug, not a reset-button bug.
- AI-driven prompt changes need testing with a real, working OpenAI key, not just mock mode — mock-mode/invalid-key testing only proves the code path runs, not that the replies are good. Real-key testing this session caught a hallucinated "yes" to a service that wasn't actually listed, and a redundant "owner will reach out" sign-off tacked onto answers that had already fully answered the question.
- When a prompt rule has an example reply, the model may copy that sentence word for word into neighbouring cases. Give each outcome its own wording, and state which case is the default when unsure.
- Never put the items you're testing into the prompt's examples. That only tests whether the model can repeat them. Use different examples, then test with cases the prompt never mentions.
- Check the local OpenAI key works before a prompt test. With an invalid key, every reply silently comes from the non-AI fallback, and the test looks like it ran.
- Carrier-forward needs a dedicated Twilio number per business, because the business is identified only from `To` (`findBusinessByPhone`). `ForwardedFrom` is never read.
- Never trust a "committed and pushed" claim — always verify with `git log`/`git status`, then confirm the matching commit is live in Render's Events tab.
- Documentation drifts silently; the standing `CLAUDE.md` rules for `docs/STATUS.md` and `BACKLOG.md` exist specifically to catch this.
