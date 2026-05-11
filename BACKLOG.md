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

## 🔜 Next Up (v0.2)

### Security & Auth
- [ ] Add basic auth or API key to dashboard/API (currently wide open)
- [ ] Rate limiting on webhook and API endpoints
- [ ] CSRF protection on dashboard forms
- [ ] Sanitize/validate phone number format (E.164)

### Multi-Tenant
- [ ] Business selector in dashboard (currently shows all leads mixed)
- [ ] Scope API endpoints to a business (query param or auth)
- [ ] Per-business settings page in dashboard

### Dashboard Improvements
- [ ] Auto-refresh indicator / last-updated timestamp
- [ ] Search/filter leads (by status, phone, name)
- [ ] Pagination for leads list (currently capped at 50)
- [ ] Date range filter for stats
- [ ] Mobile-responsive polish

### Messaging
- [ ] Send manual SMS from dashboard (two-way conversation)
- [ ] Customize follow-up message templates per business
- [ ] Configurable follow-up timing (not hardcoded 1/3/7 days)
- [ ] Message delivery status tracking (Twilio status callbacks for SMS)

---

## 🤖 Next Priority (v0.2.5) — AI Reply Agent

### Business Knowledge Base (Grounding)
- [ ] Business profile schema: name, owner, description, services, pricing, hours, service area
- [ ] Tone/personality settings: friendly, professional, casual
- [ ] FAQ entries per business (e.g., "Do you offer free estimates?" → "Yes!")
- [ ] Rules/guardrails: things to never say, topics to redirect
- [ ] Onboarding form in dashboard to collect business profile
- [ ] System prompt builder: auto-generate LLM prompt from business profile

### AI Conversational Agent
- [ ] LLM integration (OpenAI / Azure OpenAI) for two-way SMS conversations
- [ ] 3-4 turn budget per lead before graceful handoff
- [ ] Turn 1: Warm greeting + "What do you need help with?"
- [ ] Turn 2: Acknowledge need, ask qualifying question (location, timeline, scope)
- [ ] Turn 3: Confirm details, set expectation for business owner callback
- [ ] Context-aware: uses business profile, hours, services to answer questions

### Graceful Handoff
- [ ] After turn limit: send handoff message with callback timeframe
- [ ] Configurable timeframe per business: during hours / after hours / emergency
- [ ] Lead status changes to "Needs Attention" on dashboard
- [ ] Business owner notification with conversation summary
- [ ] Customer hears: "Mike will personally reach out within [X hours]"
- [ ] Business owner can take over the conversation at any point

### Conditional Call Forwarding Mode
- [ ] Simpler webhook path: carrier forwards missed calls → Swoop handles directly
- [ ] No <Dial> needed — call is already missed when it reaches Swoop
- [ ] Immediate text-back (faster than current forwarding flow)
- [ ] Onboarding wizard: detect carrier, show exact forwarding code to dial

---

## 📋 Future (v0.3+)

### AI Features (Advanced)
- [ ] Smart lead scoring (based on message sentiment, response speed)
- [ ] AI-generated follow-up messages tailored to the lead's inquiry
- [ ] Appointment booking via text (integrate with calendar)

### Integrations
- [ ] Google Calendar integration for appointment scheduling
- [ ] Zapier/webhook triggers for CRM integrations
- [ ] Stripe billing for SaaS pricing ($79/$149/mo tiers)
- [ ] White-label support (custom branding per business)

### Operations
- [ ] Automated tests (unit + integration)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Error monitoring (Sentry or similar)
- [ ] Logging improvements (structured JSON logs)
- [ ] Database backups strategy
- [ ] Analytics: conversion funnel, response time metrics

### Growth
- [ ] Landing page / marketing site
- [ ] Onboarding wizard (guided Twilio setup)
- [ ] Email notifications to business owner on new leads
- [ ] Multi-number support (one business, multiple Twilio numbers)
- [ ] Voicemail transcription
