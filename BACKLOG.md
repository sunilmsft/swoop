# Swoop — Backlog

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
- [x] 🟡 **Zoho Mail setup for hello@ + privacy@welcomematdigital.com** ✅ Done June 1 — Zoho Mail Lite ($12/yr), both addresses live, all DNS records (MX/SPF/DKIM/DMARC) in Cloudflare, inbound+outbound verified to Gmail Inbox.
- [x] 🟡 **WA LLC approved** ✅ Done June 1 — UBI 606238837, Cert of Formation PDF saved.
- [x] 🟡 **EIN issued** ✅ Done June 1 — EIN 42-2903620, CP 575 PDF saved to OneDrive/WelcomeMat Digital/.
- [x] 🟡 **Twilio account upgraded** ✅ Done June 1 — Trial → Paid ($20 starting balance, $10→$50 auto-recharge), Business use / Direct Customer / Technology / LLC profile submitted.
- [ ] 🟡 **Twilio Compliance Profile in manual review** ⏳ ~2 business days (EIN sync lag triggered manual review path; status email to hello@welcomematdigital.com).
- [ ] 🟡 **WA Business License** ⏳ Blocked on SOS→DOR sync (~2 business days). Retry at business.wa.gov Wed June 3 morning. $90.
- [ ] 🟡 **Twilio TFV resubmission to reviewer Ignacio** — waits on Compliance Profile approval. Updated URLs: `/swoop`, `/swoop/privacy.html`, `/swoop/terms.html`, `/swoop/consent.html` on welcomematdigital.com. Include EIN 42-2903620 + LLC name + hello@ contact.
- [ ] 🟡 **Open Mercury business bank account** — has all needed docs (EIN PDF + WA Cert of Formation). 15 min online.
- [ ] 🟢 **Per-business `auto_reply_message` validator** — when an owner edits the template in `admin.html`, warn if it's missing branded ID, STOP/HELP, or Msg&data disclosure. Today's compliance only holds if the default isn't overwritten with something non-compliant. — _Morgan: "Defaults drift. Validate at the boundary."_ (~30 min build)
- [ ] 🟢 **Existing demo/seed businesses re-seeded with new template** — confirm Mike's Plumbing + Sara's Electric records in any persisted Render DB still use the new template (seed only runs on empty DB).
- [ ] 🟢 **Re-verify Zoho DKIM** in mailadmin.zoho.com (should be green by June 2 — public DNS already verified via MxToolbox, only Zoho's verifier is lagging).
- [ ] 🟢 **Update subscription tracker** — add Zoho Mail Lite ($12/yr, renews 05/29/27) and WelcomeMat Digital LLC entity (UBI 606238837, annual report ~$70 due 06/30/2027).
- [ ] 🟢 **Calendar reminders** — May 29 2027 (Zoho renewal), June 1 2027 (30-day Annual Report warning), **June 30 2027 (HARD deadline WA Annual Report)**.

---

## ✅ Done (June 1, 2026) — Launch Identity Day
- [x] 🔴 **WA LLC approved** in 3 days (vs 2-7 day estimate). UBI 606238837, effective 06/01/2026.
- [x] 🔴 **Federal EIN issued** — 42-2903620. CP 575 PDF saved to OneDrive/WelcomeMat Digital/.
- [x] 🔴 **Zoho Mail Lite live** — hello@ + privacy@welcomematdigital.com, full DNS stack (10 records) in Cloudflare, send+receive verified.
- [x] 🔴 **Twilio account upgraded** — Trial → Paid, business profile (LLC + EIN) submitted, $20 starting balance + auto-recharge.
- [x] 🟡 **6 frontdesk-ai commits pushed** and live at welcomematdigital.com — consent.html mirrored to /swoop/, topnav + footer links, hero copy polish, homepage hero widened to 1080/920px, "branded text" Step 2 rewrite, 30-day free trial line on /swoop and homepage, headache card retitled.
- [x] 🟡 **All Swoop TFV compliance code pushed** (swoop @ 8f3c7c9) — branded SMS template, STOP/HELP, Msg&data disclosure, HELP→privacy URL, AI anti-marketing rule, consent.html FCC+CTIA rewrite.
- [x] 🟢 **Identity Snapshot HTML** saved to `C:\Users\sunilve\OneDrive\WelcomeMat Digital\Identity-Snapshot-June-2026.html` for future reference.

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
- [x] 🟢 Local test mode: `TWILIO_MOCK_MODE` to simulate SMS flows while toll-free approval is pending
- [ ] 🟡 Complete Twilio toll-free SMS verification (submitted, pending approval)
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
> - **Toll-free `+18337830902` (TFV in progress with Twilio, contact: Ignacio)** → Swoop's permanent **sandbox / demo / internal test line**. Single number, owned by us, used for our own dev + showing the product to prospects. Cheap (~$2/mo). TFV is the verification path.
> - **Local 10DLC numbers (one per paying customer)** → the **production** path. Each customer gets their own local number in their area code (a plumber in Sammamish needs a 425 number, not an 833). Rides on Swoop's shared A2P 10DLC Brand + Campaign — register the brand/campaign once, every new customer's number gets attached automatically. This is what real customers will text from.
>
> **Why both:** TFV is needed before we can do realistic end-to-end testing on a real number. 10DLC is needed before customer #1 goes live. Foundation work (LLC, EIN, branded opt-in, welcomematdigital.com showing Swoop as a real product) is identical for both — do it once, satisfies both regimes.
>
> **Sequencing:** finish TFV first (already 80% done, warm contact at Twilio) → use it to test the full flow → register 10DLC Brand + Campaign when first customer signs up.

- [ ] 🟢 Message delivery status tracking (Twilio status callbacks)
- [ ] 🟡 **A2P 10DLC brand + campaign registration for Swoop** — register Swoop as the brand and one "missed-call response" campaign. Once approved, every new customer's local number gets assigned to this shared campaign — no per-customer paperwork wait. Unblocks fast onboarding for real customers. (~$4 brand vetting + ~$10/mo campaign.)
- [ ] 🟢 **Local number provisioning per customer** — once 10DLC approved, buy local Twilio number in customer's area code on signup. Keep current toll-free as permanent test/demo line.
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
