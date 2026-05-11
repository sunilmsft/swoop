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

## 🔵 By Design (Consciously Deferred)

_Items the Squad flagged that we've decided NOT to address now, with rationale._

| Item | Who flagged | Rationale | Revisit when? |
|------|-------------|-----------|---------------|
| Push notifications / mobile app | Jordan | Web-first, no app store overhead for a solo founder | After 10+ paying customers |
| "Test your setup" flow | Priya | Manual onboarding is fine at <10 customers. Build when it saves more time than it costs. | v0.4 onboarding wizard |
| Analytics dashboard | Jordan | Premature — need real data from real customers first | After 30-day usage data exists |
| Add Business form has 15+ fields | Ray | Advanced fields are optional. Could hide behind "Advanced" toggle but not blocking. | If onboarding drop-off is measured |
