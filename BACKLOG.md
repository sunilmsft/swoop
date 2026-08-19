# Swoop — Backlog

## 🧭 Post-Trip Restart Checklist (when back from India)
- [ ] Verify production env on Render: `TWILIO_MOCK_MODE=false`, `OPENAI_API_KEY` valid, `TWILIO_PHONE_NUMBER` set
- [ ] Run one live missed-call + SMS reply test from dedicated QA phone
- [ ] Confirm AI second-turn reply path (or fallback) is working for a realistic customer text
- [ ] Start A2P 10DLC brand vetting (production path for customer local numbers)
- [ ] Implement landline/non-textable fallback path (Twilio Lookup + owner callback alert)
- [ ] Open auth implementation sprint (magic-link login + business scoping)

## ✅ Done (v0.1.0)
- [x] Express server with static file serving
- [x] SQLite database with businesses, leads, messages, follow_ups tables
- [x] Twilio webhooks: /voice, /voice-status, /sms
- [x] Missed call detection → instant auto-reply SMS
- [x] Lead creation/dedup on missed calls and inbound texts
- [x] Follow-up sequence scheduling (Day 1, 3, 7)
- [x] Cron job to process due follow-ups every 15 min
- [x] Cancel follow-ups when lead replies (smart skip)
- [x] Inbound SMS handling → log message, mark lead engaged
- [x] Google review request SMS with link
- [x] REST API: dashboard stats, leads CRUD, businesses CRUD
- [x] Dashboard UI: stats cards, lead list, detail modal with chat bubbles
- [x] Add business form in dashboard
- [x] Mark converted / request review buttons
- [x] Twilio request signature validation (prod) / skip (dev)
- [x] .env.example with all required vars
- [x] render.yaml for Render deployment
- [x] README with setup instructions
- [x] Seed script for demo data

---

## ✅ Done (v0.2.5) — AI Reply Agent
- [x] Business profile schema: name, owner, description, services, pricing, hours, service area
- [x] Tone/personality settings: friendly, professional, casual
- [x] FAQ entries per business
- [x] Rules/guardrails: things to never say, topics to redirect
- [x] Onboarding form in dashboard to collect business profile (2-column grid)
- [x] System prompt builder: auto-generate LLM prompt from business profile
- [x] OpenAI gpt-4o-mini integration for two-way SMS conversations
- [x] 3-turn budget per lead before graceful handoff (configurable per business)
- [x] Context-aware: uses business profile, hours, services to answer questions
- [x] After turn limit: send handoff message with callback timeframe
- [x] Configurable timeframe per business: during hours / after hours
- [x] Lead status changes to "Needs Attention" 🔔 on dashboard
- [x] Conversation summary in lead notes for business owner
- [x] Resilient SMS sending (logs AI reply even if Twilio send fails)
- [x] Dashboard: needs_attention badge, AI turn count, handoff summary box
- [x] Playbook updated: Accounts & Keys tab, AI Agent tab
- [x] New logo (bold wordmark with chat dots in "p")

---

## ✅ Done (v0.2.6) — Test Console
- [x] `/api/test/simulate` endpoint with scenarios: missed_call, inbound_sms, fire_followups, send_review, reset
- [x] Scenario picker in dashboard with 6 named scenarios (Happy Path, Ghosting, Opt-Out, Emergency, Opt-Out → Back-In, Busy Tuesday)
- [x] SMS-bubble conversation panel (customer left/white, AI right/green, per-persona thread headers)
- [x] Rich Handoff Brief card — owner name, customer name+phone, business, SLA, last 3 inbound quotes, urgency chip, AI summary from `lead.notes`
- [x] Time-shifted system banners with relative labels ("Later that day…", "A few days later…") — no misleading wall-clock timestamps
- [x] Happy Path extended to 4 customer turns to trigger real backend handoff (max_ai_turns=3)
- [x] `/api/leads/:id` now returns `business_owner_name` + `business_handoff_minutes` for the brief
- [x] **Dashboard / Test Console split into tabs** — production view never shows scenario picker bleed-through
- [x] **Persistent disk on Render + `DB_PATH` env var** — SQLite survives deploys (`/var/data/swoop.db`); local dev untouched (falls back to `server/db/swoop.db`)

---

## ✅ Done (v0.2.7) — Twilio TFV Branded Opt-In Compliance (May 29)
- [x] 🔴 **Default `auto_reply_message` rewritten to carrier-compliant template** — includes branded sender ID (`{business_name}`), `Msg&data rates may apply`, and STOP/HELP keywords on the very first message (`server/db/database.js`, `server/seed.js`). — _Morgan: "This is the single biggest carrier-rejection fix."_
- [x] 🔴 **HELP keyword response now points to live privacy URL** at `welcomematdigital.com/swoop/privacy.html` (`server/services/leads.js`).
- [x] 🔴 **AI agent system prompt: explicit anti-marketing rule** — "Never sign up the customer for marketing, newsletters, or anything they didn't ask for. They consented to a service reply only." (`server/services/ai-agent.js`).
- [x] 🔴 **`public/consent.html` fully rewritten** — removed incorrect "verbal consent during call" claim, replaced with FCC prior-express-invitation + CTIA call-back-exception basis. Shows exact branded SMS template, names WelcomeMat Digital LLC, includes reviewer note explaining the toll-free (test) + 10DLC (prod) dual-track. Mirrored to `frontdesk-ai/public/swoop/consent.html` so it's live at welcomematdigital.com.
- [x] 🟡 **Holdco restructure shipped** — welcomematdigital.com now hosts the parent brand + `/swoop` product subpages (privacy, terms, consent). Subpage nav + footers link back to WelcomeMat Digital home so Twilio reviewers can verify business identity.
- [x] 🟡 **WA LLC "WelcomeMat Digital LLC" filed** at ccfs.sos.wa.gov ($200, single-member, sunil1308@gmail.com on file). Status: Review Ready, 2–7 business day approval window.

---

## 🟡 v0.2.7 — Follow-up Watch Items
- [x] 🔴 **Duplicate missed-call SMS fixed** — `/voice-dial-result` and `/voice-status` could both call `handleMissedCall` for one forwarded call; the status fallback now skips businesses with a `forward_phone`.
- [x] 🟡 **Zoho Mail setup for hello@ + privacy@welcomematdigital.com** ✅ Done June 1.
- [x] 🟡 **WA LLC approved** ✅ Done June 1 — UBI 606238837.
- [x] 🟡 **EIN issued** ✅ Done June 1 — 42-2903620.
- [x] 🟡 **Twilio account upgraded** ✅ Done June 1 — Paid, auto-recharge.
- [x] 🟡 **WA Business License filed & paid** ✅ Done June 2 — Confirmation #0-052-653-982, $66.92 (incl. $15 Sammamish home occupation endorsement). Processing ~10 business days.
- [x] 🟡 **Twilio Business Profile resubmitted** ✅ Done June 2 — Bundle SID `BUf71fa573b0fd6173b0cc31daba2ba41b`. EIN sync verified via DOR FEIN validation. ⏳ **Status as of June 5: still "In Review"** (3 business days elapsed, edge of normal SLA).
- [x] � **Twilio Business Profile REJECTED again June 10** — errors: **18606** (email domain mismatch — Notification Email still `sunil1308@gmail.com` not `hello@welcomematdigital.com`) + **18602** ("Business ID could not be verified"). Reviewer: Jennifer (trusthub-verify@twilio.com).
- [x] 🔴 **Diagnosis (June 11): error 18602 = Persona/IRS third-party sync delay** — Persona uses commercial data brokers (Dun & Bradstreet / LexisNexis) that lag IRS by 2–6 weeks. EIN issued June 1, only 10 days old. WA DOR FEIN check passed June 2 confirming IRS-side data is correct, but Persona's lookup fails with "the business registration number and legal name don't match" despite exact-match entry of `WELCOMEMAT DIGITAL LLC` + `42-2903620`. Cannot brute-force the Persona wizard — auto-fails at the EIN step before reaching the email field.
- [x] 🔴 **Manual verification email sent to Jennifer** ✅ Done June 11 — Reply sent **from `hello@welcomematdigital.com`** (the act of replying from company domain itself addresses error 18606 per Jennifer's instructions). Attached IRS CP 575 + WA Certificate of Formation. Asks for either (a) manual approval based on attached docs, or (b) guidance on additional documentation. Noted that Notification Email field will be updated as soon as EIN step lets the wizard advance.
- [x] 🔴 **Follow-up evidence package sent to Jennifer** ✅ Done June 11 — Ran two third-party lookups and sent screenshots:
  - **D&B Business Directory** → "No results found" for WELCOMEMAT DIGITAL LLC (confirms D&B/broker has not yet ingested the entity, explains Persona failure)
  - **OpenCorporates** → Found WELCOMEMAT DIGITAL LLC registered in WA at 23013 SE 13TH PL Sammamish (confirms state-level registration is correct)
  - Contrast proves the issue is strictly third-party broker propagation lag, not a name/EIN error.
- [x] 🔴 **Twilio Business Profile APPROVED** ✅ **Done June 11 (~1 hr after evidence email)** — `donotreply@twilio.com` confirmation received. Bundle `BUf71fa573b0fd6173b0cc31daba2ba41b` now Twilio-Approved. Jennifer did a manual review based on the evidence package. _**Lesson:** When Persona's automated KYB fails on a young EIN, don't waste cycles on the wizard — go straight to manual review with a multi-source evidence package (CP 575 + state filing + negative D&B lookup + positive OpenCorporates lookup). Works fast._
- [x] 🔴 **Resubmit TFV to Ignacio (ticket 27236005)** ✅ **Done June 11 PM.** Submitted via Console → Phone Numbers → Regulatory Compliance → TFV. Status: **"Your toll-free registration is being reviewed."** Full form filled with:
  - **Legal name:** WELCOMEMAT DIGITAL LLC | **DBA:** Swoop | **Type:** PRIVATE_PROFIT
  - **EIN:** 42-2903620 | **Business website:** https://welcomematdigital.com
  - **Address:** 23013 SE 13th Pl, Sammamish, WA 98075 | **Contact:** Sunil Venugopal, hello@welcomematdigital.com, +1 425-786-7232
  - **Use case:** Customer Care | **Volume:** 100/mo | **Opt-in:** Verbal
  - **Opt-in proof:** https://welcomematdigital.com/swoop/consent.html#opt-in-flow (Huvi-cleared June 5)
  - **Terms:** https://welcomematdigital.com/swoop/terms.html | **Privacy:** https://welcomematdigital.com/swoop/privacy.html
  - **Sample message:** "Hi! This is Mike's Plumbing returning your missed call..." (real seed-data template)
  - **Opt-in & Help messages:** branded "Mike's Plumbing:" prefix, callback to (833) 783-0902, STOP/HELP/Msg&data
  - **Additional info:** NOTE FOR REVIEWER about Mike's Plumbing being example partner business, references BP approval, Ignacio's ticket, Huvi's clearance, Cert of Formation Drive link
  - **Notification email:** hello@welcomematdigital.com
  - _**Lesson:** Twilio TFV form has hard 500-char limit on both "Use case description" and "Additional information" fields — write tight. Form auto-saves but closes hard if you navigate away — keep a copy-paste reference handy._
- [x] 🟡 **Heads-up email sent to Ignacio (ticket 27236005)** ✅ Done June 11 PM — Reply sent from `hello@welcomematdigital.com` on existing ticket thread `[Twilio] Re: toll-free verification request of +18337830902`. Confirmed BP approved earlier same day, TFV resubmitted with all promised items (entity, EIN, UBI, opt-in URL with Huvi ticket ref, branded sample-message format, Cert of Formation Drive link previously sent June 3, NOTE FOR REVIEWER explaining Mike's Plumbing = example partner business).
- [x] 🟡 **Huvi loop closed (ticket 27235615)** ✅ Done June 11 PM — Auto-bot pinged for status on the older opt-in-flow ticket; replied confirming opt-in flow unchanged, BP approved, TFV resubmission moved to Ignacio's ticket. Frees her to close 27235615.
- [ ] 🟢 **Send thank-you to Jennifer** (optional but builds goodwill for future Twilio interactions like 10DLC).
- [ ] 🟡 **Update Notification Email in Trust Hub from sunil1308@gmail.com → hello@welcomematdigital.com** — not blocking anything (BP is already approved), but keeps the profile consistent and avoids any future "domain mismatch" flags.
- [x] 🟢 **Gmail Send-As fix** ✅ Done June 11 — Settings → Accounts and Import → "When replying to a message" was set to **"Always reply from default address"** which **hides the From dropdown** in compose. Changed to **"Reply from the same address the message was sent to"** to expose the From dropdown. `hello@welcomematdigital.com` Send-As (smtppro.zoho.com:465 SSL) was already correctly configured — just hidden by the toggle.
- [x] 🟡 **Huvi (Trust Hub) cleared opt-in flow** ✅ Done June 5 — Responded to June 4 email confirming standalone opt-in flow at `/swoop/consent.html#opt-in-flow` is acceptable. Permissive "resubmit when ready" — no further updates needed on consent/opt-in side.
- [x] 🟡 **Soft nudge sent to Ignacio (ticket 27236005)** ✅ Done June 5 — Asked for visibility on Business Profile review status; restated TFV resubmission plan (BRN, EIN, proof URLs, Cert of Formation, opt-in flow permalink).
- [x] 🟡 **Mercury business bank account submitted** ✅ Done June 2 — **APPROVED SAME DAY** (vs 2-4 day estimate). Mercury IO credit card pre-approved.
- [x] 🟡 **Gmail ↔ Zoho mail forwarding** ✅ Done June 2 — Gmail POP fetch + Send-As (smtppro.zoho.com), label `Hello @ WelcomeMat`. Zoho Lite forwarding silently broken — POP workaround used.
- [ ] 🔴 **Awaiting Jennifer's response on manual BP verification** — Sent June 11 PM. Expected turnaround 1-3 business days. If approved manually: complete Persona wizard (update Notification Email to `hello@welcomematdigital.com`), then proceed to TFV resubmission. If she insists on Persona-only verification: wait 1-2 more weeks for IRS→broker propagation, then retry. **✅ RESOLVED June 11 — approved in ~1 hour via manual review.**
- [x] 🔴 **Twilio TFV resubmission to reviewer Ignacio (ticket 27236005)** ✅ Done June 11 PM — see full submission details and heads-up email above. Awaiting Ignacio's review (typical SLA 1-3 business days).
- [x] 🔴 **TFV Round 2 REJECTED June 15 (code 30527 again)** — escalation email sent June 15 PM from `hello@welcomematdigital.com` citing BP approval + form-bug observations. Ticket placed on hold by Ignacio earlier same day.
- [x] 🔴 **Ignacio responded June 16 AM with 3-item fix list** — (1) BRN/EIN proof must be inline/publicly accessible, (2) Notification email reverted to gmail (form-bug strikes again), (3) Sample message branded but not "complete" (missing frequency + Terms URL inline per CTIA). Reframed Round 1/2 root cause: NOT broker-sync lag, three concrete fixable items. _**Lesson:** Same rejection code ≠ same root cause. Always wait for reviewer's written feedback before re-diagnosing._
- [x] 🔴 **Code fixes shipped (swoop `42fdf7f` + frontdesk-ai `86a36c8`)** ✅ June 16 — `public/consent.html` rewritten with verbatim IVR-style opt-in script; `server/db/database.js` default `auto_reply_message` updated to Option A (brand + frequency + Msg&data + STOP + HELP + Terms URL, all CTIA-complete in <160 chars); `server/seed.js` Mike's + Sara's updated to Option A. Both repos PUSHED.
- [x] 🔴 **TFV Round 3 RESUBMITTED June 16 PM** ✅ Form re-walked field-by-field with screenshot verification (Drive folder: https://drive.google.com/drive/folders/1pme_s7L2wIl1Spw85dcHzGBKzAXUawXu). All 3 of Ignacio's items addressed: EIN PDF hosted at Drive URL (https://drive.google.com/file/d/1621llFjbUY_Dez3G84nQooDsjQvPc3zc/view), Notification email force-overridden to `hello@welcomematdigital.com` on final page, sample message = Option A (CTIA-complete). Reply email sent to Ignacio with 1:1 mapping + screenshots link + pre-emptive flag on the email-reset form-bug. **Status: In Review.** _**Lesson (Lesson #4 thrice-confirmed):** TFV form's Notification Email field auto-reverts to Twilio console account email on every page advance. Fix LAST on final page, visually verify before clicking Submit._
- [x] 🔴 **TFV Round 3 REJECTED June 16 ~3:04 PM PDT (code 30527 again)** — ~4hr turnaround = automated Persona pre-check, never reached a human reviewer. Reopened the form (look-don't-save: no Next, no Submit, just inspect) and found the **smoking gun**: the BRN field had silently stripped the dash from the EIN — form displays `422903620` instead of the submitted `42-2903620`. Likely root cause of all three rounds of 30527, not broker-sync lag or the 3-item list (Ignacio's items were genuine but downstream of this). Also confirmed Page-1 contact "Email" reverted to `sunil1308@gmail.com` AGAIN — BUT Page-3 "E-mail for notifications" (a DIFFERENT field) held as `hello@welcomematdigital.com`. _**Lesson #3 CORRECTION:** previous "always dashed format" advice was wrong in practice — the form strips the dash regardless of what you type. Can't be won in the UI._ _**Lesson #4 quadruple-confirmed.**_ _**New Lesson #9:** Two separate email fields exist (page 1 contact + page 3 notifications); page 1 always reverts._ _**New Lesson #10:** Same-business-day rejection = automated Persona gate, not human review — escalate via ticket reply, do NOT resubmit on the form (every save re-triggers the dash strip + another 4hr auto-reject)._
- [x] 🔴 **Escalation email sent to Ignacio June 16 evening** — on existing ticket thread `27236005`, FROM `hello@welcomematdigital.com`. Led with the dash-strip evidence (side-by-side: form displays `422903620` vs. IRS CP 575 shows `42-2903620`), linked the audit screenshot folder + the CP 575 PDF, and asked for (a) a manual override against the BP-approved entity (citing Jennifer's June 11 BP precedent) OR (b) guidance on whether the Messaging Compliance API path preserves the dash. Did NOT resubmit on the form. Hard deadlines noted: prioritized resubmit window closes June 22; India trip June 25.
- [x] 🔴 **Ignacio confirmed appeal opened June 17 (~10:11 AM PDT)** — Reply from Twilio Support: appeal created and escalated to the toll-free team; awaiting decision on ticket `27236005`. Current status: waiting on toll-free team response (do not resubmit the broken Console form while this is pending).
- [x] 🔴 **Toll-free team responded June 21 via Ignacio — blocking issue: missing verbal consent script** — Team is NOT asking about EIN; they need a verbatim IVR dialogue showing how verbal consent is obtained and how opt-out is communicated. Reference: Twilio IVR best-practices blog. Fixes applied locally: (1) `webhooks.js` now plays `<Say>` disclosure on every inbound call; (2) `consent.html#opt-in-flow` rewritten as a verbatim IVR script with dialogue format. **Next: push code → reply to Ignacio with inline script + ask for pre-clearance before resubmitting the form.** Hard deadline: June 22.
- [x] 🔴 **Ignacio pre-clearance reply SENT June 21** — Inlined the full verbal IVR script in the ticket reply. Asked him to confirm (1) script is acceptable and (2) no other outstanding items before we touch the TFV form. Updated `consent.html#opt-in-flow` URL included for reviewer to re-check. FROM `hello@welcomematdigital.com`.
- [x] 🔴 **Ignacio feedback received June 22** — Two refinements on verbal script: (1) business name must be explicit (shows dynamic substitution) ✅ fixed, (2) script must specify KIND of messages + frequency ✅ updated to include "responses to questions and appointment reminders" + "up to 7 messages per missed call". Revised script confirmed acceptable. **READY TO PUSH CODE + RESUBMIT FORM.**
- [x] 🔴 **Verbal disclosure implementation + code deployment June 22** ✅ Swoop commit `a4df90c` PUSHED to main (live at welcomematdigital.com/swoop). Two changes: (1) `server/routes/webhooks.js` — added `twiml.say()` verbatim disclosure before call forwarding; every inbound call plays: _"Thank you for calling {Business Name}. If we miss your call, we will send you a text to follow up. You may receive up to 7 messages regarding your missed call — including responses to your questions and appointment reminders. Message and data rates may apply. Reply STOP at any time to stop all messages."_ (2) `public/consent.html` (`#opt-in-flow` section) — rewritten as step-by-step verbatim IVR dialogue (7 steps from customer dials → SMS sent → customer replies → opt-out flow). All three items from Ignacio's June 22 feedback incorporated: business name explicit, message types (callback responses, appointment reminders), frequency (up to 7).
- [x] 🔴 **TFV Round 4 / Final resubmission June 22** ✅ Submitted via Twilio Console → Phone Numbers → Regulatory Compliance → TFV. Form resubmitted with all three items live. Notification Email auto-reverted to `sunil1308@gmail.com` on page advance (Lesson #4 recurring) — corrected on final page + visually verified before Submit. Form submission confirmation: _"Thanks for submitting your toll-free registration! Your toll-free registration is being reviewed."_ **Hard deadline met: prioritized 7-day window closes June 22 EOD.** Status: Awaiting toll-free team review (typical SLA 1–3 business days).
- [x] 🔴 **Reply email sent to Ignacio June 22 EOD** — FROM `hello@welcomematdigital.com` on ticket `27236005`. Confirmed code deployed + live + form resubmitted; included screenshot of final form page with Notification Email corrected; pre-empted email-revert form-bug in footnote + requested manual escalation if form bugs trigger more rejections. Thanked Ignacio for pre-clearance approach. India trip June 25; awaiting toll-free team response.
- [x] 🔴 **TFV Round 4 REJECTED June 22 ~8:49 PM PDT (code 30511)** — NEW rejection code (different from 30527 rounds). "Verbal Consent Script Must Be Provided for Approval." Help doc lists 5 possible solutions but doesn't specify which one is required or in what format. Rejection email mentions two paths: Messaging Compliance API (REST, may avoid form bugs) OR Console resubmit. **Pre-clearance email planned:** Ask Ignacio (a) which of the 5 solutions is the actual requirement, (b) what format for "documentation of how we record/store consent calls", (c) should we use the Messaging Compliance API instead of the Console.
- [x] 🔴 **Consent record storage implemented June 23** — `leads` table now stores explicit consent metadata (`consent_method`, `consent_source`, `consent_recorded_at`, `consent_script_version`, `consent_notes`) and `handleMissedCall()` persists that record on every missed call with the outbound confirmation SMS/Twilio SID. `public/consent.html` now documents the proof trail for reviewers.
- [x] 🔴 **API resubmission helper created June 23** — `scripts/tfv-api-resubmit.js` now supports the real direct TFV update path using `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN`. Ready-to-run payload lives in `config/tfv-submission.json`; supports dry-run via `TFV_API_DRY_RUN=true`.
- [x] 🔴 **TFV direct API update approved June 23** — `messaging.v1.tollfreeVerifications(sid).update()` on SID `HH260e95b417689297554480bd502c5e88` moved status into review and then to approved the same evening. Fixed: contact email, `CUSTOMER_CARE` enum value, and verbal script reference in `additionalInformation`.
- [x] 🟡 **First missed-call SMS copy improved June 23** — updated `auto_reply_message` default and seed templates to include a clearer CTA ("What can we help with today? Reply with your issue and best time.") while preserving compliance language (`up to 7 msgs`, `Msg&data`, `STOP/HELP`, Terms link). Applied live to business IDs 1 and 2 via API.
- [x] 🟡 **Reply to Ignacio confirming approval** ✅ Done June 23 — replied on ticket #27236005 after the official Twilio Consumer Trust Team approval email landed.
- [x] 🟡 **Replace Twilio TFV console form with API-based resubmission flow** ✅ Done June 23 — final successful path was `messaging.v1.tollfreeVerifications(sid).update()`. The broken Console form is no longer part of the TFV playbook.
- [ ] 🟡 **PARALLEL: begin A2P 10DLC brand vetting** — Per June 13 strategic decision, production was always going to 10DLC. Brand vetting (~$4) + single shared campaign (~$10/mo) on the BP-approved entity. If 10DLC clears, Swoop ships regardless of TFV demo-line status.
- [ ] 🟡 **Mercury approval** ✅ Done June 2 — approved same day. Next: get routing/account numbers, reimburse personal card.
- [ ] 🟡 **WA Business License email delivery** ⏳ ~10 business days (by ~June 16). Sammamish endorsement ~3 weeks (~June 23).
- [ ] 🟡 **Gmail POP3 deprecation watch** ⚠️ Google deprecating "Check mail from other accounts (POP3)" feature. Banner shown June 2. Backup plan: install Zoho Mail mobile app, or upgrade to Google Workspace ($6/mo) if/when POP cutoff hits. — _Priya: "Single-inbox flow will break — have a backup ready."_
- [ ] 🟢 **Per-business `auto_reply_message` validator** — when owner edits the template, warn if missing branded ID, STOP/HELP, Msg&data. — _Morgan_ (~30 min build)
- [ ] 🟢 **Existing demo/seed businesses re-seeded with new template** — confirm Mike's + Sara's records.
- [ ] 🟢 **Update subscription tracker** — add Zoho Mail Lite ($12/yr), Mercury (free), WelcomeMat Digital LLC entity (UBI 606238837, annual report ~$70 due 06/30/2027).
- [x] 🟢 **Calendar reminders (5 total)** ✅ Done June 2 — June 23 2026 (verify BOI status 2 days before India trip), May 29 2027 (Zoho renewal), May 30 2027 (WA + Sammamish license renewal warning), June 1 2027 (30-day Annual Report warning), **June 30 2027 (HARD deadline WA Annual Report)**. ⚠️ Original BOI reminder was set for June 15 assuming earlier trip date — India departure now confirmed for June 25, so move BOI check reminder to June 23.
- [ ] 🔴 **Verify BOI Report status BEFORE India trip (by ~June 23, departure June 25)** — fincen.gov/boi. CTA 30-day rule would mean deadline ~July 1 2026 (during travel). March 2025 FinCEN interim rule may exempt US LLCs. If required, file at boiefiling.fincen.gov (free, EIN + UBI + personal ID).
- [ ] 🟢 **Voice webhook URL refresh** — Toll-free 833-783-0902 voice webhook still points to `swoop-x79g.onrender.com/webhooks/voice`. Eventually swap to `welcomematdigital.com` for consistency. Non-blocking.
- [ ] 🔴 **Verify live forwarding configuration** — Set Render `DEFAULT_FORWARD_PHONE` to the owner's current E.164 number and place a call after deploy; a stale or blank business row can send the text while failing to ring the owner. — _Priya: "The caller got a text, but nobody answered the phone."_
- [ ] 🔴 **Verify forwarded-call callback** — Place a live call after the callback business-ID fix deploys; confirm the caller hears a normal missed-call message instead of Twilio's generic application error. — _Morgan: "A callback failure must not create an unexplained caller-facing failure."_

---

## ✅ Done (June 1, 2026) — Launch Identity Day
- [x] 🔴 **WA LLC approved** in 3 days (vs 2-7 day estimate). UBI 606238837, effective 06/01/2026.
- [x] 🔴 **Federal EIN issued** — 42-2903620. CP 575 PDF saved to OneDrive/WelcomeMat Digital/.
- [x] 🔴 **Zoho Mail Lite live** — hello@ + privacy@welcomematdigital.com, full DNS stack (10 records) in Cloudflare, send+receive verified.
- [x] 🔴 **Twilio account upgraded** — Trial → Paid, business profile (LLC + EIN) submitted, $20 starting balance + auto-recharge.
- [x] 🟡 **6 frontdesk-ai commits pushed** and live at welcomematdigital.com.
- [x] 🟡 **All Swoop TFV compliance code pushed** (swoop @ 8f3c7c9).
- [x] 🟢 **Identity Snapshot HTML** saved to `OneDrive/WelcomeMat Digital/`.

---

## ✅ Done (June 2, 2026) — Launch Identity Day 2
- [x] 🔴 **WA Business License FILED** at business.wa.gov — Confirmation #0-052-653-982, total $66.92 (license $50 + Sammamish endorsement $15 + 2.96% card fee $1.92). Activity: Software SAAS. Sammamish home occupation endorsement (low-revenue partial fee exemption). Email delivery within 10 business days. Confirmation PDF saved to `OneDrive/WelcomeMat Digital/WA-Business-License-Confirmation-2026-06-02.pdf`.
- [x] 🔴 **SOS→DOR sync confirmed** — UBI 606238837 active in DOR Business Lookup (24h, not 48h as expected).
- [x] 🔴 **DOR FEIN validation passed** — proves IRS sync of EIN 42-2903620 complete; unblocks Twilio Business Profile resubmit.
- [x] 🔴 **Twilio Business Profile RESUBMITTED** — Bundle SID `BUf71fa573b0fd6173b0cc31daba2ba41b`, status "In Review." Updates: email → hello@, mobile phone added, website added to rep section. Generic backend errors on per-section saves overcome by going straight to Submit endpoint.
- [x] 🔴 **Mercury business bank account APPROVED (same day!)** — callsign `welcomemat`, account email hello@. Mercury IO credit card pre-approved (1.5% cashback, no annual fee). 2FA + biometrics + mobile app + push notifications enabled.
- [x] 🟡 **Gmail ↔ Zoho email forwarding** — Zoho Lite's native forwarding silently fails; replaced with Gmail-pulls-via-POP3 (`poppro.zoho.com:995` SSL) + Send-As (`smtppro.zoho.com:465` SSL). Label `Hello @ WelcomeMat`. Audit copy stays in Zoho.
- [x] 🟡 **Huvi (Twilio Compliance) follow-up reply sent** — confirmed EIN propagation.
- [x] 🟡 **Scam SMS identified & ignored** — einapplications.org scraping WA SOS public database.
- [x] 🟡 **BOI Report status flagged** — standard CTA rule = 30 days from formation (deadline ~July 1 2026, during India trip). March 2025 FinCEN interim rule may exempt US LLCs. Action: verify at fincen.gov/boi before leaving.
- [x] 🟢 **Identity Snapshot HTML updated** — added WA Business License section, Day 2 completed list, 6 calendar reminders, Twilio status "unblocked."
- [x] 🟢 **American Family Insurance E&O outreach declined** — premature; revisit when first paying customer.

---

## 🟡 Test Console — Squad Review Follow-ups (May 26)
- [x] 🟡 **Tag test data** — `is_test` column on `leads` + `messages`; every row written by `/api/test/simulate` is flagged. Dashboard stats, lead list, and `/api/admin/overview` + `/api/admin/businesses` metrics exclude test rows. `reset` scenario now wipes only test-tagged rows. — _Morgan: "Real and fake leads must be distinguishable in an audit."_
- [x] 🟡 **Gate Test Console behind dev mode** — Hidden unless `localStorage.swoop_dev_mode === 'true'`; mock banner now tells operator how to reveal it. Default off for real owners. — _Priya: "Owners will click 'Run scenario' and panic."_
- [ ] 🟢 **Editable scenario steps** — Let user edit each step's customer message before running. — _Jordan: "Canned scripts only goes so far."_
- [ ] 🟢 **Replay-from-real-lead mode** — Pick an existing lead, feed its inbound messages back through the AI to test new prompt versions. — _Jordan_



> **Priority labels:** 🔴 Blocker — can't ship without it | 🟡 High — should do before first customer | 🟢 Nice — improves product but not urgent | 🔵 By Design — consciously deferred

### Deploy to Production
- [x] 🟡 Deploy to Render (render.yaml ready)
- [x] 🟡 Set environment variables on Render
- [x] 🟡 Update Twilio webhooks to Render URL
- [x] 🟢 Local test mode: `TWILIO_MOCK_MODE` to simulate SMS flows without hitting the live Twilio number. `npm run dev:mock` now starts the app in harness mode and `npm run test:harness:smoke` validates the missed-call → inbound SMS path end-to-end.
- [x] 🟡 Complete Twilio toll-free SMS verification ✅ Approved June 23 on SID `HH260e95b417689297554480bd502c5e88`
- [ ] 🟡 Switch Twilio consent/terms URL to always-on GitHub Pages page (`/consent.html`) to avoid Render cold-start validation failures

### Security & Auth (🔴 Blocker — Squad Review May 11)
- [ ] 🔴 Per-business auth (magic link or phone + code) — _Priya: "Anyone with the URL sees ALL businesses' leads"_
- [ ] 🔴 Business owner dashboard filtered to their leads only
- [ ] 🟡 Rate limiting on webhook and API endpoints
- [ ] 🟡 Sanitize/validate phone number format (E.164)
- [ ] 🔴 Add automated compliance tests for STOP/START/HELP and outbound blocking (manual/review/follow-up paths) — _Morgan: "Trust controls must be provable, not just implemented."_

### Owner Dashboard — Leads
- [x] 🟡 Send manual SMS from dashboard — _Jordan: "After AI hands off, owner can't reply through Swoop"_
- [x] 🟡 Mobile-responsive polish — _Ray: "I'm on my phone. Always."_
- [x] 🟡 Compliance guardrail: block outbound sends when lead has opted out (STOP) and show warning in lead modal
- [x] 🟡 Smart "Open Next Priority Lead" routing using urgency scoring (status + age + incomplete profile)
- [x] 🟢 Funnel metric fix: conversion denominator aligned with "engaged" label
- [ ] 🔴 Bug: Owner dashboard can show stale/local leads while live Twilio traffic lands on a different host (file:// or localhost view vs `swoop-x79g.onrender.com`). Add explicit environment/source indicator + enforce single canonical dashboard URL for live operations. — _Ray: "If I can't trust what I see, I can't run my day."_
- [ ] 🔴 Bug: Render deploys were reseeding the database on every build, which wiped live lead data and replaced it with demo rows. Remove destructive production seeding and keep seed only for local/dev. — _Priya: "I need the real conversations to survive deploys."_
- [x] 🔴 Guard destructive purge endpoint in production (`DELETE /api/businesses/:id/leads`) unless `ALLOW_LEAD_PURGE=true`. — _Morgan: "No single click should erase customer history in prod."_
- [x] 🟡 Automatic SQLite backups added (startup snapshot + daily cron) with retention rotation. — _Priya: "If a tester asks where data went, we need a recovery story."_
- [x] 🟡 Dashboard stat consistency fix: pending follow-up counts now JOIN non-test leads and startup cleanup removes orphan rows. — _Ray: "Numbers must agree at a glance."_
- [x] 🟡 Owner-facing call-flow explainer added in dashboard (Twilio-primary mode + when a lead is created). — _Ray: "Tell me why a call did or did not show up."_
- [x] 🟡 Added call outcome tracking (`call_events`) + dashboard cards for Calls (24h) and Missed Calls (24h), so answered forwarded calls are visible even when no missed-lead thread is created.
- [x] 🟡 Dashboard terminology simplified for owners: "Reply now", "Waiting on customer", "Follow-ups due now", "Jobs completed".
- [ ] 🟢 Search/filter leads (by status, phone, name)
- [ ] 🟢 Pagination for leads list (currently capped at 50)
- [ ] 🟡 Add explicit "Opted out" chip + list filter for faster owner triage — _Priya: "I need to see compliance state before I click in."_
- [x] 🟢 Wire logo into dashboard header
- [x] 🟢 Outreach playbook created for FB comment + DM follow-up sequence
- [x] 🟢 Outreach templates generalized for future copy/paste while preserving Dan-specific version
- [x] 🟢 Interactive outreach message generator added to playbook HTML (fill fields + one-click copy)
- [x] 🟢 Advanced personalization controls added (style presets, CTA picker, context and location fields)
- [x] 🟢 FB group early-tester post templates added to playbook and generator list
- [x] 🟢 SMB-wide FB group post variants added (any local small business messaging)
- [x] 🟢 Outreach playbook HTML decluttered (quick-start + collapsed advanced sections)
- [x] 🟢 Generator simplified further (tone locked to Neighborly for faster first-use flow)

### Owner Dashboard — Settings Panel
> One screen, accordion sections, auto-save. Plain language labels. Pre-filled with smart defaults.

**Business Profile**
- [ ] 🟡 Inline editing: name, services, pricing, hours, service area — _Jordan: "No business profile edit after creation"_
- [ ] 🟢 Pre-fill default auto-reply template — _Priya: "Owner has to write their own from scratch"_

**AI Agent**
- [ ] 🟡 Toggle AI on/off from dashboard
- [ ] 🟢 Edit tone, max turns, FAQs, "never say" rules from settings

**Messages**
- [ ] 🟢 Customizable voice greeting per business (seasonal messages, peak hours) — _Jordan: "Should be fully customizable eventually"_
- [ ] 🟢 Customize follow-up message templates per business
- [ ] 🟢 Configurable follow-up timing (not hardcoded 1/3/7 days)

**Notifications**
- [ ] 🟡 Text owner when a lead hits "needs_attention" — _Ray: "No way to know a lead needs me unless I'm watching the dashboard"_
- [ ] 🟢 Email notification option for leads needing attention
- [ ] 🟢 Choose who gets notified (owner phone/email)

**Coverage & Delegation**
- [ ] 🟢 Redirect notifications to a backup person (owner on vacation/unavailable)
- [ ] 🟢 Quiet hours — batch notifications instead of real-time

### Messaging Infrastructure

> **Numbering strategy (read this first — easy to forget):**
> Swoop runs on **two parallel number types**, not one. Don't conflate them.
> - **Toll-free `+18337830902` (TFV approved June 23, 2026)** → Swoop's permanent **sandbox / demo / internal test line**. Single number, owned by us, used for our own dev + showing the product to prospects. Cheap (~$2/mo). TFV is complete.
> - **Local 10DLC numbers (one per paying customer)** → the **production** path. Each customer gets their own local number in their area code (a plumber in Sammamish needs a 425 number, not an 833). Rides on Swoop's shared A2P 10DLC Brand + Campaign — register the brand/campaign once, every new customer's number gets attached automatically. This is what real customers will text from.
>
> **Why both:** TFV is needed before we can do realistic end-to-end testing on a real number. 10DLC is needed before customer #1 goes live. Foundation work (LLC, EIN, branded opt-in, welcomematdigital.com showing Swoop as a real product) is identical for both — do it once, satisfies both regimes.
>
> **Sequencing:** finish TFV first (already 80% done, warm contact at Twilio) → use it to test the full flow → register 10DLC Brand + Campaign when first customer signs up.

- [ ] 🟢 Message delivery status tracking (Twilio status callbacks)
- [ ] 🟡 **Landline / non-textable fallback path** — Add Twilio Lookup line-type check (mobile/landline/voip) before first missed-call SMS. If landline/non-textable, skip SMS and mark lead as `no_sms_callback_needed`, then notify owner to call back manually. Keep SMS failure fallback (delivery error handling) as backup for ambiguous VOIP/ported numbers.
- [ ] 🟡 **A2P 10DLC brand + campaign registration for Swoop** — register Swoop as the brand and one "missed-call response" campaign. Once approved, every new customer's local number gets assigned to this shared campaign — no per-customer paperwork wait. Unblocks fast onboarding for real customers. (~$4 brand vetting + ~$10/mo campaign.) **Decided June 13: this is the production path. Toll-free `+18337830902` stays as demo/test only.**
- [ ] 🟡 **Local number provisioning per customer** — once 10DLC approved, buy local Twilio number in customer's area code on signup (a Sammamish plumber needs a 425 number, not an 833). Wire into admin.html "Add Business" flow so number purchase + campaign attach happens automatically. Keep current toll-free as permanent test/demo line. _Bumped from 🟢 → 🟡 on June 13 — confirmed as the customer-onboarding mechanic._
- [ ] 🟢 **Plan B SMS provider notes** — Bandwidth.com or Telnyx as Twilio alternates if verification continues to drag. Same A2P rails, often faster brand approval. (Evaluated Sent.dm + Sendblue May 27 — both passed: Sent.dm still needs A2P; Sendblue is iMessage-only and breaks for Android callers.)

### Go-to-Market — Founding Cohort
> Plan to land first real customers once Twilio toll-free + A2P 10DLC are both approved.

- [ ] 🟡 **Founding 5 cohort** — "First 5 free for 30 days, $19/mo lifetime if they stay" — recruit via NextDoor + local FB trade groups. Cap at 5 concurrent onboardings (Priya: solo founder can't safely onboard 10 at once; run a waitlist for the rest). — _Jordan: "Make it a 'Founding' badge — exclusivity sells."_
- [ ] 🟡 **Marketing copy guardrails (Morgan)** — All outbound pitch posts must say "we text people who already called you" — never "we'll text your customers." Avoid Twilio compliance flags and NextDoor spam reports.
- [ ] 🟢 **Capture customer stories** — Lightweight intake form after week 2 of each founding cohort customer: missed calls recovered, jobs booked, revenue attributed. Becomes the case study library.
- [ ] 🟢 **Competitive watch: Handraiser.ai** — GoHighLevel reseller bundling missed-call text-back + AI website + AI receptionist at $297/$497. Direct overlap with Swoop + FrontDesk AI combined. Strategic options when pricing decisions come up: (a) stay narrow + cheap ($29–49 owner-operator focus), (b) bundle Swoop + FrontDesk AI at $99–149 to undercut, (c) niche down to one trade with deeper grounding. Revisit during pricing milestone.

---

## 📋 v0.3.5 — Notifications & Coverage
- [ ] Owner SMS/email alerts on AI handoff
- [ ] Backup person redirect (delegation)
- [ ] Quiet hours / do-not-disturb mode

---

## 📋 v0.4 — Insights & Team

### Provisioning Service (Phased)
> Guided onboarding flow to stand up a new business — from Twilio number to first test call.

- [ ] 🟡 Admin-guided provisioning wizard in `/admin` with step tracker (Twilio setup → business record → owner setup → verify)
- [ ] 🟡 Auto-provision Twilio number via API (select area code, buy, configure webhooks)
- [ ] 🟡 Pre-fill business record from intake form/questionnaire
- [ ] 🟢 Auto-detect owner's carrier and generate correct forwarding code
- [ ] 🟢 Built-in test call verification step (dial, confirm text arrived, check lead)
- [ ] 🔵 Self-service signup (Stripe → auto-provision → guided profile → test → live) — _v0.5+_

> **Manual checklist for v0.1–v0.3:** See PLAYBOOK.html → Business Onboarding → Operator Provisioning Checklist

### Insights Dashboard
- [ ] Leads this week/month trend
- [ ] Conversion rate (leads → converted)
- [ ] Response time (how fast AI responded)
- [ ] Missed calls by time of day (shows when they need coverage)
- [ ] ROI calculator: "Swoop captured X leads worth ~$Y this month" — _Jordan: "No analytics at all"_

### Team & Roles
- [ ] Add a second person (employee/partner)
- [ ] Role-based access: can reply vs. view-only
- [ ] Lead routing by zip code (multi-truck businesses)

### AI Features (Advanced)
- [ ] Smart lead scoring (based on message sentiment, response speed)
- [ ] AI-generated follow-up messages tailored to the lead's inquiry
- [ ] Appointment booking via text (integrate with calendar)
- [ ] Conditional call forwarding mode (carrier forwards missed calls directly)
- [ ] AI voice agent (answer the actual call)

### Operations
- [ ] Automated tests (unit + integration)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Error monitoring (Sentry or similar)
- [ ] Logging improvements (structured JSON logs)
- [ ] Database backups strategy

---

## 📋 v0.5 — Billing & Scale

### Admin Console (Platform Operator)
> `/admin` — Single pane of glass for Swoop team to manage and monitor everything.

- [x] 🟡 Platform-wide stats (businesses, leads, messages, AI usage, handoffs)
- [x] 🟡 Businesses table with per-business metrics (leads, conversions, messages, AI turns, last activity, health status)
- [ ] 🟡 Disable/enable a business from admin
- [ ] 🟡 Impersonate/view a business owner's dashboard
- [ ] 🟢 Onboarding funnel (signed up → configured → first lead → converted)
- [ ] 🟢 System health (Twilio errors, OpenAI failures, webhook latency)
- [ ] 🟢 Revenue tracking (when billing exists)
- [ ] 🟢 Broadcast announcement to all business owners
- [ ] 🔴 Auth gate on `/admin` — _must not be publicly accessible_

### Billing (Stripe)
- [ ] Self-service plan selection ($29/$59/$99)
- [ ] Usage tracking (text-backs this month)
- [ ] Upgrade/downgrade from settings
- [ ] 14-day free trial flow

### Integrations
- [ ] Google Calendar integration for appointment scheduling
- [ ] Zapier/webhook triggers for CRM integrations
- [ ] White-label support (custom branding per business)
- [ ] ServiceTitan / Housecall Pro CRM sync

### Growth
- [ ] Landing page / marketing site
- [ ] Multi-number support (one business, multiple Twilio numbers)
- [ ] Voicemail transcription

---

## � v0.5+ — Competitor-Inspired Features

> Items sourced from competitor analysis (Avoca, Podium, GoHighLevel, Broccoli). See PLAYBOOK.html → Competitors tab for full breakdown.

- [ ] 🟡 Speed to Lead — instant SMS to web form fills (inspired by Avoca)
- [ ] 🟡 Per-industry landing pages ("Swoop for Plumbers", "Swoop for HVAC") — Podium/Avoca do this
- [ ] 🟡 Agency/reseller partnership program — GoHighLevel model
- [ ] 🟡 ROI dashboard: "Swoop saved you $X this month" — _Jordan: "Competitors all show ROI metrics"_
- [ ] 🟢 "AI Employee" persona naming/branding — Podium's framing resonates
- [ ] 🟢 Conversation quality scoring — Avoca's Coach product (lite version)
- [ ] 🟢 Google review response automation — Podium does this beyond just requesting reviews
- [ ] 🔵 AI voice answer (pick up the actual call) — Avoca/Broccoli territory. Only if market demands.

---

## �🔵 By Design (Consciously Deferred)

_Items the Squad flagged that we've decided NOT to address now, with rationale._

| Item | Who flagged | Rationale | Revisit when? |
|------|-------------|-----------|---------------|
| Push notifications / mobile app | Jordan | Web-first, no app store overhead for a solo founder | After 10+ paying customers |
| "Test your setup" flow | Priya | Manual onboarding is fine at <10 customers. Build when it saves more time than it costs. | v0.4 onboarding wizard |
| Analytics dashboard | Jordan | Premature — need real data from real customers first | After 30-day usage data exists |
| Add Business form has 15+ fields | Ray | Advanced fields are optional. Could hide behind "Advanced" toggle but not blocking. | If onboarding drop-off is measured |

---

## 💰 Service Stack & Costs

_Current infrastructure and upgrade triggers. Update this as services change._

| Service | Current Tier | Monthly Cost | Upgrade Trigger | Paid Cost |
|---------|-------------|-------------|-----------------|-----------|
| **Render** (hosting) | Free | $0 | First paying customer | $7/mo + $0.25/GB disk |
| **Twilio** (voice/SMS) | Pay-as-you-go | ~$2/number | Already paying | ~$2/number + $0.0085/SMS + $0.014/min |
| **OpenAI** (AI replies) | $5 prepaid | ~$1-2/mo | Top up when low | ~$1-5/mo (gpt-4o-mini) |
| **GitHub** (repo) | Free | $0 | Never | $0 |
| **Domain** | None | $0 | Before first customer | ~$12/yr |
| **Stripe** (billing) | Not set up | $0 | When billing goes live (v0.5) | 2.9% + $0.30/txn |

**Est. total at launch (1-5 customers): ~$15-20/mo**
**Break-even: 1 customer at $29/mo**
