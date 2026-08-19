# 03 — Current State (August 19, 2026)

## Code Status

- **Latest status milestone:** Direct Twilio demo call verified end to end; Render runtime repaired and persistent storage active.
- **Latest commit on `master` / `origin/master`:** `77c52d1` — *"Fix forwarded Twilio call handling"*
- **Branch reality:** GitHub and Render are tracking `master` for this service.

## What's Shipped (working in production today)

### Backend
- Express 5 server (`server/index.js`) with static serving, route mounting, 15-min cron for follow-ups
- SQLite via `better-sqlite3` with WAL journaling — tables: `businesses`, `leads`, `messages`, `follow_ups`
- Persistent disk on Render Starter mounted at `/var/data`, env var `DB_PATH=/var/data/swoop.db`
- Twilio webhooks: `/webhooks/voice`, `/webhooks/voice-status`, `/webhooks/voice-dial-result`, `/webhooks/sms`
- Twilio request signature validation in prod (`TWILIO_MOCK_MODE=true` skips it for local dev)
- Forwarded-call callback uses an absolute URL and carries the original business ID to avoid lookup failures
- Deploy seeder updates an existing business's `forward_phone` when `DEFAULT_FORWARD_PHONE` is set
- `trust proxy = 1` set so signature validation works behind Render's reverse proxy
- REST API: `/api/dashboard`, `/api/leads/*`, `/api/businesses/*`, `/api/admin/*`, `/api/test/simulate`

### Compliance behaviors (the carrier-mandated stuff)
- Default `auto_reply_message` template includes branded sender ID, `Msg&data rates may apply`, and `STOP/HELP` keywords in the **very first** message sent to a new caller (`server/db/database.js`)
- STOP / STOPALL / UNSUBSCRIBE / CANCEL / END / QUIT → set `sms_opt_out=1`, suppress all future sends
- START / UNSTOP → clear opt-out, log re-consent
- HELP → reply with branded help message + live privacy URL (`welcomematdigital.com/swoop/privacy.html`)
- Outbound send guardrail: any code path that sends SMS checks `lead.sms_opt_out` first
- Test data is tagged (`is_test=1` on `leads` + `messages`) so admin metrics, dashboard stats, and the reset scenario can distinguish real from simulated rows

### AI agent (v0.2.5)
- `server/services/ai-agent.js` builds a system prompt from `businesses` row (name, services, hours, tone, FAQs, never-say list)
- Calls OpenAI `gpt-4o-mini`
- Tracks `ai_turn_count` per lead; hands off cleanly when `max_ai_turns` exceeded (default 3 per business)
- Handoff = sets `lead_status = needs_attention`, writes a conversation summary to `lead.notes`
- AI never sends marketing — explicit anti-marketing rule in the system prompt (compliance hardening from v0.2.7)

### Dashboard (`public/index.html`)
- Single-file SPA, no framework
- Stats cards, lead list, lead detail modal with chat bubbles
- Add Business form (with full profile fields)
- Manual outbound SMS from owner (with opt-out guardrail)
- "Open Next Priority Lead" smart routing using urgency scoring
- Tabs: Dashboard / Test Console (Test Console hidden unless `localStorage.swoop_dev_mode === 'true'` or `?dev=1`)
- Test Console: 6 named scenarios — Happy Path, Ghosting, Opt-Out, Emergency, Opt-Out → Back-In, Busy Tuesday — with SMS-bubble visualization

### Admin (`public/admin.html`)
- Platform-wide stats
- Per-business metrics table (leads, conversions, messages, AI turns, last activity, health)
- Demo-mode panel to swap businesses and clear leads
- **No auth** — same blocker as the dashboard

### Static legal pages
- `public/consent.html` — SMS Consent & Opt-In Policy, FCC + CTIA basis, NOT bundled with anything (this is critical for Twilio)
- `public/landing.html` — customer-facing single-page pitch
- Live mirrors live in **the sibling `frontdesk-ai` repo** at `public/swoop/{consent,privacy,terms,index}.html` — these are what Twilio reviewers actually fetch (welcomematdigital.com domain)

### Identity / business foundation (June 1–14, 2026)
- ✅ WA LLC — **WelcomeMat Digital LLC**, UBI **606238837**
- ✅ Federal EIN — **42-2903620**
- ✅ WA Business License filed — Confirmation **#0-052-653-982** (Sammamish home occupation endorsement)
- ✅ Zoho Mail Lite — `hello@welcomematdigital.com` + `privacy@welcomematdigital.com`
- ✅ Mercury bank account approved (same day, June 2)
- ✅ Twilio account upgraded Trial → Paid (June 1)
- ✅ Twilio Business Profile approved — bundle `BUf71fa573b0fd6173b0cc31daba2ba41b` (June 11, manual review)
- ✅ BOI exemption confirmed permanently — March 2025 FinCEN final rule exempts US entities (June 14)

## What's Not Built (still open)

### Hard blockers for a paying customer
- ✅ **TFV approved** — `+1 (833) 783-0902` can now send SMS/MMS through Twilio
- 🔴 **No auth on dashboard or admin** — public URLs expose all leads
- 🔴 **No A2P 10DLC brand or campaign** — required for customer production numbers
- 🔴 **No local-number provisioning per customer** — owners need a 425 number, not the 833 demo line
- 🔴 **No automated STOP/START/HELP compliance tests** — Morgan flagged: "trust controls must be provable, not just implemented"
- 🔴 **No production forwarded-call mode** — unanswered calls from a customer's existing number still need a mode that sends the SMS and ends the call without a second owner dial or repeated disclosure
- 🟡 **Toll-free caller reputation** — the `833` demo number was flagged as possible fraud by a friend's carrier/device; use local customer numbers for production

### High-value missing features
- 🟡 Inline editing of business profile after creation
- 🟡 AI toggle / tone / max-turns edit from dashboard (today: SQL only)
- 🟡 Owner SMS alert on handoff
- 🟡 Stripe billing
- 🟡 Per-industry landing pages
- 🟡 ROI dashboard ("Swoop saved you $X this month")
- 🟡 "Opted out" chip + filter on the leads list

### Nice-to-have
- 🟢 Search/filter leads
- 🟢 Pagination (currently capped at 50)
- 🟢 Editable scenario steps in Test Console
- 🟢 Configurable follow-up timing (today: hardcoded 1/3/7 days)
- 🟢 Voice greeting customization per business

Full list lives in [BACKLOG.md](../BACKLOG.md) and is mirrored to [06_BACKLOG.md](06_BACKLOG.md).

## Infrastructure Snapshot

| Component | Where | Cost | Notes |
|---|---|---|---|
| App hosting | Render Starter | $7/mo | Paid runtime; removes the Free-plan restriction and supports the persistent disk. |
| Persistent disk | Render, 1 GB at `/var/data` | $0 (included) | `DB_PATH=/var/data/swoop.db` |
| DNS | Cloudflare (proxy disabled on TXT/MX, CNAME DNS-only for Render SSL) | $0 | Critical single point of failure — owns welcomematdigital.com |
| Mail | Zoho Mail Lite | $12/yr | Renews 05/29/27. Gmail pulls via POP3 + Send-As. Watch Gmail POP3 deprecation. |
| Domain | welcomematdigital.com | ~$12/yr | (verify registrar) |
| Twilio | Pay-as-you-go | ~$2/number/mo + per-msg | Trial → Paid June 1 |
| OpenAI | Pay-as-you-go | ~$1–2/mo at current usage | `gpt-4o-mini`, $5 prepaid |
| GitHub | Free | $0 | `sunilmsft/swoop` public repo + Pages |
| Bank | Mercury | $0 | Business checking + IO credit card |

**Total monthly run rate: ~$15–20.** Break-even at 1 paying customer.

## Compliance Surface (don't touch without reading)

| Asset | Location | Bound to |
|---|---|---|
| Branded auto-reply template | `server/db/database.js` (`auto_reply_message` default) | Twilio reviewer sample-message field |
| STOP/HELP keyword handlers | `server/services/leads.js` | TCPA + CTIA platform-level requirement |
| AI anti-marketing rule | `server/services/ai-agent.js` system prompt | TFV "Customer Care only" declaration |
| Consent page | `public/consent.html` AND `frontdesk-ai/public/swoop/consent.html` | Twilio TFV Privacy + Terms URL fields |
| Privacy page | `frontdesk-ai/public/swoop/privacy.html` (this repo doesn't ship one) | Twilio TFV Privacy URL |
| Terms page | `frontdesk-ai/public/swoop/terms.html` | Twilio TFV Terms URL |

Any edit to these surfaces requires re-reading [12_TWILIO_VERIFICATION_HISTORY.md](12_TWILIO_VERIFICATION_HISTORY.md).

## Verified August 19, 2026

- Render service is on Starter and reports a 1 GB disk.
- `DB_PATH` is `/var/data/swoop.db`.
- `DEFAULT_FORWARD_PHONE` is configured as `+14257867232`.
- Twilio voice and status callbacks are configured as POST webhooks on the Render service.
- Direct call to `(833) 783-0902` rings the owner's cell and sends the SMS when unanswered.
- The caller-facing message is currently repeated: an initial compliance disclosure, then a missed-call confirmation. This is acceptable for the demo but not the desired customer-forwarding experience.

## Outstanding Watch Items

- **OpenAI key reliability** — fallback second-turn response is in place, but production AI path should be restored and validated.
- **Landline/non-textable callers** — backlog item added for Twilio Lookup + callback-needed fallback.
- **India trip June 25** — resume with post-trip checklist in [BACKLOG.md](../BACKLOG.md).
- **WA Business License email** — expected delivery within 10 business days from June 2 filing.
- **Sammamish home-occupation endorsement** — ~3 weeks from June 2.
- **Calendar reminders set:** May 29 2027 (Zoho renewal), May 30 2027 (WA license renewal warning), June 1 2027 (Annual Report 30-day warning), **June 30 2027 (HARD WA Annual Report deadline ~$70)**.
