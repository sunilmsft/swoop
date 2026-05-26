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

## 🔜 Next Up (v0.3) — Auth, Settings & Deploy

> **Priority labels:** 🔴 Blocker — can't ship without it | 🟡 High — should do before first customer | 🟢 Nice — improves product but not urgent | 🔵 By Design — consciously deferred

### Deploy to Production
- [x] 🟡 Deploy to Render (render.yaml ready)
- [x] 🟡 Set environment variables on Render
- [x] 🟡 Update Twilio webhooks to Render URL
- [ ] 🟡 Complete Twilio toll-free SMS verification (submitted, pending approval)
- [ ] 🟡 Switch Twilio consent/terms URL to always-on GitHub Pages page (`/consent.html`) to avoid Render cold-start validation failures

### Security & Auth (🔴 Blocker — Squad Review May 11)
- [ ] 🔴 Per-business auth (magic link or phone + code) — _Priya: "Anyone with the URL sees ALL businesses' leads"_
- [ ] 🔴 Business owner dashboard filtered to their leads only
- [ ] 🟡 Rate limiting on webhook and API endpoints
- [ ] 🟡 Sanitize/validate phone number format (E.164)

### Owner Dashboard — Leads
- [x] 🟡 Send manual SMS from dashboard — _Jordan: "After AI hands off, owner can't reply through Swoop"_
- [x] 🟡 Mobile-responsive polish — _Ray: "I'm on my phone. Always."_
- [ ] 🟢 Search/filter leads (by status, phone, name)
- [ ] 🟢 Pagination for leads list (currently capped at 50)
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
- [ ] 🟢 Message delivery status tracking (Twilio status callbacks)

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
