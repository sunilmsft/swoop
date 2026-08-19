# 04 — Architecture

## High-Level Picture

```
   Customer phone                                            Owner phone/laptop
        │                                                          │
        │ (1) dials business                                       │ (8) opens dashboard
        ▼                                                          ▼
   ┌─────────────┐         ┌────────────────────────┐      ┌──────────────────┐
   │   Twilio    │ ──(2)── │   Render (Node/Express)│ ◄──► │   public/*.html  │
   │  +1 (833)…  │  voice  │   server/index.js      │      │   (single file)  │
   │             │   SMS   │                        │      └──────────────────┘
   │             │ ◄──(6)──│   • /webhooks/*        │
   └─────────────┘  reply  │   • /api/*             │
                           │   • /api/test/simulate │
                           │                        │
                           │   ┌────────────────┐   │
                           │   │ services/      │   │
                           │   │  ai-agent.js   │──(4)──► OpenAI gpt-4o-mini
                           │   │  leads.js      │   │
                           │   │  twilio.js     │   │
                           │   └────────────────┘   │
                           │                        │
                           │   ┌────────────────┐   │
                           │   │ better-sqlite3 │   │
                           │   │ /var/data/     │   │
                           │   │   swoop.db     │   │
                           │   └────────────────┘   │
                           │                        │
                           │   node-cron */15 min   │
                           │   processDueFollowUps  │
                           └────────────────────────┘
```

Numbers map to the flows below.

## Folder Layout

```
swoop/
├── .github/copilot-instructions.md    # Squad Review rules — read before any change
├── .env                                # LOCAL: Twilio + OpenAI secrets (gitignored)
├── .env.example                        # Template
├── render.yaml                         # Render service definition + env-var declarations
├── package.json                        # 6 runtime deps, no dev deps
│
├── server/
│   ├── index.js                        # Express bootstrap, route mounting, cron
│   ├── seed.js                         # Demo data: 2 businesses, 6 leads
│   ├── db/
│   │   └── database.js                 # SQLite schema + lightweight ALTER migrations
│   ├── routes/
│   │   ├── webhooks.js                 # Twilio: /voice /voice-status /voice-dial-result /sms
│   │   ├── api.js                      # Dashboard + admin REST
│   │   └── test.js                     # /api/test/simulate — scenario engine
│   └── services/
│       ├── twilio.js                   # sendSMS + request validation (mocked in dev)
│       ├── ai-agent.js                 # OpenAI client, system prompt builder, handoff logic
│       └── leads.js                    # handleMissedCall, handleInboundSMS, follow-up cron job
│
├── public/
│   ├── index.html                      # Owner dashboard (SPA, no framework)
│   ├── admin.html                      # Platform-operator console
│   ├── consent.html                    # SMS Consent & Opt-In Policy (mirrored to GitHub Pages)
│   └── images/                         # logo (currently text-based, no PNGs)
│
├── consent.html                        # Duplicate of public/consent.html for GitHub Pages serving
├── landing.html                        # Customer-facing pitch (used pre-LLC, now superseded by welcomematdigital.com)
├── PLAYBOOK.html                       # 11-tab single-file reference doc
├── OUTREACH_PLAYBOOK.html / .md        # GTM outreach templates + generator
├── BACKLOG.md                          # Live backlog (priority labels: 🔴🟡🟢🔵)
├── README.md                           # User-facing quick start
└── docs/                               # ← You are here. Preservation package.
```

## Component Detail

### 1. Twilio webhook flow

Twilio is configured (in console.twilio.com → Phone Numbers → +1 833-783-0902) to POST:

| URL | Triggered on |
|---|---|
| `/webhooks/voice` | Incoming call — returns TwiML with the compliance disclosure and currently rings the configured `forward_phone` |
| `/webhooks/voice-status` | Final status of that call (`no-answer`, `busy`, `failed`, `canceled`, `completed`) |
| `/webhooks/voice-dial-result` | After dial attempt completes — when status is `no-answer` or `busy`, triggers `handleMissedCall()` |
| `/webhooks/sms` | Any inbound SMS — runs STOP/HELP keyword check first, then routes to `handleInboundSMS()` |

All webhooks validate Twilio's signature in production (`server/services/twilio.js`). In `TWILIO_MOCK_MODE=true` validation is skipped and SMS sends are logged but not transmitted.

### 2. Missed-call → text-back

`server/services/leads.js → handleMissedCall(businessId, callerPhone)`:

1. Look up the business
2. Find existing lead for `(business_id, caller_phone)` or insert a new one
3. **If `lead.sms_opt_out`, return immediately** — do not send
4. Render `auto_reply_message` template with business name
5. `sendSMS()` → Twilio
6. Insert outbound row in `messages`
7. Schedule 3 follow-ups (day 1, day 3, day 7) via `scheduleFollowUps()`

### 3. Inbound SMS conversation

`server/services/leads.js → handleInboundSMS(businessId, callerPhone, body)`:

1. Look up lead
2. Run `getKeywordIntent(body)`:
   - `stop` → set `sms_opt_out=1`, set `opt_out_at`, send branded opt-out confirmation. **Cancel all pending follow-ups for this lead.**
   - `start` → clear opt-out, log re-consent
   - `help` → reply with branded help including privacy URL
3. Insert inbound message row
4. If AI is enabled, lead is not in handoff, and `ai_turn_count < max_ai_turns`:
   - Call `ai-agent.generateReply()` (OpenAI gpt-4o-mini)
   - Send reply via Twilio
   - Increment `ai_turn_count`
5. If turn limit reached: build handoff summary, set `lead_status='needs_attention'`, set `ai_handoff_done=1`, write summary into `lead.notes`

### 4. AI agent (`server/services/ai-agent.js`)

- Pulls business row → constructs a system prompt that includes name, owner, services, pricing, hours, service area, tone, FAQs, never-say list, max-turn budget, handoff phrasing
- Uses recent message history (last N inbound + outbound) as user/assistant turns
- **Anti-marketing rule** is hardcoded in the system prompt — non-negotiable for TFV compliance
- Also exposes `extractName(messages)` — pulls the customer's first name from the conversation so the handoff brief looks human
- Also exposes `buildHandoffSummary()` — short prose: what they need + urgency + recommended SLA

### 5. Follow-up cron

`server/index.js` schedules `*/15 * * * *` → `processDueFollowUps()`:

1. Query `follow_ups WHERE status='pending' AND scheduled_for <= now()`
2. For each, re-check: lead still wants follow-up? (No `sms_opt_out`, no inbound reply since scheduling)
3. If safe, send via Twilio, mark `status='sent'`. If not, mark `status='cancelled'`.
4. Cron is **disabled in `NODE_ENV=development`** so local dev with seed data doesn't constantly fire

### 6. Review request

`POST /api/leads/:id/review` → composes SMS with the business's Google review link → sends via Twilio.

### 7. Database

`server/db/database.js` opens SQLite at `process.env.DB_PATH || ./server/db/swoop.db`. WAL mode enabled. Tables auto-created on boot. Lightweight ALTER migrations run inline (`sms_opt_out`, `opt_out_at`, `is_test` columns added this way without a migration framework).

**Tables:**

- `businesses` — id, name, phone, owner_name, timezone, auto_reply_message, review_link, forward_phone, description, services, pricing, service_area, hours, emergency_policy, tone, faqs, never_say, max_ai_turns (default 3), handoff_minutes (default 120), handoff_after_hours_msg, ai_enabled (default 1), created_at
- `leads` — id, business_id (FK), caller_phone, caller_name, call_status, lead_status, ai_turn_count, ai_handoff_done, notes, sms_opt_out, opt_out_at, is_test, created_at, updated_at
- `messages` — id, lead_id (FK), direction (`inbound`/`outbound`), body, twilio_sid, is_test, sent_at
- `follow_ups` — id, lead_id (FK), scheduled_for, message_template, status (`pending`/`sent`/`cancelled`), sent_at, created_at

**Indexes:** `idx_leads_business`, `idx_leads_phone`, `idx_leads_is_test`, `idx_follow_ups_status`.

### 8. Dashboards

`public/index.html` and `public/admin.html` are **single-file vanilla JS apps**. No build step, no framework, no bundler. They call the REST API on the same origin. The choice is deliberate: zero deploy complexity, no framework upgrade churn, easy to read by AI.

### 9. Test Console

`POST /api/test/simulate` runs a named scenario by directly inserting `is_test=1` rows. The 6 built-in scenarios drive realistic SMS flows without actually hitting Twilio. Hidden in production unless `localStorage.swoop_dev_mode === 'true'` or URL has `?dev=1`.

## Deployment

`render.yaml` declares one web service:

- **Runtime:** node
- **Plan:** Starter ($7/month)
- **Build:** `npm install`
- **Start:** `npm run seed:businesses && npm start`
- **Disk:** name `swoop-data`, mounted at `/var/data`, 1 GB
- **Env vars:** `NODE_ENV=production`, `DB_PATH=/var/data/swoop.db`, `DEFAULT_FORWARD_PHONE=+14257867232`, then secret env vars injected from the Render dashboard

Auto-deploy on push to `master`. There is no CI — no `.github/workflows/` directory exists.

## External Dependencies (transitive failure map)

```
   welcomematdigital.com domain                  Cloudflare DNS
            │                                         │
            └────────────┬────────────────────────────┘
                         │
        ┌────────────────┼─────────────────────────────┐
        │                │                             │
        ▼                ▼                             ▼
   Zoho Mail        Render hosting                Twilio Trust Hub
   hello@           swoop-x79g.onrender.com       (Privacy/Terms URLs
   privacy@         + welcomematdigital.com        point here)
                    (separate Render app in
                     frontdesk-ai repo)
```

**Failure modes:**
- Lose Cloudflare → all three downstream services break (DNS gone)
- Lose Render → app dies but identity URLs (in `frontdesk-ai` app) still resolve
- Lose Zoho → can't receive Twilio support emails on `hello@` or `privacy@`
- Lose Twilio → no SMS; identity intact
- Lose OpenAI → AI replies fail but missed-call SMS + STOP/HELP still work (graceful degradation in `ai-agent.js`)

## Production forwarding design still needed

The current live test is the demo flow:

```text
Caller -> Twilio demo number -> disclosure -> owner cell rings -> missed-call SMS
```

For a real business, the intended flow is:

```text
Caller -> customer's business number -> business phone rings
                                  -> no answer -> carrier forwards to Twilio
                                  -> short response, SMS, and hangup
```

The production mode needs a per-business setting to distinguish direct demo calls from carrier-forwarded calls. Forwarded calls must not dial `forward_phone` again, and the voice response should not repeat a long disclosure after the caller has already experienced the business number's normal ringing. Twilio's forwarded-call metadata (for example `ForwardedFrom`, where present) should be captured and tested, with an explicit business mode as the fallback.

## Why No Tests Yet

There are no automated tests. This is deliberate technical debt:

- v0.1–0.2 was a pre-customer prototype — manual scenario testing in the Test Console caught everything
- The Squad Review (Morgan persona) has flagged automated STOP/START/HELP tests as 🔴 blocker before first customer
- Plan: pick `vitest` or `node:test` (built-in), write 10–15 high-leverage tests around the compliance flow, then add a tiny GitHub Action to run them on PR

This is the single largest piece of legitimate tech debt in the repo.
