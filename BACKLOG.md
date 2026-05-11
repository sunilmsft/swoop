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

## 🔜 Next Up (v0.3) — Self-Service & Deployment

### Deploy to Production
- [ ] Deploy to Render (render.yaml ready)
- [ ] Set environment variables on Render
- [ ] Update Twilio webhooks to Render URL
- [ ] Complete Twilio toll-free SMS verification

### Self-Service Business Dashboard
- [ ] Per-business auth (magic link or phone + code)
- [ ] Business owner dashboard (filtered to their leads only)
- [ ] Inline editing: services, FAQs, pricing, hours
- [ ] Toggle AI on/off from dashboard
- [ ] Send manual SMS from dashboard (owner replies to leads)
- [ ] Onboarding wizard (3-step guided setup)

### Security & Auth
- [ ] Add basic auth or API key to dashboard/API (currently wide open)
- [ ] Rate limiting on webhook and API endpoints
- [ ] Sanitize/validate phone number format (E.164)

### Dashboard Improvements
- [ ] Wire logo into dashboard header
- [ ] Business selector (currently shows all leads mixed)
- [ ] Search/filter leads (by status, phone, name)
- [ ] Pagination for leads list (currently capped at 50)
- [ ] Mobile-responsive polish

### Messaging
- [ ] Customize follow-up message templates per business
- [ ] Configurable follow-up timing (not hardcoded 1/3/7 days)
- [ ] Message delivery status tracking (Twilio status callbacks)

---

## 📋 Future (v0.4+)

### AI Features (Advanced)
- [ ] Smart lead scoring (based on message sentiment, response speed)
- [ ] AI-generated follow-up messages tailored to the lead's inquiry
- [ ] Appointment booking via text (integrate with calendar)
- [ ] Conditional call forwarding mode (carrier forwards missed calls directly)
- [ ] AI voice agent (answer the actual call)

### Integrations
- [ ] Google Calendar integration for appointment scheduling
- [ ] Zapier/webhook triggers for CRM integrations
- [ ] Stripe billing for SaaS pricing ($29/$49/mo tiers)
- [ ] White-label support (custom branding per business)
- [ ] ServiceTitan / Housecall Pro CRM sync

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
