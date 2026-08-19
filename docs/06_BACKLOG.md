# 06 — Backlog (Snapshot, August 19 2026)

> **Source of truth is [`BACKLOG.md`](../BACKLOG.md)** at the repo root. This file is a curated snapshot for preservation purposes — if there's any conflict, the root file wins.
>
> **Priority labels:** 🔴 Blocker (can't ship without it) | 🟡 High (should do before first customer) | 🟢 Nice (improves product but not urgent) | 🔵 By Design (consciously deferred)

---

## Open — Blockers Before First Paying Customer

### 🔴 Production forwarded-call mode
- Status: Direct demo call verified August 19, but the customer-facing carrier-forwarding flow is not implemented.
- Required behavior: customer business number rings normally; on no-answer, carrier forwards to Twilio; Twilio sends one SMS and ends the call without dialing the owner again or repeating the demo disclosure.
- Acceptance test: exactly one SMS, one call event, no second owner ring, and no generic Twilio application-error message.

### 🔴 Per-business auth on dashboard and admin
- Today: `swoop-x79g.onrender.com` and `/admin` are publicly reachable; anyone with the URL sees ALL leads
- Minimum acceptable: magic-link to owner's phone or email, scope all `/api/leads/*` and `/api/businesses/*` queries to the authenticated business
- Squad: Priya 👎, Morgan 👎

### 🔴 Automated compliance tests for STOP / START / HELP
- Morgan: "Trust controls must be provable, not just implemented"
- Cover: manual SMS path, follow-up path, AI reply path, review-request path — all must respect `sms_opt_out`
- Tooling: pick `node:test` (no dep) or `vitest`; small, no framework

### 🔴 A2P 10DLC brand + campaign registration
- Approx $4 brand vetting + ~$10/mo campaign
- Single shared "missed-call response" campaign — every new customer's local number attaches automatically
- Decided June 13 as the production path; toll-free stays demo-only

### 🟡 Toll-free caller reputation
- A tester's device classified `(833) 783-0902` as possible fraud and disconnected the call.
- Submit caller-ID reputation correction requests, but keep this number internal/demo-only and use local numbers for production.

### 🔴 Local-number provisioning per customer
- Wire into `admin.html` "Add Business" flow: buy Twilio number in customer's area code → attach to 10DLC campaign → set webhooks → write to DB

---

## Open — High (🟡)

### Owner Dashboard — Settings Panel
- 🟡 Inline editing: name, services, pricing, hours, service area (today: SQL only after creation)
- 🟡 AI toggle on/off, edit tone, max turns, FAQs, never-say from dashboard
- 🟡 Owner SMS alert when a lead hits `needs_attention`
- 🟡 "Opted out" chip + list filter — Priya: "I need to see compliance state before I click in"

### Messaging Infrastructure
- 🟡 **Update Notification Email in Twilio Trust Hub** from `sunil1308@gmail.com` → `hello@welcomematdigital.com` (not blocking, but consistency hygiene to avoid future "domain mismatch" flags)
- 🟡 **A2P 10DLC brand + campaign registration** (also in Blockers above)
- 🟡 **Local number provisioning per customer** (also in Blockers above)

### Go-to-Market
- 🟡 Founding 5 cohort — "First 5 free for 30 days, $19/mo lifetime if they stay" — NextDoor + local FB trade groups. Cap at 5 concurrent onboardings.
- 🟡 Marketing copy guardrails (Morgan): all outbound pitch posts must say "we text people who already called you" — never "we'll text your customers". Avoid Twilio flags and NextDoor spam reports.

### Insights (v0.4+)
- 🟡 ROI dashboard: "Swoop captured X leads worth ~$Y this month" — Jordan
- 🟡 Speed to Lead (instant SMS to web form fills) — Avoca-inspired
- 🟡 Per-industry landing pages ("Swoop for Plumbers", "Swoop for HVAC")
- 🟡 Agency/reseller partnership program — GoHighLevel model

### Operations
- 🟡 Gmail POP3 deprecation watch — backup plan: Zoho mobile app, or upgrade to Google Workspace ($6/mo) if/when cutoff hits

### Twilio follow-ups (low-effort polish)
- 🟢 Send thank-you to Jennifer (Twilio reviewer for BP approval) — optional but builds goodwill for future 10DLC work

---

## Open — Nice (🟢)

### Dashboard
- 🟢 Search/filter leads (by status, phone, name)
- 🟢 Pagination for leads list (currently capped at 50)
- 🟢 Per-business `auto_reply_message` validator — warn when owner-edited template loses branded ID / STOP / HELP / Msg&data

### Test Console
- 🟢 Editable scenario steps — let user edit each step's customer message before running
- 🟢 Replay-from-real-lead mode — pick existing lead, feed inbound back through new prompt versions

### Messages
- 🟢 Customizable voice greeting per business (seasonal, peak hours)
- 🟢 Customize follow-up message templates per business
- 🟢 Configurable follow-up timing (today: hardcoded 1/3/7 days)

### Notifications & Coverage (v0.3.5)
- 🟢 Owner SMS/email alerts on AI handoff
- 🟢 Backup person redirect (delegation)
- 🟢 Quiet hours / do-not-disturb mode

### Provisioning Service (Phased)
- 🟢 Admin-guided provisioning wizard in `/admin` (Twilio setup → business record → owner setup → verify)
- 🟢 Auto-provision Twilio number via API
- 🟢 Pre-fill business record from intake form/questionnaire
- 🟢 Auto-detect owner's carrier + generate forwarding code
- 🟢 Built-in test call verification step

### Insights Dashboard
- 🟢 Leads this week/month trend
- 🟢 Conversion rate (leads → converted)
- 🟢 Response time (how fast AI responded)
- 🟢 Missed calls by time of day

### Team & Roles
- 🟢 Add a second person (employee/partner)
- 🟢 Role-based access: can reply vs. view-only
- 🟢 Lead routing by zip code (multi-truck businesses)

### Advanced AI
- 🟢 Smart lead scoring (sentiment, response speed)
- 🟢 AI-generated follow-up messages tailored to the inquiry
- 🟢 Appointment booking via text (calendar integration)
- 🟢 Conditional call forwarding mode
- 🟢 AI voice agent (answer the call)

### Operations & Hygiene
- 🟢 Automated tests beyond compliance (unit + integration)
- 🟢 CI/CD pipeline (GitHub Actions)
- 🟢 Error monitoring (Sentry)
- 🟢 Structured JSON logs
- 🟢 Database backups strategy
- 🟢 Voice webhook URL refresh — point to welcomematdigital.com instead of `swoop-x79g.onrender.com` for consistency
- 🟢 Update subscription tracker — add Zoho Mail Lite ($12/yr), Mercury (free), WelcomeMat Digital LLC entity

### Admin Console (v0.5)
- 🟢 Onboarding funnel (signed up → configured → first lead → converted)
- 🟢 System health (Twilio errors, OpenAI failures, webhook latency)
- 🟢 Revenue tracking (when billing exists)
- 🟢 Broadcast announcement to all business owners

### Billing (v0.5 — Stripe)
- 🟢 Self-service plan selection ($29/$59/$99)
- 🟢 Usage tracking (text-backs/month)
- 🟢 Upgrade/downgrade from settings
- 🟢 14-day free trial flow

### Integrations
- 🟢 Google Calendar for appointment scheduling
- 🟢 Zapier/webhook triggers for CRM integrations
- 🟢 White-label support (custom branding per business)
- 🟢 ServiceTitan / Housecall Pro CRM sync

### Growth
- 🟢 Landing page / marketing site
- 🟢 Multi-number support (one business, multiple Twilio numbers)
- 🟢 Voicemail transcription

### Competitor-inspired (v0.5+)
- 🟢 "AI Employee" persona naming/branding — Podium framing
- 🟢 Conversation quality scoring (Avoca Coach lite)
- 🟢 Google review response automation (Podium does beyond requesting)

### Capture customer stories
- 🟢 Lightweight intake after week 2 of each founding cohort customer: missed calls recovered, jobs booked, revenue attributed

### Competitive watch
- 🟢 Handraiser.ai (GoHighLevel reseller bundle at $297/$497) — revisit during pricing milestone

---

## 🔵 By Design — Consciously Deferred

| Item | Who flagged | Rationale | Revisit when |
|---|---|---|---|
| Push notifications / mobile app | Jordan | Web-first works; no app store overhead for solo founder | After 10+ paying customers |
| "Test your setup" flow | Priya | Manual onboarding is fine at <10 customers | v0.4 wizard |
| Analytics dashboard | Jordan | Premature without real data | After 30-day usage data exists |
| Add Business form has 15+ fields | Ray | Advanced fields are optional; could hide behind "Advanced" toggle but not blocking | If onboarding drop-off is measured |
| AI voice agent (answer the actual call) | — | Avoca/Broccoli territory — only if market demands | When customer asks twice |

---

## Travel & Calendar Reminders

- **June 25, 2026** — India trip departs (TFV decision may land while away)
- **May 29, 2027** — Zoho Mail Lite renewal ($12)
- **May 30, 2027** — WA Business License renewal warning
- **June 1, 2027** — WA Annual Report 30-day warning
- **June 30, 2027** — 🔴 **HARD WA Annual Report deadline (~$70)**

---

## Service Stack & Costs (snapshot)

| Service | Tier | Monthly | Upgrade Trigger | Paid Cost |
|---|---|---|---|---|
| Render | Free | $0 | First paying customer | $7/mo + $0.25/GB disk |
| Twilio | Pay-as-you-go | ~$2/number | Already paid | $2/number + $0.0085/SMS + $0.014/min |
| OpenAI | $5 prepaid | ~$1–2 | Top up when low | $1–5/mo (gpt-4o-mini) |
| GitHub | Free | $0 | Never | $0 |
| Domain | welcomematdigital.com | ~$1 | — | ~$12/yr |
| Zoho Mail Lite | Paid | $1 | — | $12/yr |
| Stripe | Not set up | $0 | When billing launches (v0.5) | 2.9% + $0.30/txn |

**Est. total at launch (1–5 customers): ~$15–20/mo. Break-even: 1 customer at $29.**
