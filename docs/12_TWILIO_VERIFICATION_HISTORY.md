# 12 — Twilio Verification History

> **This document is mandatory reading before changing anything that touches SMS, the consent page, the privacy page, the terms page, the default `auto_reply_message`, the STOP/HELP keyword handlers, or the AI agent's anti-marketing rule.**
>
> Every painful lesson here was learned the slow, expensive way over six weeks. Read it. Do not relearn it.

---

## Snapshot — Current State (August 19, 2026 — TFV APPROVED; DEMO CALL VERIFIED)

| Item | Status | Reference |
|---|---|---|
| **Business entity** | WelcomeMat Digital LLC (WA, UBI 606238837, EIN 42-2903620) | June 1, 2026 |
| **Twilio account** | Paid (upgraded from Trial June 1) | |
| **Twilio Business Profile** | ✅ **Approved June 11, 2026** | Bundle `BUf71fa573b0fd6173b0cc31daba2ba41b`, manual review by Jennifer |
| **Toll-Free Number** | `+1 (833) 783-0902` | Demo / test line per June 13 decision |
| **TFV (Toll-Free Verification)** | ✅ **APPROVED June 23** on SID `HH260e95b417689297554480bd502c5e88` | Direct update via `messaging.v1.tollfreeVerifications(sid).update()` bypassed Console form bugs and moved the record into review. Twilio Consumer Trust Team approval email received the same evening confirming `+1 (833) 783-0902` may now send SMS and MMS through Twilio. |
| **A2P 10DLC** | ⏳ Not started | Production path for customer numbers — see [10_NEXT_STEPS.md](10_NEXT_STEPS.md) N-6 |
| **BOI (FinCEN)** | ✅ Permanently exempt | March 2025 FinCEN final rule |
| **Privacy page hardened** | ✅ June 14, 2026 | frontdesk-ai commit `5e3dc3c` — three coverage points of Twilio "magic phrase" |
| **Consent page — Verbal IVR script (June 22 revision)** | ✅ June 22, 2026 | swoop + frontdesk-ai — step-by-step verbatim IVR dialogue with dynamic business name, message types (callback responses, appointment reminders), frequency (up to 7 per missed call) |
| **Voice webhook — Verbal disclosure** | ✅ June 22, 2026 | `server/routes/webhooks.js` — `twiml.say()` plays on every inbound call with business name, message disclosure, Msg&data, STOP opt-out |
| **Open compliance issues** | ✅ **TFV closed; production messaging still needs 10DLC.** | The toll-free number is approved for SMS/MMS demo traffic. It is not the planned customer-number strategy. |

### August 19, 2026 operational note

- Direct calls to `+1 (833) 783-0902` were tested successfully after Render was upgraded to Starter and the 1 GB disk was mounted at `/var/data`.
- A friend's phone classified the toll-free number as possible fraud and disconnected the call before Swoop could be experienced normally. This is carrier/device caller-reputation behavior, not an application-generated warning.
- The `833` number is therefore retained as an internal demo/test line. Production customers should receive local numbers under the A2P 10DLC path.
- The current demo voice flow plays an initial compliance disclosure, rings the owner's configured phone, and may play a second missed-call confirmation before sending the SMS. A separate forwarded-call mode is required before customer onboarding.

---

## Why Verification Is Hard (the one-paragraph version)

The US SMS ecosystem requires that every commercial / A2P sender go through one of three verification regimes:
- **Toll-free verification (TFV)** for 8XX numbers
- **A2P 10DLC brand + campaign** for local numbers
- **Short codes** (enterprise only, $1k+ setup)

Verification reviewers (working at Twilio Trust Hub, with reviewers like Ignacio and Jennifer) look at three things: (1) is this a real registered business, (2) is consent collected properly, (3) is the sample message branded with sender ID + STOP/HELP + Msg&data disclosure. Failing any one = rejection with a numeric error code.

Behind Twilio sits a third-party identity verification vendor (**Persona**) that uses commercial data brokers (Dun & Bradstreet, LexisNexis) for KYB. These brokers lag IRS / state-level data by 2–6 weeks. A freshly-issued EIN will fail Persona automatic checks even when state and IRS data are correct — the only fix is a manual review with a multi-source evidence package. **This is the single most important lesson in this entire document.**

---

## Full Timeline

### Phase 1 — Pre-LLC (May 2026)

**May 26, 2026** — Initial TFV submission with personal name (no LLC yet). Compliance evidence page added (`COMPLIANCE_EVIDENCE.html`, later moved into PLAYBOOK Compliance tab). Privacy + consent + terms URLs initially pointed at `sunilmsft.github.io/swoop/consent.html` (single page, GitHub Pages, always-on to avoid Render cold-start interstitials during automated validation).

**May 29, 2026** — **v0.2.7 carrier-compliance code shipped:**
- Default `auto_reply_message` rewritten with branded sender ID + Msg&data + STOP/HELP on the very first message
- HELP keyword reply now points to live privacy URL
- AI agent system prompt: explicit anti-marketing rule
- `public/consent.html` fully rewritten — removed incorrect "verbal consent during call" wording, replaced with FCC prior-express-invitation + CTIA call-back-exception basis
- Holdco restructure shipped: `welcomematdigital.com` parent + `/swoop` product subpages

### Phase 2 — Business Identity (June 1–2, 2026)

**June 1, 2026** — Launch Identity Day 1:
- WA LLC approved in 3 days (vs 2–7 estimate) — UBI 606238837
- Federal EIN issued — 42-2903620
- Zoho Mail Lite live — `hello@` + `privacy@welcomematdigital.com`
- Twilio account upgraded Trial → Paid (with auto-recharge, $20 starting balance)
- All Swoop TFV compliance code pushed (swoop @ `8f3c7c9`)
- 6 frontdesk-ai commits pushed + live at welcomematdigital.com

**June 2, 2026** — Launch Identity Day 2:
- WA Business License FILED at business.wa.gov — Confirmation `#0-052-653-982`, $66.92 total (Sammamish home occupation endorsement included)
- WA SOS → WA DOR sync confirmed in 24h (UBI active in DOR Business Lookup, not 48h as feared)
- WA DOR FEIN validation passed — proves IRS sync of EIN complete, unblocked Twilio Business Profile resubmit
- **Twilio Business Profile RESUBMITTED** — Bundle SID `BUf71fa573b0fd6173b0cc31daba2ba41b`, status "In Review"
- Mercury bank account APPROVED same day
- Calendar reminders set: BOI check (then-June 15, later moved to June 23), Zoho renewal, WA license renewals, **June 30 2027 hard Annual Report deadline**

### Phase 3 — Business Profile Saga (June 5–11, 2026)

**June 5, 2026** — 3 business days into BP review, still "In Review" — edge of normal SLA. Huvi (Trust Hub support) clears the standalone opt-in flow at `welcomematdigital.com/swoop/consent.html#opt-in-flow`. Permissive "resubmit when ready". Sent soft nudge to Ignacio (ticket 27236005) for visibility on BP status.

**June 10, 2026** — **Business Profile REJECTED.** Two error codes:
- **`18606`** — email domain mismatch (Notification Email still on Trust Hub bundle was `sunil1308@gmail.com`, not the company-domain `hello@welcomematdigital.com`)
- **`18602`** — "Business ID could not be verified"

Reviewer: **Jennifer (trusthub-verify@twilio.com)**.

**June 11, 2026 morning — Root-cause diagnosis on `18602`:** Persona uses commercial brokers (D&B / LexisNexis) that lag IRS by 2–6 weeks. EIN was only 10 days old. WA DOR FEIN check already passed June 2 confirming IRS-side correctness, but Persona's lookup failed with "the business registration number and legal name don't match" despite exact-match entry. **Could not brute-force the Persona wizard** — it auto-failed at the EIN step before even reaching the Notification Email field.

**June 11, 2026 mid-morning — Manual verification email sent to Jennifer.** Sent FROM `hello@welcomematdigital.com` (the act of replying from the company domain itself addresses `18606` per Jennifer's instructions). Attached IRS CP 575 + WA Certificate of Formation. Asked for either (a) manual approval based on attached docs, or (b) guidance on additional documentation. Noted that Notification Email field would be updated as soon as EIN step let the wizard advance.

**June 11, 2026 noon — Follow-up evidence package sent.** Ran two third-party lookups and emailed screenshots:
- **D&B Business Directory** → "No results found" for WELCOMEMAT DIGITAL LLC (confirms D&B/broker has not yet ingested the entity, **proves Persona failure is upstream not us**)
- **OpenCorporates** → Found WELCOMEMAT DIGITAL LLC registered in WA at 23013 SE 13TH PL Sammamish (confirms state-level registration is correct)

The contrast between the two lookups proved the issue was strictly third-party broker propagation lag, NOT a name/EIN error on our side.

**June 11, 2026 ~1pm — Business Profile APPROVED.** `donotreply@twilio.com` confirmation received approximately one hour after the evidence email. Jennifer did a manual review based on the package. **🎯 The single biggest lesson of this entire process is in the next callout box.**

> **🎯 LESSON: When Persona's automated KYB fails on a young EIN, don't waste cycles on the wizard — go straight to manual review with a multi-source evidence package (CP 575 + state filing + negative D&B lookup + positive OpenCorporates lookup). Works fast.**

**June 11, 2026 PM — TFV resubmitted to Ignacio (ticket 27236005).** Submitted via Console → Phone Numbers → Regulatory Compliance → TFV. Status: "Your toll-free registration is being reviewed."

Full submission contents (for reference if anything needs re-submission):
- **Legal name:** WELCOMEMAT DIGITAL LLC | **DBA:** Swoop | **Type:** PRIVATE_PROFIT
- **EIN:** 42-2903620 | **Business website:** https://welcomematdigital.com
- **Address:** 23013 SE 13th Pl, Sammamish, WA 98075
- **Contact:** Sunil Venugopal, hello@welcomematdigital.com, +1 425-786-7232
- **Use case:** Customer Care | **Volume:** 100/mo | **Opt-in:** Verbal
- **Opt-in proof URL:** https://welcomematdigital.com/swoop/consent.html#opt-in-flow (Huvi-cleared June 5)
- **Terms URL:** https://welcomematdigital.com/swoop/terms.html
- **Privacy URL:** https://welcomematdigital.com/swoop/privacy.html
- **Sample message:** *"Hi! This is Mike's Plumbing returning your missed call. Msg&data rates may apply, reply STOP to opt out or HELP for help. How can we help?"* (real seed-data template)
- **Opt-in & Help messages:** branded "Mike's Plumbing:" prefix, callback to (833) 783-0902, STOP/HELP/Msg&data
- **Additional info:** NOTE FOR REVIEWER about Mike's Plumbing being example partner business, references BP approval, Ignacio's ticket, Huvi's clearance, Cert of Formation Drive link
- **Notification email:** hello@welcomematdigital.com

> **🎯 LESSON: Twilio TFV form has a hard 500-character limit on both "Use case description" and "Additional information" fields. Write tight. Form auto-saves but closes hard if you navigate away — keep a copy-paste reference handy.**

Heads-up email also sent to Ignacio on the existing ticket thread `[Twilio] Re: toll-free verification request of +18337830902`, confirming BP approval and TFV resubmission. Huvi loop closed on the older opt-in-flow ticket (27235615).

### Phase 4 — TFV Round 2 Saga (June 13–14, 2026)

**June 13, 2026** — TFV submitted June 11 PM was **rejected** with reason **`30527`** — "Business Registration Number Is Missing or Invalid".

**Root cause:** EIN was submitted as `422903620` (no dash). This is the same broker-sync issue that tripped the Business Profile — D&B doesn't have the newly-issued EIN, so the dashless format triggered a broker validation failure.

**Fix:**
- Changed EIN to `42-2903620` (canonical IRS format with dash)
- Updated notification email back to `hello@welcomematdigital.com` (Trust Hub bundle's was the one that mattered, but the form field had reverted)
- Restored Terms URL (had silently dropped on edit — the form's prefill cannot be trusted)
- Rewrote Additional Information to lead with "RESUBMIT after 30527" + cross-reference BP approval `BUf71fa573b0fd6173b0cc31daba2ba41b` + Ignacio ticket `27236005`

Resubmitted late June 13. **In prioritized resubmission queue (7-day window).**

> **🎯 LESSON: When EIN-validation fails on a newly-issued EIN, use the dashed format AND explicitly request manual review citing the prior BP approval. Also: do not trust the form prefill. The Terms URL was missing on resubmit even though we'd set it before.**

**Strategic decision made same day:** Toll-free `+18337830902` will stay as Swoop's permanent demo/test line. Production customer numbers will be on A2P 10DLC. Reasoning: customers don't trust 833 numbers; local numbers in the customer's own area code feel native; a single shared 10DLC campaign means new customer onboarding doesn't wait for per-customer vetting.

**June 14, 2026 — Privacy page proactively hardened.** Ignacio sent an **advisory** compliance email (not a rejection — just guidance on Mixed-Use-Case pitfalls common to web-form opt-in templates). Two risks: (a) the Twilio "magic phrase" was absent from privacy, (b) reviewer pattern-matching against the template. Solution: harden `frontdesk-ai/public/swoop/privacy.html` with three coverage points of the magic phrase.

Commit `5e3dc3c` (frontdesk-ai, PUSHED) — three edits via multi-file replace:
1. **Top-of-page no-share callout** with bolded text: *"We do not sell, rent, or share phone numbers, SMS opt-in data, or any mobile information with third parties or affiliates for marketing or promotional purposes — ever."*
2. **Section 5 expanded** to include "SMS opt-in data, or any mobile information... affiliates."
3. **NEW Section 6 "Mobile information & SMS opt-in data"** with the exact Twilio magic phrase + explicit list of allowed recipients (Subscriber business, Twilio, OpenAI, authorized WelcomeMat staff only).

Sections 6→7 through 11→12 renumbered. Live at `https://welcomematdigital.com/swoop/privacy.html`.

Acknowledgment reply sent to Ignacio June 14 thanking him for the guidance and noting privacy.html update + TFV still in review — no new asks.

> **🎯 LESSON: When Twilio sends advisory compliance guidance during an active review, strengthen the linked URLs (they get re-fetched by the reviewer) rather than ignoring it. Cheap insurance against next-round rejection.**

### Phase 5 — TFV Round 2 Rejection + Escalation (June 15, 2026)

**June 15, 2026 ~4:41pm PDT** — Ignacio sent an advisory email saying he was placing the ticket on hold pending follow-up, and asked us to follow up via Console.

**June 15, 2026 ~6:17pm PDT** — `trusthub-verify@twilio.com` sent **rejection** of TFV Request SID `HH260e95b417689297554480bd502c5e88` with reason **`30527`** ("Business Registration Number Is Missing or Invalid") — the SAME code as round 1. 7-day prioritized resubmission window opened (closes **June 22, 2026**).

**Diagnosis:** Same broker-sync lag root cause as the June 10 BP rejection AND the June 13 TFV round 1. Persona's automated KYB still has not picked up the EIN (now ~14 days old). Persona does not read the Additional Information field, so any amount of context written there is ignored on automated re-checks.

**Form-bug recurrence (validates Lesson #4):** Reopened the TFV form to inspect it before deciding next move. Found:
- **EIN displaying as `422903620` (no dash)** — even though `42-2903620` was submitted on June 13. The form is silently stripping the hyphen on save or display.
- **Terms URL field blank** — even though `https://welcomematdigital.com/swoop/terms.html` was set on June 13. Same silent-drop bug.

This confirms the form prefill is genuinely buggy and re-corrupts saved values between sessions. **Decided NOT to resubmit on the form** — every re-save risks dropping more fields, and Persona will auto-reject again on `30527` regardless because the broker data hasn't caught up.

**Escalation email sent June 15 PM** — Reply on Ignacio's existing email thread, FROM `hello@welcomematdigital.com`, citing:
- Round 2 rejection details (request SID, code, timestamp)
- BP precedent (`BUf71fa573b0fd6173b0cc31daba2ba41b` approved June 11 by Jennifer via manual review on the same broker-sync lag)
- The form-bug observations (EIN dash strip + Terms blank) as a reason NOT to brute-force resubmit
- Explicit ask: manual review based on the existing approved BP bundle

Attachments included: EIN.pdf (IRS CP 575) + WA Cert of Formation + WA Business License confirmation + D&B "no record" screenshot + OpenCorporates "found" screenshot. **Excluded** (do not attach to Twilio): personal driver's license, Mercury bank backup codes, internal Identity Snapshot HTML.

> **🎯 LESSON: Lesson #4 ("do not trust the form prefill") is now twice-confirmed. The TFV form re-corrupts saved EIN (strips dash) and silently drops the Terms URL between submissions. After any save, reopen the form before resubmit and visually verify EIN format and every URL field. Better: don't resubmit on the form at all when the rejection is broker-sync — escalate via the reviewer's email thread instead.**

> **🎯 LESSON: When a TFV rejection code repeats with the same root cause (broker-sync lag), a second resubmit on the form is wasted — it will auto-reject again because Persona's automated check does not read the Additional Information field. The only path with a real chance of approval is a manual-review request on the reviewer's email thread, citing the prior BP approval as precedent.**

### Phase 6 — Ignacio's Three-Item Response (June 16, 2026 AM)

**June 16, 2026 AM** — Ignacio replied to the June 15 escalation. He did NOT approve manually; instead he gave a specific 3-item fix list:

1. **BRN/EIN proof must be publicly accessible** — the Cert of Formation Drive link previously sent was good but not directly tied to the BRN. He wanted the EIN documentation (IRS CP 575) itself hosted at a publicly-viewable URL inside the TFV submission.
2. **Notification email mismatch** — the value Twilio saw in the resubmission was `sunil1308@gmail.com` again, not `hello@welcomematdigital.com`. (This is the silent form-bug — see Lesson #4 update.)
3. **Sample message must be branded AND complete** — the round-2 sample was branded but missing message frequency and the Terms URL inline. CTIA "branded and complete" means brand + service description + frequency + Msg&data + STOP + HELP + Terms URL all in the first message.

This reframed the situation: it was NOT broker-sync lag on the EIN (which had been our Round 1/2 hypothesis). It was three concrete, fixable problems. Re-energized after the false despair of Phase 5.

### Phase 7 — Round 3 Code Fixes + Resubmission (June 16, 2026 PM)

**Code changes (swoop commit `42fdf7f` + frontdesk-ai commit `86a36c8`, both PUSHED):**

1. **`public/consent.html` (swoop)** + **`frontdesk-ai/public/swoop/consent.html`** — rewrote the `#opt-in-flow` section as a verbatim IVR-style script: "You called Mike's Plumbing... press 1 to receive a text back..." with the exact first SMS shown right after. The verbatim flow is what a Twilio reviewer can read end-to-end without inference.
2. **`server/db/database.js`** — updated default `auto_reply_message` to "Option A" template: `{Business Name} here, returning your missed call. We'll send up to 7 msgs to coordinate. Msg&data rates may apply. Reply STOP to end, HELP for help. Terms: welcomematdigital.com/swoop` — every CTIA branded-and-complete element in one short message.
3. **`server/seed.js`** — Option A applied to Mike's Plumbing + Sara's Electric seed records so demo/test traffic matches what Twilio sees in the sample.
4. **EIN PDF uploaded to Google Drive** (anyone-with-link view) — `https://drive.google.com/file/d/1621llFjbUY_Dez3G84nQooDsjQvPc3zc/view` — to satisfy Ignacio's item #1 inline within the TFV form.

**TFV form resubmission (June 16 PM):**

Methodical field-by-field walkthrough with screenshot verification of every page before clicking Submit. Form-bug observed for the THIRD time: Notification Email field auto-reverted from `hello@welcomematdigital.com` back to `sunil1308@gmail.com` on the final page (the Twilio console autofills from your account email each time you advance a page). Corrected on the final page and visually verified before clicking Submit.

Final submission contents (round 3):
- **Use case description** (≤500 chars): rewrote to lead with the trigger ("call goes unanswered, Swoop texts back"), frequency (1-7 msgs/missed call), and all CTIA elements explicitly enumerated; ends with opt-in flow URL.
- **Sample message:** Option A verbatim (brand + frequency + Msg&data + STOP + HELP + Terms URL).
- **Terms URL:** `https://welcomematdigital.com/swoop/terms.html` (re-checked after page navigation — held).
- **Opt-in keywords field:** left empty (grey placeholder `START, STOP` is the field's hint, not a value — verbal opt-in means no keyword auto-reply).
- **Opt-in message field:** left empty (verbal opt-in means there's no keyword-triggered enrollment SMS).
- **HELP message:** branded "Mike's Plumbing: Reply HELP for help or call (833) 783-0902. For privacy info, visit welcomematdigital.com/swoop/privacy.html. Reply STOP to opt out. Msg&data rates may apply."
- **Additional Information** (≤500 chars): "ROUND 3 RESUBMIT (rejection 30527, ticket #27236005)" header + 3-item map (Drive URL for EIN + hello@ email update + branded-complete opt-in URL).
- **Notification email:** `hello@welcomematdigital.com` (force-overridden on final page, visually verified before checkbox + submit).

Confirmation page: "Thanks for submitting your toll-free registration! Your toll-free registration is being reviewed."

**Reply email to Ignacio sent June 16 PM** on existing ticket thread, mapping each of his 3 items to the corresponding fix + Drive URL for EIN + Drive folder link for the per-page form screenshots (`https://drive.google.com/drive/folders/1pme_s7L2wIl1Spw85dcHzGBKzAXUawXu?usp=sharing`). Pre-empted the email form-bug by explicitly flagging that the Notification Email auto-reverted on page advance and was corrected before submit.

> **🎯 LESSON (Lesson #4 — now THRICE-confirmed): The TFV form's Notification Email field auto-reverts to the Twilio console account email (`sunil1308@gmail.com`) every time you advance a page in the wizard. It is not a one-time prefill bug — it re-corrupts on every page navigation. Workflow: fix it LAST, on the final page, just before the confirmation checkbox; visually verify it shows `hello@welcomematdigital.com` immediately before clicking Submit. Same field-by-field discipline applies to EIN dash format and Terms URL. The other two form-bugs (EIN dash strip, Terms URL drop) were NOT observed on Round 3 — likely because we did the verification walk-through on a single uninterrupted session. The Notification Email reset is the persistent one.**

> **🎯 LESSON: Don't conflate "reviewer is rejecting again" with "reviewer hates us / brokers haven't caught up." Round 2 looked like broker-sync deadlock, but Ignacio's Round 3 reply showed it was three concrete, fixable items all along. When a reviewer reopens a ticket from on-hold and gives a numbered list, treat it as a gift — execute each item literally and reply with a 1:1 mapping.**

> **🎯 LESSON: CTIA "branded AND complete" is a literal seven-element checklist for the FIRST message: brand + service description + frequency + Msg&data + STOP + HELP + Terms URL. Missing any one = rejection. The Option A template now in `database.js` hits all seven in under 160 chars (one SMS segment).**

### Phase 8 — Round 3 Auto-Rejection + Dash-Strip Discovery (June 16, 2026 evening)

**June 16, 2026 ~3:04 PM PDT** — `trusthub-verify@twilio.com` rejected Round 3 with code `30527` again. ~4 hours after submission. Speed alone implies the rejection came from Persona's automated pre-check, not from Ignacio or any human reviewer (human SLA is 2–7 business days).

**June 16 evening — Reopened the form to audit what Twilio actually has on file** (look-don't-save discipline: do not click Next or Submit, only inspect). Result of the field-by-field audit:

| Field | What was submitted | What the form now displays | Status |
|---|---|---|---|
| Legal entity name | WELCOMEMAT DIGITAL LLC | WELCOMEMAT DIGITAL LLC | ✅ |
| Website | welcomematdigital.com | welcomematdigital.com | ✅ |
| **Page-1 contact "Email"** | hello@welcomematdigital.com | **sunil1308@gmail.com** | ❌ reverted (Lesson #4 again) |
| Phone | 4257867232 | 4257867232 | ✅ |
| Business Type | Private Profit | Private Profit | ✅ |
| DBA | Swoop | Swoop | ✅ |
| Business Registration Type | EIN | EIN | ✅ |
| **Business Registration Number** | **42-2903620** | **422903620** | ❌ **DASH STRIPPED** — likely root cause of 30527 |
| Issuing Country | United States | United States | ✅ |
| Terms & Conditions URL | welcomematdigital.com/swoop/terms.html | same | ✅ held this round |
| Opt-In Keywords | (empty) | (empty) | ✅ |
| Estimated monthly volume | 100 | 100 | ✅ |
| Opt-in type | Verbal | Verbal | ✅ |
| Use case category | Customer Care | Customer Care | ✅ |
| Proof of consent URL | welcomematdigital.com/swoop/consent.html#opt-in-flow | same | ✅ |
| Use case description | full Option A description | same | ✅ |
| Sample message | Option A | Option A | ✅ |
| **Page-3 "E-mail for notifications"** (different field from Page-1 Email) | hello@welcomematdigital.com | hello@welcomematdigital.com | ✅ held |
| Additional information | ROUND 3 RESUBMIT… | full text intact | ✅ |

**Key discoveries:**

1. **The Console form silently strips the dash from the BRN field on save.** EIN saved as `422903620`. If Persona's automated KYB matches on canonical IRS format (`XX-XXXXXXX`), a 9-digit dashless string fails every time. This is consistent with all three rounds of code 30527 — not broker-sync lag as previously hypothesized.
2. **There are TWO email fields, not one.** Page-1 "Email" (contact email) and Page-3 "E-mail for notifications" are separate. The Page-1 field reverts to the Twilio console account email (`sunil1308@gmail.com`) on every save. The Page-3 field held correctly this round. **Lesson #4 should be split:** Page-3 notification email behavior is variable round-to-round; Page-1 contact email reversion is reproducible.
3. **Terms URL held this round** (had dropped in Round 1–2). Single-session field-by-field entry likely fixes that.

**Escalation email sent to Ignacio June 16 evening** on existing ticket thread, FROM `hello@welcomematdigital.com`, leading with the dash-strip evidence. Side-by-side framing: "Form currently displays `422903620` / Actual EIN on IRS CP 575 is `42-2903620`" + Drive folder link for the audit screenshots + Drive link for the CP 575. Asked for manual override (citing Jennifer's June 11 BP approval as precedent) and for guidance on whether the Messaging Compliance API path preserves the dash where the Console form doesn't. Did NOT resubmit on the form — every save will re-strip the dash and auto-reject again in ~4 hours.

> **🎯 LESSON (Lesson #3 — CORRECTED): The TFV Console form's BRN field silently strips the dash from a submitted EIN. You CANNOT win this in the UI. Previous lesson ("always use dashed format") was directionally right but practically wrong: typing `42-2903620` and typing `422903620` both result in the form storing `422903620` on save. The fix is either (a) Ignacio's manual override against the BP-approved entity, or (b) the Messaging Compliance API path which may not have the same input sanitizer.**

> **🎯 LESSON: A ~4-hour rejection turnaround on a TFV resubmit means automated rejection, not human review. Human reviewers (Ignacio, Jennifer) take 2–7 business days. If you get rejected the same business day with no reviewer notes, the failure is in Persona's pre-check, not in any of the items the reviewer asked you to fix.**

> **🎯 LESSON: Pre-submit screenshots can't prove what the form saved, only what you typed before clicking Submit. To diagnose form-bugs, reopen the form AFTER rejection and screenshot each page — those screenshots are the ground truth of what the reviewer / Persona actually saw.**

### Phase 9 — Toll-Free Team Response: Verbal Consent Script Required (June 21, 2026)

**June 17, 2026 ~10:11 AM PDT** — Ignacio replied on ticket `27236005`: "I have created an appeal - as soon as we have a response from our toll-free team, I will let you know." This confirms escalation is accepted and actively in queue.

**June 23, 2026** — Switched from `trusthub.v1.complianceTollfreeInquiries.create` (which only opens an embedded Persona session, not a real TFV update) to the correct endpoint: `messaging.v1.tollfreeVerifications(sid).update()`. Fixed four field corruption issues left by the Console form: contact email → `hello@`, `CUSTOMER_CARE` enum (all-caps, no space), `editReason` added, `additionalInformation` updated with verbal script summary. TFV status moved from `TWILIO_REJECTED` → `IN_REVIEW`, then to **APPROVED** the same evening. Official Twilio Consumer Trust Team acknowledgment email arrived first, followed by the approval email confirming `+1 (833) 783-0902` may now send SMS and MMS through Twilio. Reply sent to Ignacio on ticket #27236005. **🎯 LESSON: The correct direct TFV resubmission endpoint is `messaging.v1.tollfreeVerifications(sid).update()` — NOT the TrustHub compliance inquiries path, which only starts a Persona UI session.**

**June 21, 2026** — Ignacio relayed the toll-free team's response. The team is NOT asking about the EIN/BRN at this stage — the blocking issue is the **missing verbal consent script**. Exact feedback:

> "At this time, a script for the verbal consent process has not been provided. In order for verbal consent to be accepted, we need a detailed script or a simulated conversation that clearly shows how users are informed and how their consent is obtained. Without this information, we're unable to verify compliance."

The team requires:
1. **The exact language used to obtain verbal consent** — verbatim IVR script
2. **Clear opt-out instructions** — how callers are told they can stop messages

They provided a reference example (Twilio IVR best-practices blog) and said: "Once this is provided, we'll be happy to continue with the review."

**Root cause of this gap:** The TFV form had opt-in type set to "Verbal" and the opt-in proof URL pointed to `consent.html#opt-in-flow`. But that page described the flow in prose ("functionally equivalent to a verbal IVR") rather than as a verbatim script. The voice webhook also played NO verbal disclosure — it just forwarded the call or hung up silently. We had the concept of verbal opt-in but not the actual implementation.

**Fixes applied June 21 (LOCAL — not yet pushed):**
1. **`server/routes/webhooks.js`** — added `twiml.say()` verbal disclosure before `<Dial>`: *"Thank you for calling {Business Name}. If we miss your call, we will send a text message to follow up. Message and data rates may apply. Reply STOP at any time to stop messages."* Every caller now hears a verbal disclosure before the call is forwarded or ends.
2. **`public/consent.html`** (`#opt-in-flow` section) — rewrote from prose to a verbatim step-by-step IVR script with dialogue format: IVR speaks → call ends missed → SMS sent → customer replies → confirmation sent. Includes exact wording for each step. Last updated date updated to June 21.

**Pre-clearance reply SENT June 21** — Replied to Ignacio on ticket `27236005` FROM `hello@welcomematdigital.com` with the full verbal IVR script inlined. Asked him to confirm (1) the script is acceptable to the toll-free team and (2) whether any other items are outstanding before resubmitting the form. Updated `consent.html#opt-in-flow` URL included.

**Ignacio feedback received June 22, 1:14 PM PDT** — Two refinements to the verbal script:
1. **Business name must be explicit** — not a placeholder. The script now shows: *"Thank you for calling {Business Name}"* which clarifies that the business name is dynamically substituted (e.g., "Thank you for calling Acme Plumbing").
2. **Script must specify kind of messages + frequency** — Ignacio provided a Twilio IVR example that specified message type and frequency explicitly. Our original script only said "we will send a text message to follow up" without saying WHAT kind or HOW MANY. 

**Revised verbal disclosure (UPDATED June 22, ready to push):**
> *"Thank you for calling {Business Name}. If we miss your call, we will send you a text to follow up. You may receive up to 7 messages regarding your missed call — including responses to your questions and appointment reminders. Message and data rates may apply. Reply STOP at any time to stop all messages."*

This now includes:
- Dynamic business name substitution
- Kind of messages (responses to questions, appointment reminders)
- Frequency (up to 7 per missed call)
- Msg&data rates
- STOP opt-out

**Status:** Script confirmed acceptable by Ignacio. **Ready to push code + resubmit form on June 22.**

**Watch items:**
- Hard deadline: prioritized resubmit window closes June 22 — push code + send Ignacio reply TODAY
- India trip departs June 25 — land a decision before then
- **PARALLEL TRACK still open:** A2P 10DLC brand vetting proceeds regardless of TFV outcome (production was always going 10DLC)
- If Ignacio confirms script is acceptable AND no other items outstanding → push code → resubmit via form (or API if dash-strip is still a problem) → email Ignacio with form screenshot + pre-empt the email field reset
- If Ignacio flags additional items → fix them first before any resubmit

> **🎯 LESSON: "Verbal opt-in" on a TFV form requires a verbatim IVR dialogue script AND an actual verbal disclosure in the call flow. Saying the flow is "functionally equivalent" to a verbal script is not sufficient. The reviewer needs to read the exact words a caller hears.**

> **🎯 LESSON: When a toll-free team escalation comes back with a list of items, ask the reviewer to confirm there are no other open issues before resubmitting. Every resubmit risks another automated rejection cycle. Pre-clearance via email costs nothing and avoids the 4-hour Persona gate.**

### Phase 9 — Toll-Free Team: Verbal Script Required + June 22 Form Resubmission (June 21–22, 2026)

**June 17, 2026 ~10:11 AM PDT** — Ignacio replied on ticket `27236005`: "I have created an appeal - as soon as we have a response from our toll-free team, I will let you know." Escalation accepted and queued.

**June 21, 2026** — Ignacio relayed the toll-free team's response. The team is NOT asking about EIN/BRN — the blocking issue is the **missing verbal consent script**. Exact feedback:

> "At this time, a script for the verbal consent process has not been provided. In order for verbal consent to be accepted, we need a detailed script or a simulated conversation that clearly shows how users are informed and how their consent is obtained. Without this information, we're unable to verify compliance."

Requirements:
1. **Exact language used to obtain verbal consent** — verbatim IVR script
2. **Clear opt-out instructions** — how callers are told to stop messages

**Root cause analysis:** TFV form had opt-in type set to "Verbal" + opt-in proof URL pointed to `consent.html#opt-in-flow`. But that page described the flow in prose ("functionally equivalent to a verbal IVR") rather than verbatim script. The voice webhook also played NO verbal disclosure — it just forwarded the call silently. Concept of verbal opt-in existed; actual implementation did not.

**Pre-clearance reply sent to Ignacio June 21** from `hello@welcomematdigital.com`:
- Provided full verbatim verbal IVR script
- Asked him to confirm (1) script is acceptable to toll-free team, (2) any other items outstanding before resubmit

**Ignacio's June 22 feedback** (1:14 PM PDT):
1. **Business name must be explicit** — not a placeholder. Should show `"{Business Name}"` to clarify dynamic substitution (e.g., "Thank you for calling Acme Plumbing").
2. **Script must specify message type AND frequency** — original script only said "we will send a text message to follow up" without WHAT kind or HOW MANY. Needed explicit type (callback responses, appointment reminders) + explicit frequency (up to 7 per missed call).

**Final verbal disclosure script (approved by Ignacio June 22):**
```
"Thank you for calling {Business Name}. If we miss your call, we will send you a text to follow up. You may receive up to 7 messages regarding your missed call — including responses to your questions and appointment reminders. Message and data rates may apply. Reply STOP at any time to stop all messages."
```

Includes all required elements:
- Dynamic business name substitution
- Kind of messages (callback responses, appointment reminders)
- Frequency (up to 7 per missed call)
- Msg&data rates disclosure
- STOP opt-out mechanism

**Code deployment June 22** (swoop commit `a4df90c`, PUSHED to main, live at welcomematdigital.com/swoop):

1. **`server/routes/webhooks.js`** — Added `twiml.say()` verbal disclosure before call forwarding:
   ```javascript
   const businessName = business ? business.name : 'this business';
   // Verbal consent disclosure — plays on every inbound call for toll-free verification compliance.
   twiml.say(`Thank you for calling ${businessName}. If we miss your call, we will send you a text to follow up. You may receive up to 7 messages regarding your missed call — including responses to your questions and appointment reminders. Message and data rates may apply. Reply STOP at any time to stop all messages.`);
   if (business && business.forward_phone) {
     twiml.dial({ timeout: 20, action: '/webhooks/voice-dial-result' }, business.forward_phone);
   }
   ```
   Every caller hears the disclosure before the call is forwarded or ends.

2. **`public/consent.html` (`#opt-in-flow` section)** — Rewrote from prose to verbatim step-by-step IVR script:
   - Step 1: Customer dials published business phone number
   - Step 2: IVR speaks verbatim disclosure (with business name dynamically substituted)
   - Step 3: Call missed / IVR hangs up
   - Step 4: SMS auto-reply sent
   - Step 5: Customer receives message
   - Step 6: Customer replies to question
   - Step 7: Opt-out flow (STOP/HELP keywords)
   - Last updated: June 21 (footer updated June 22)

3. **TFV form resubmitted June 22** via Twilio Console → Phone Numbers → Regulatory Compliance → TFV:
   - All fields matched Round 3 + new verbal disclosure live in both webhook and documentation
   - Notification Email auto-reverted to `sunil1308@gmail.com` on page advance (Lesson #4 continues); corrected on final page + visually verified before Submit
   - Confirmation page: "Thanks for submitting your toll-free registration! Your toll-free registration is being reviewed."

4. **Reply email sent to Ignacio** (June 22 EOD) from `hello@welcomematdigital.com`:
   - Confirmed code deployed and live at welcomematdigital.com/swoop
   - Referenced updated consent.html URL with verbatim script
   - Attached screenshot of final form page showing corrected Notification Email
   - Pre-emptively noted Email field auto-revert as a recurring form-side bug (now documented 4+ times)
   - Added footnote for Twilio escalation: if TFV rejects on same field errors, it may indicate form engineering issue needing escalation
   - Thanked Ignacio for pre-clearance approach — saved from another blind rejection cycle

**June 23 follow-up — consent record storage strengthened:**
- `server/db/database.js` now stores explicit consent metadata on each lead (`consent_method`, `consent_source`, `consent_recorded_at`, `consent_script_version`, `consent_notes`)
- `server/services/leads.js` now persists the verbal IVR consent record whenever a missed call is logged, alongside the outbound confirmation SMS body/Twilio SID
- `public/consent.html` now documents exactly what is recorded and stored so Twilio reviewers can verify the proof trail end-to-end
- `scripts/tfv-api-resubmit.js` + `config/tfv-submission.json` now provide an API-based resubmission path that avoids the Console UI bugs

**Status as of June 22 EOD:**
- ✅ Hard deadline (7-day prioritized window): **MET** — form resubmitted by EOD
- ✅ Code deployed and live
- ✅ Email sent to Ignacio with form screenshot
- ⏳ Expected toll-free team SLA: 1–3 business days for approval
- 📅 India trip: June 25 departure (hard stop)
- 🔵 Fallback: A2P 10DLC brand vetting continues in parallel (production always on 10DLC)

**If rejected again:**
- Reply to Ignacio immediately with error details
- Request escalation to Messaging Compliance API path as alternative
- Reference form-field bugs (Email revert, EIN dash strip) as potential form engineering issue

> **🎯 LESSON: "Verbal opt-in" on a TFV form requires BOTH documentation (a verbatim IVR script in the consent page) AND production implementation (actual TwiML `<Say>` on the voice call). "Functionally equivalent" or "we do this in code" is insufficient. Reviewers read the script, listen to the call, and cross-check them.**

> **🎯 LESSON: The dash-strip issue consumed 2 rejection cycles before the real blocker (missing verbal script) was revealed. Root cause was not broker-sync, not form bugs, but missing implementation. When rejection feedback is vague (just a code), escalate quickly to ask for clarification — don't waste cycles hypothesizing. Ignacio's June 21 email saved us from another blind resubmit.**
### Phase 10 — Round 5 Rejection: Code 30511 (June 22 evening, 2026)

**June 22, 2026 ~8:49 PM PDT** — `trusthub-verify@twilio.com` rejected Round 4 (resubmitted June 22 EOD) with **NEW error code `30511`** — "Verbal Consent Script Must Be Provided for Approval". 

**Key difference:** This is a DIFFERENT rejection code than Rounds 1–3 (was 30527 "BRN Invalid"). **Progress indicator:** We cleared the BRN/EIN/broker-sync blocker. But the verbal script submission format is still not acceptable.

**Help doc indicates five possible solutions:**
1. Submit a detailed script showing exact language used for obtaining verbal consent ✅ (we have: consent.html#opt-in-flow verbatim IVR)
2. Include a simulated conversation demonstrating how users are informed and consent is collected ✅ (we have: step-by-step dialogue)
3. **Provide documentation of how verbal consent is recorded and stored** ❓ (unclear what format — email? PDF? inline in form?)
4. Include instructions for how users can opt-out after providing verbal consent ✅ (we have: STOP/HELP)
5. Consider implementing a confirmation text message after verbal opt-in ❓ (we don't have this — could add)

**The real issue:** Help doc lists five possible solutions but **doesn't specify which one is the actual requirement or in what format**. The Twilio rejection email mentions two paths: (1) edit via **Messaging Compliance API**, or (2) edit via Console and resubmit. The API is explicitly offered as an option.

**Pre-clearance email planned:** Send clarifying question to Ignacio on ticket `27236005` asking:
- Which of the five solutions is actually required?
- What format does "documentation of how we record/store consent calls" need to be (email attachment? PDF? inline?)
- Should we use the Messaging Compliance API instead of the Console (which has proven unreliable)?

This is the **last pre-clearance ask before the next resubmit** — forcing prescriptive guidance instead of another guess-and-reject cycle.

> **🎯 NEW LESSON: Code 30511 (new from Rounds 1–4) indicates we cleared the entity/EIN blockers but the verbal script SUBMISSION FORMAT is wrong — not the content. The help doc lists 5 possible fixes but Twilio doesn't specify which one is actually required. This is the exact prescriptive-guidance gap identified earlier. Email escalation to ask "which format?" before next resubmit.**

> **🎯 NEW LESSON: The Messaging Compliance API is explicitly offered as an alternative to the Console form in the rejection email. Given the Console form's persistent bugs (dash strip, email revert), the API path may be the faster route — it bypasses the form entirely and lets you POST/PATCH fields as JSON without the UI's input sanitizers.**




## The Exact Twilio "Magic Phrase"

Verbatim, the language Twilio TFV reviewers look for somewhere in your privacy policy:

> **"No mobile information will be shared with third parties or affiliates for marketing or promotional purposes."**

This sentence (or a substantively identical one) MUST appear in the privacy page. As of the June 14 hardening, it appears three times on `welcomematdigital.com/swoop/privacy.html`.

If you ever rewrite the privacy page, do not remove this phrase. Even subtle paraphrasing that omits any of {"mobile information", "third parties OR affiliates", "marketing or promotional purposes"} can fail reviewer pattern-matching.

---

## Rejection Codes Encountered

| Code | Meaning | Hit on | Root cause | Fix that worked |
|---|---|---|---|---|
| `18602` | Business ID could not be verified | June 10 BP | Persona/broker lag on young EIN | Manual review email with D&B negative + OpenCorporates positive evidence package |
| `18606` | Email domain mismatch | June 10 BP | Notification Email = personal Gmail, not company domain | Reply to reviewer FROM company-domain email + plan to update Trust Hub Notification Email |
| `30527` | Business Registration Number Is Missing or Invalid | June 13 TFV (round 1) | EIN submitted without dash + same broker-sync lag | Resubmit with `42-2903620` (dashed) + Additional Info citing BP approval + manual review request |
| `30527` | Business Registration Number Is Missing or Invalid | June 15 TFV (round 2) | Three concrete issues (NOT broker-sync as initially suspected): (1) EIN/BRN proof not linked inline in TFV form, (2) Notification email reverted to gmail again via form-bug, (3) Sample message branded but not "complete" (missing frequency + Terms URL inline) | **Round 3 resubmitted June 16 PM** addressing all three with: Drive-hosted EIN URL in Additional Info, force-overridden notification email on final page with visual verify, Option A sample message hitting all 7 CTIA elements. Pending review. |
| `30527` | Business Registration Number Is Missing or Invalid | June 16 TFV (round 3) | **Console form silently strips the dash from the BRN field on save** — stored as `422903620` instead of `42-2903620`. ~4hr auto-rejection by Persona's pre-check, never reached a human reviewer. Was likely the true root cause of Rounds 1–2 as well. | **OVERRIDDEN** — June 21 toll-free team escalation revealed the real blocker was missing verbal script, not BRN. EIN dash-strip was a red herring. |
| (No code) | Missing verbal IVR consent script | June 21 TFV toll-free team escalation | "At this time, a script for the verbal consent process has not been provided." Opt-in type was set to Verbal but consent.html described flow in prose and voice webhook played no verbal disclosure. | **FIXED June 22:** `server/routes/webhooks.js` added `<Say>` TwiML with business name, message type/frequency, Msg&data, STOP; `public/consent.html` rewritten as verbatim step-by-step IVR script; form resubmitted with all three items (business name explicit + message types + frequency). |

---

## Consent / Privacy / Terms Page Evolution

### The journey
1. **Initial (pre-May 29):** Single `consent.html` at `sunilmsft.github.io/swoop/` containing consent + privacy + terms in one page. Wrong basis ("verbal consent during call"). Twilio reviewer would have flagged it eventually.
2. **v0.2.7 (May 29):** `public/consent.html` fully rewritten with correct legal basis (FCC prior express invitation + CTIA call-back exception). Mirrored to `frontdesk-ai/public/swoop/consent.html`. Named WelcomeMat Digital LLC.
3. **Holdco restructure (May 29 onwards):** Three separate pages at `welcomematdigital.com/swoop/`:
   - `consent.html` — opt-in flow + STOP/HELP behavior + recipient list
   - `privacy.html` — full privacy policy
   - `terms.html` — terms of service
4. **Opt-in section (June 5):** Added explicit `#opt-in-flow` anchor section to consent.html documenting opt-in as a single customer-initiated phone call, NOT bundled with any other agreement. Huvi-cleared.
5. **Privacy hardening (June 14):** Three coverage points of Twilio magic phrase added to privacy.html (callout, Section 5, new Section 6).

### Where consent / privacy / terms live RIGHT NOW

| URL Twilio sees | File in `frontdesk-ai` repo | File in `swoop` repo (this) |
|---|---|---|
| `welcomematdigital.com/swoop/consent.html` | `public/swoop/consent.html` | mirrored at `public/consent.html` (also served at `/consent`) |
| `welcomematdigital.com/swoop/privacy.html` | `public/swoop/privacy.html` | (not present — frontdesk-ai only) |
| `welcomematdigital.com/swoop/terms.html` | `public/swoop/terms.html` | (not present — frontdesk-ai only) |
| `welcomematdigital.com/swoop/` (landing) | `public/swoop/index.html` | (this repo has `landing.html` legacy) |

**Critical rule:** When you edit `public/consent.html` in this repo, you MUST also edit `frontdesk-ai/public/swoop/consent.html`. The Twilio reviewer fetches the frontdesk-ai version.

---

## GitHub Pages Migration Status

Originally (May 26 commit `1ce8cb1`) we created `sunilmsft.github.io/swoop/consent.html` as an always-on static URL because Render free tier cold-starts could cause Twilio reviewer fetches to time out. The page lived at the root of the swoop repo (which is why `consent.html`, `landing.html`, and `PLAYBOOK.html` exist at the repo root — they're served by GitHub Pages).

**Current state (June 2026):**
- GitHub Pages mirror still live at `sunilmsft.github.io/swoop/PLAYBOOK.html`
- Twilio bundles now point at `welcomematdigital.com/swoop/*` instead, because the frontdesk-ai Render app has its own warming
- The Pages URL is still useful as a backup compliance URL if welcomematdigital.com ever has DNS issues

**Watch item:** If we rename the `sunilmsft` GitHub username (e.g. to `welcomematdigital` or `sunilv`), the Pages URL changes. GitHub auto-301s old URLs, but Twilio bundles need explicit URL updates. **Don't rename mid-TFV review** — a 301 from `sunilmsft.github.io` could spook a reviewer mid-cycle.

---

## If This Round Is Rejected (TFV Round 3 Playbook)

Run these in order. Do NOT panic-resubmit.

### Step 1 — Read the rejection email carefully
Note the rejection code AND the reviewer's free-form notes. The numeric code is the official reason; the notes often hint at the actual sticking point.

### Step 2 — Match the code to a known cause
- **`30527` again?** → Almost certainly STILL broker-sync lag. Don't resubmit — instead, reply to the reviewer (Ignacio) on the existing ticket thread asking for **manual review citing the BP approval** (`BUf71fa573b0fd6173b0cc31daba2ba41b`). Re-attach the D&B negative + OpenCorporates positive lookups if they're older than 30 days. The BP approval is the trump card: if Trust Hub already verified the business, the TFV reviewer should be willing to bypass automated broker checks for the same entity.
- **`30447` (Sample Message issue)?** → Re-verify the sample message contains: branded sender ID, the purpose statement, Msg&data disclosure, STOP, HELP. The default template in `server/db/database.js` already does. Copy it verbatim.
- **`30454` (Opt-in URL inaccessible)?** → Hit `welcomematdigital.com/swoop/consent.html#opt-in-flow` in an incognito browser. Confirm it loads in <3s. Check Render dashboard for cold start. Check Cloudflare DNS for any changes.
- **`30505` (Use Case / Sample Message mismatch)?** → Verify Use Case = "Customer Care" + Volume = "100/mo" + Opt-in = "Verbal". The Volume number is sometimes scrutinized; consider justifying it in Additional Information.
- **Any new advisory note?** → Treat it like Ignacio's June 14 email — preemptively harden the linked URL before any next round.

### Step 3 — Don't resubmit immediately
There's a 7-day "prioritized resubmission" queue. Outside that window, the resubmission goes back to general queue (slower). But resubmitting the SAME content WITHIN that window with no fix is wasted; the reviewer will reject again. Make a real change first.

### Step 4 — Escalate via ticket reply, not form resubmit
The fastest path on a stuck TFV is to reply on Ignacio's existing ticket thread (`[Twilio] Re: toll-free verification request of +18337830902`, ticket `27236005`) FROM `hello@welcomematdigital.com` with:
- "Following up on rejection code XXXXX received on YYYY-MM-DD"
- Cross-reference BP approval bundle `BUf71fa573b0fd6173b0cc31daba2ba41b`
- One-paragraph explanation of why the code is incorrect for our case (with evidence)
- Request manual review

This is what unblocked BP on June 11. Same playbook works for TFV.

### Step 5 — If two manual reviews fail, switch path
If two manual TFV reviews fail (different reviewers), consider:
- Accepting that toll-free isn't worth the friction and **going 10DLC-only immediately** (production path anyway per June 13 decision)
- OR opening a paid Twilio support case with a dedicated CSM
- Plan B SMS providers evaluated: **Bandwidth.com** and **Telnyx** (both A2P 10DLC, often faster vetting; same compliance rails). Sent.dm and Sendblue were ruled out — see [05_DECISION_LOG.md](05_DECISION_LOG.md).

---

## Pre-Change Checklist (anytime you touch the compliance surface)

Before editing any of:
- `server/db/database.js` (default `auto_reply_message`)
- `server/services/leads.js` (STOP/HELP keyword handlers)
- `server/services/ai-agent.js` (anti-marketing rule in system prompt)
- `public/consent.html`
- `frontdesk-ai/public/swoop/consent.html`
- `frontdesk-ai/public/swoop/privacy.html`
- `frontdesk-ai/public/swoop/terms.html`

...do this:

- [ ] Re-read this document
- [ ] Check Twilio Trust Hub for any open review (don't change compliance pages mid-review)
- [ ] Confirm the change does not remove: branded sender ID, Msg&data disclosure, STOP keyword, HELP keyword, the magic phrase, the FCC/CTIA basis citation, the "not bundled" language in consent
- [ ] Run a Morgan persona review with the question "Could a reviewer use this change to flag the bundle?"
- [ ] Mirror any consent change to the frontdesk-ai sibling repo
- [ ] After deploy, hit all three URLs (`welcomematdigital.com/swoop/{consent,privacy,terms}.html`) in incognito to verify they render
- [ ] Document the change in a commit message that names the compliance angle ("privacy: add explicit no-share clause for SMS opt-in / mobile info per Twilio compliance guidance" is a good example — that's commit `5e3dc3c`)

---

## Compliance Behaviors Currently in Code

For a future engineer auditing what's actually enforced:

### `server/services/leads.js`
- `STOP_KEYWORDS = {stop, stopall, unsubscribe, cancel, end, quit}` → sets `sms_opt_out=1`, sends branded confirmation, cancels follow-ups
- `START_KEYWORDS = {start, unstop}` → clears opt-out
- `HELP_KEYWORDS = {help}` → branded help reply with privacy URL
- `handleMissedCall()` checks `lead.sms_opt_out` before sending auto-reply
- All four send paths (auto-reply, AI reply, follow-up, manual SMS) respect `sms_opt_out`

### `server/db/database.js`
- Default `auto_reply_message`: `Hi! This is {business_name} returning your missed call. Msg&data rates may apply, reply STOP to opt out or HELP for help. How can we help?`

### `server/services/ai-agent.js`
- System prompt contains anti-marketing rule: "Never sign up the customer for marketing, newsletters, or anything they didn't ask for. They consented to a service reply only."

---

## Future Maintenance Guidance

### Quarterly (every 3 months)
- Re-verify the magic phrase still appears in `frontdesk-ai/public/swoop/privacy.html` (in three places per June 14 hardening)
- Check Twilio Trust Hub for any flagged compliance issues on the bundle
- Verify Notification Email on Trust Hub matches the `hello@welcomematdigital.com` address (if changed)

### Annually (every 12 months)
- Re-read this document
- Verify Twilio still recognizes the bundle as approved
- Re-check applicable FCC/CTIA/TCPA language for any policy changes
- Rotate Twilio Auth Token + OpenAI API key

### When adding 10DLC (the next big milestone)
- Brand vetting: $4 + WelcomeMat Digital LLC + EIN + brand details
- Single shared campaign: "Missed-Call Response", $10/mo
- Submit with the same opt-in URL (`welcomematdigital.com/swoop/consent.html#opt-in-flow`)
- Same sample messages already proven for TFV — copy verbatim
- Expected vetting time: 1–2 weeks; manual review fallback same as TFV playbook

### When adding a new product (e.g. FrontDesk AI SMS, if ever)
- New product = new sample messages = potentially new use-case category on the bundle
- Likely needs a separate campaign under the same Brand
- Compliance pages need a new product-specific section, not a rewrite of consent.html

---

## TL;DR — The Lessons That Cost the Most

1. **Persona fails on young EINs.** Don't fight the wizard. Go to manual review with multi-source evidence (CP 575 + state filing + D&B negative + OpenCorporates positive).
2. **Reply to reviewers FROM your company-domain email.** Half of error code `18606` resolves itself just by doing this.
3. **The TFV Console form's BRN field strips the dash from a submitted EIN.** You can't win this in the UI — typing `42-2903620` or `422903620` both result in the form storing `422903620`. If Persona's automated KYB matches on the canonical dashed format, every TFV submission via the Console will auto-reject with code 30527. The only paths around it are (a) manual override by a Trust Hub reviewer against an already-approved BP, or (b) the Messaging Compliance API which may not have the same input sanitizer.
4. **Don't trust form prefill — split this lesson by field.** Page-1 contact "Email" field reverts to the Twilio console account email on every save (reproducible — 4 times observed). Page-3 "E-mail for notifications" is a DIFFERENT field and behaves variably round-to-round. Terms URL was observed dropping in Rounds 1–2 but held in Round 3, likely because Round 3 was done in a single uninterrupted session. EIN dash-stripping is now hypothesized to be the persistent BRN-field behavior (see Lesson #3 corrected).
5. **Advisory emails ≠ rejections, but treat them like rejections.** Harden the linked URLs preemptively. Cheap insurance.
6. **"Same rejection code" does NOT always mean "same root cause."** Rounds 1 + 2 both got `30527` and we assumed broker-sync lag. Round 3 reply from Ignacio reframed it as three concrete reviewer items. Then Round 3 got `30527` again at automated-check speed, reframing it AGAIN as the form's dash-strip bug. Always wait for the reviewer's written feedback, AND audit the form's saved state, before re-diagnosing.
7. **CTIA "branded AND complete" = 7 elements in the first message.** Brand + service description + frequency + Msg&data + STOP + HELP + Terms URL. Missing any one = rejection. Option A template in `database.js` is the proven-passing format.
8. **When the reviewer gives you a numbered list, execute it literally and reply with a 1:1 mapping.** Don't restate it in your own words, don't add context they didn't ask for. Each of their items → exactly one of your bullets in the reply email.
9. **A ~4-hour rejection turnaround = automated Persona rejection, NOT human review.** Human reviewers take 2–7 business days. Same-business-day rejection with no reviewer notes means Persona's pre-check failed; the next move is escalation via the reviewer's email thread, NOT another form resubmit (which will auto-reject again on the same UI bug).
10. **Pre-submit screenshots can't prove what the form actually saved.** They only prove what you typed. To diagnose form-bugs, reopen the form AFTER rejection with look-don't-save discipline (no Next, no Submit) and screenshot each page — those are ground truth.
