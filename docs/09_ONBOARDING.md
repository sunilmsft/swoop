# 09 — Onboarding (Human or AI)

> If you've just inherited this project and have zero context, work through this file top to bottom. Most steps are 2–5 minutes.

---

## Phase 1 — Get Oriented (read-only, ~30 min)

### 1.1 Read the preservation docs in order
- [01_EXECUTIVE_SUMMARY.md](01_EXECUTIVE_SUMMARY.md) — one-page overview
- [02_PRODUCT_VISION.md](02_PRODUCT_VISION.md) — why this exists
- [03_CURRENT_STATE.md](03_CURRENT_STATE.md) — what's shipped
- [04_ARCHITECTURE.md](04_ARCHITECTURE.md) — code map
- [12_TWILIO_VERIFICATION_HISTORY.md](12_TWILIO_VERIFICATION_HISTORY.md) — compliance status (mandatory)

### 1.2 Skim the live backlog
- [`BACKLOG.md`](../BACKLOG.md) at repo root — the source of truth for what's open

### 1.3 Open the Playbook
- `PLAYBOOK.html` — open in a browser. 11 tabs of operational reference. The Dev Runbook and Accounts & Keys tabs are especially useful.

---

## Phase 2 — Verify Access (~1 hour, hands-on)

Don't skip this. The whole project hinges on a small ring of third-party accounts. If you can't log into any one of them, you don't actually own the project.

### 2.1 GitHub
- [ ] Log into `github.com/sunilmsft` (NOT `sunilve_microsoft` — that's the enterprise-managed account)
- [ ] Confirm `sunil1308@gmail.com` is **Primary** + **Verified** in `github.com/settings/emails`
- [ ] Clone the repo fresh somewhere outside OneDrive: `git clone https://github.com/sunilmsft/swoop.git C:\dev\swoop`
- [ ] Also clone the sibling: `git clone https://github.com/sunilmsft/frontdesk-ai.git C:\dev\frontdesk-ai`
- [ ] Set repo-local git config in each: `git config user.email sunil1308@gmail.com`
- [ ] Verify with: `git config --get user.email`

### 2.2 Render
- [ ] Log into `dashboard.render.com` via Google (`sunil1308@gmail.com`)
- [ ] Confirm both services visible: `swoop` and `frontdesk-ai` (or whatever the welcomematdigital.com service is named)
- [ ] **Export environment variables** from each service to a password manager. The Render dashboard is the only copy.
- [ ] Note the persistent disk on the `swoop` service: `swoop-data`, mounted at `/var/data`, 1 GB

### 2.3 Twilio
- [ ] Log into `console.twilio.com` via Google
- [ ] Account name: should reference WelcomeMat Digital LLC
- [ ] Confirm number `+1 (833) 783-0902` is owned by the account
- [ ] Trust Hub → Business Profile bundle `BUf71fa573b0fd6173b0cc31daba2ba41b` → status should be **Approved** (since June 11, 2026)
- [ ] Trust Hub → Toll-Free Verification → status check. As of June 15, 2026: resubmitted June 13, in prioritized queue. Ticket `27236005`, reviewer Ignacio L.
- [ ] **Rotate `TWILIO_AUTH_TOKEN`** (Account → API keys & tokens → "Request a secondary token") if there's any chance the current one has been exposed

### 2.4 OpenAI
- [ ] Log into `platform.openai.com` via Google
- [ ] Verify billing has credits (currently ~$5 prepaid, ~$1–2/mo burn at current usage)
- [ ] **Rotate API key** if there's any chance of exposure
- [ ] Update both `.env` (local) and Render env var with the new key

### 2.5 Cloudflare (single point of failure for the domain)
- [ ] Log into Cloudflare
- [ ] Confirm zone for `welcomematdigital.com` is present
- [ ] Verify DNS records (especially Zoho MX, Render CNAME for `swoop-x79g.onrender.com`-style routing — DNS-only / proxy disabled)
- [ ] Confirm 2FA enabled. Save backup codes outside OneDrive.
- [ ] **If you don't recognize the login email, you may not actually have the account — this is critical, investigate before doing anything else**

### 2.6 Zoho Mail
- [ ] Log into `mail.zoho.com`
- [ ] Verify `hello@welcomematdigital.com` and `privacy@welcomematdigital.com` inboxes
- [ ] Verify Gmail is pulling via POP3 (`poppro.zoho.com:995`) and Send-As is configured (`smtppro.zoho.com:465`)
- [ ] Install Zoho Mail mobile app as backup — Google has announced POP3 deprecation, no firm date yet

### 2.7 Domain registrar
- [ ] Verify which registrar owns `welcomematdigital.com` (likely Namecheap or similar — check via `whois welcomematdigital.com`)
- [ ] Log in and confirm auto-renewal is on, payment method valid, registrant email reachable
- [ ] Save transfer auth code somewhere safe

### 2.8 Mercury Bank
- [ ] Log into `mercury.com` — should be tied to your SSN + LLC EIN, fully independent of Microsoft
- [ ] Confirm account, debit card, IO credit card active

### 2.9 Other infrastructure
- [ ] WA Secretary of State (`ccfs.sos.wa.gov`) — annual report due **June 30, 2027** (HARD deadline, ~$70). Set a calendar reminder if not already set.
- [ ] WA Business License (`business.wa.gov`) — verify status; license confirmation `#0-052-653-982`
- [ ] IRS — EIN `42-2903620`. CP 575 PDF is in OneDrive/WelcomeMat Digital/

---

## Phase 3 — Get the App Running Locally (~15 min)

### 3.1 Install
```powershell
cd C:\dev\swoop
npm install
```

### 3.2 Configure
```powershell
Copy-Item .env.example .env
# Open .env and fill in:
#   TWILIO_ACCOUNT_SID
#   TWILIO_AUTH_TOKEN
#   TWILIO_PHONE_NUMBER   = +18337830902
#   OPENAI_API_KEY
# Or set TWILIO_MOCK_MODE=true to skip Twilio entirely
```

### 3.3 Seed and run
```powershell
npm run seed
npm run dev
```

### 3.4 Verify
- Open `http://localhost:3000` — owner dashboard with 2 demo businesses
- Open `http://localhost:3000/admin.html` — admin console with platform stats
- Open `http://localhost:3000/?dev=1` — owner dashboard with Test Console tab visible
- Hit `http://localhost:3000/health` — should return `{ status: 'ok', ... }`

### 3.5 Simulate a missed call
```powershell
curl -X POST http://localhost:3000/webhooks/voice-dial-result `
  -d "DialCallStatus=no-answer&DialCallDuration=0&From=%2B14255551234&To=%2B18337830902"
```
Check the dashboard — a new lead should appear, with an outbound SMS row.

---

## Phase 4 — Make a Trivial Change & Push It (~20 min)

Goal: prove you can ship to production without breaking anything.

### 4.1 Make a 1-line change
Pick something cosmetic. E.g. update the version string in `package.json`, or fix the README pricing typo (KI-16 in [07_KNOWN_ISSUES.md](07_KNOWN_ISSUES.md)).

### 4.2 Commit locally
```powershell
git status
git add <file>
git commit -m "chore: <what you did>"
```

### 4.3 Verify locally
- Restart `npm run dev`
- Confirm app still loads
- Confirm dashboard still works
- Run a Squad Review (4 personas; trivial change can be 4× 👍 in one line each)

### 4.4 Push
```powershell
git push origin master:main
```

### 4.5 Watch deploy
- Render dashboard → swoop service → Events tab
- Within ~2 minutes: status should go Build → Deploy → Live
- Hit `https://swoop-x79g.onrender.com/health` — should be green
- Hit `https://welcomematdigital.com/swoop/` — frontdesk-ai content should still be intact (this deploy doesn't touch it)

---

## Phase 5 — Read the Compliance Story

Before touching anything that affects SMS, consent pages, or the AI prompt:

- [ ] Read [12_TWILIO_VERIFICATION_HISTORY.md](12_TWILIO_VERIFICATION_HISTORY.md) cover-to-cover
- [ ] Open the live consent page: `https://welcomematdigital.com/swoop/consent.html`
- [ ] Open the privacy page: `https://welcomematdigital.com/swoop/privacy.html`
- [ ] Open the terms page: `https://welcomematdigital.com/swoop/terms.html`
- [ ] Compare each to the version in `frontdesk-ai/public/swoop/` (they should match)
- [ ] Note that `public/consent.html` in **this** repo is a separate copy; it serves the Render app's `/consent` route

---

## Phase 6 — Pick a First Task

Pick something from [06_BACKLOG.md](06_BACKLOG.md). Recommended starter tasks:

| Task | Why a good first task | Est. effort |
|---|---|---|
| Update Notification Email in Twilio Trust Hub | Pure clicks, no code, builds Twilio familiarity | 5 min |
| Fix README.md pricing inconsistency (KI-16) | Tiny PR, full deploy cycle, low risk | 15 min |
| Add 5 automated tests for STOP/START/HELP (KI-1) | High value, isolated code, exposes you to the compliance core | half day |
| Write the magic-link auth (KI-2) | THE biggest blocker | 2–3 days |

If `TFV is still pending`, **don't push compliance-surface changes** — wait until Twilio decision lands so you don't change anything mid-review.

---

## Quick Reference: What Goes Where

| Thing | Lives In |
|---|---|
| Open backlog | [`BACKLOG.md`](../BACKLOG.md) (root) |
| Operational reference | `PLAYBOOK.html` |
| Squad Review rules | `.github/copilot-instructions.md` |
| Live secrets | `.env` (local) + Render dashboard (prod) |
| Schema | `server/db/database.js` |
| Compliance surface | `server/services/leads.js` + `public/consent.html` + frontdesk-ai mirrors |
| Twilio history | [12_TWILIO_VERIFICATION_HISTORY.md](12_TWILIO_VERIFICATION_HISTORY.md) |
| Architecture map | [04_ARCHITECTURE.md](04_ARCHITECTURE.md) |
| Past major decisions | [05_DECISION_LOG.md](05_DECISION_LOG.md) |
| Tech debt + bugs | [07_KNOWN_ISSUES.md](07_KNOWN_ISSUES.md) |
| What to do next | [10_NEXT_STEPS.md](10_NEXT_STEPS.md) |

## Help, I Need a Human

If you can't reach the project owner: the LLC is registered to a personal address in Sammamish WA. Government correspondence goes there. Twilio + Stripe + Mercury contact emails are at `hello@welcomematdigital.com`. The repo is public on GitHub. The product is not in active use by any paying customer (as of June 15, 2026), so there is no urgent customer-facing failure mode — you can take time to get oriented.
