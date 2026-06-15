# 01 — Executive Summary

> **Read this first.** This is the one-page version. Every other file in `docs/` expands on something here.

**Project:** Swoop
**Tagline:** Never miss a lead again.
**Owner:** Sunil Venugopal — solo founder, Sammamish WA
**Legal entity:** WelcomeMat Digital LLC (WA, UBI 606238837, EIN 42-2903620)
**Repository:** github.com/sunilmsft/swoop (public, `main` branch is deployed)
**Production:** https://swoop-x79g.onrender.com
**Marketing/identity site:** https://welcomematdigital.com (lives in sibling repo `frontdesk-ai`)
**This file was created:** June 15, 2026 — as a permanent preservation snapshot. Assume all prior chat history is lost.

---

## What Swoop Is

An AI-powered **missed-call text-back** SaaS for small home-service businesses (plumbers, electricians, HVAC, landscapers, cleaners). Workflow:

```
Customer calls business → business misses it (under a sink, on a roof, on another call)
  → Swoop sends an SMS within ~5 seconds: "Hi! This is [Business] returning your missed call..."
  → If the customer replies, an AI agent (OpenAI gpt-4o-mini) handles 3 turns of conversation
  → After 3 turns OR clear handoff trigger, lead is escalated to the owner ("Needs Attention")
  → If no reply, 3-touch follow-up sequence (day 1, day 3, day 7)
  → On job completion, one-click SMS request for a Google review
```

The premise: a missed call to a plumber is worth ~$300. Owners miss 3–5 per week. Swoop captures them.

## Status (as of June 15, 2026)

| Area | State |
|---|---|
| **Code** | Working. v0.2.7 deployed. SQLite + Express + Twilio + OpenAI. ~56 commits. |
| **Hosting** | Render free tier with 1GB persistent disk. Stable. |
| **Legal entity** | ✅ WA LLC approved. EIN issued. WA Business License filed. Mercury bank account open. |
| **Twilio Business Profile** | ✅ Approved June 11, 2026. Bundle `BUf71fa573b0fd6173b0cc31daba2ba41b`. |
| **Twilio Toll-Free Verification (TFV) for `+1 (833) 783-0902`** | ⏳ **Resubmitted June 13, 2026 — in prioritized queue.** Awaiting decision. This is the single blocker for production SMS. See [12_TWILIO_VERIFICATION_HISTORY.md](12_TWILIO_VERIFICATION_HISTORY.md). |
| **A2P 10DLC** | ❌ Not started. Decided June 13: TFV = demo/test only. 10DLC = production path for customer numbers. |
| **Auth on dashboards** | ❌ Not built. Anyone with the URL sees all leads — biggest open security issue. |
| **First paying customer** | ❌ Not yet. Outreach playbook exists but no live customer. |
| **Travel watch** | India trip June 25 — TFV decision may land while I'm away. |

## The Single Most Important Thing in This Repo

**`server/services/leads.js`** plus **`public/consent.html`** plus the live mirror at **`welcomematdigital.com/swoop/{privacy,terms,consent}.html`** are the **Twilio compliance surface**. Touch these and you risk re-verification. Read [12_TWILIO_VERIFICATION_HISTORY.md](12_TWILIO_VERIFICATION_HISTORY.md) before changing any of:
- Default `auto_reply_message` template in `server/db/database.js`
- STOP/HELP keyword handlers in `server/services/leads.js`
- The consent / privacy / terms pages (both in this repo and in the `frontdesk-ai` mirror)
- Any URL that Twilio Trust Hub has on file

## Core Tech Stack (verbatim, current)

- **Backend:** Node.js ≥ 18, Express 5
- **DB:** SQLite via `better-sqlite3` (WAL mode, single file at `/var/data/swoop.db` in prod)
- **SMS/Voice:** Twilio SDK v6
- **AI:** OpenAI SDK, model `gpt-4o-mini`
- **Cron:** `node-cron` — every 15 min, follow-up processor; disabled in `NODE_ENV=development`
- **Dashboard/Admin UI:** Plain HTML/CSS/vanilla JS — no framework, no build step
- **Hosting:** Render free tier with 1GB persistent disk
- **Docs:** `PLAYBOOK.html` (single-file 11-tab reference), GitHub Pages mirror at `sunilmsft.github.io/swoop`
- **Identity site:** sibling repo `frontdesk-ai` → welcomematdigital.com (Cloudflare DNS → Render)

## Critical Outside Dependencies

| Service | Login | What dies if you lose access |
|---|---|---|
| Twilio | Google login → `sunil1308@gmail.com` | All SMS. TFV bundle. Toll-free number. |
| OpenAI | Google login | All AI replies |
| Render | Google login | Hosting (both Swoop and WelcomeMat sites) |
| GitHub | `sunilmsft` account, primary email = `sunil1308@gmail.com` | Source + Pages + Render auto-deploy |
| Cloudflare | (verify) | DNS for welcomematdigital.com — if this dies, both Render apps go dark AND Twilio compliance URLs 404 |
| Zoho Mail | (verify) | `hello@` + `privacy@welcomematdigital.com` — these are the addresses Twilio Trust Hub has on file |
| Domain registrar | (verify) | welcomematdigital.com itself |
| Mercury Bank | personal SSN + LLC EIN | Business banking |

If any of these get lost, the others can survive — but Cloudflare + Zoho + domain registrar form a tight triangle where losing one cascades. See [09_ONBOARDING.md](09_ONBOARDING.md) for the access verification checklist.

## Top 3 Risks Right Now (in order)

1. **TFV decision** — if rejected again, production SMS stays blocked. Path forward is documented in [12_TWILIO_VERIFICATION_HISTORY.md](12_TWILIO_VERIFICATION_HISTORY.md).
2. **No auth on dashboard** — `swoop-x79g.onrender.com` is publicly reachable and shows all leads. Cannot onboard a real customer until this is fixed.
3. **Repo lives inside OneDrive folder.** If the OneDrive is corporate-tied (likely — verify), the working tree disappears the day Microsoft access is revoked. Git remote is the source of truth, so worst case = re-clone; but `.env` lives here and contains live API keys.

## What to Read Next

1. [02_PRODUCT_VISION.md](02_PRODUCT_VISION.md) — why this exists and who it's for
2. [03_CURRENT_STATE.md](03_CURRENT_STATE.md) — what's shipped vs. not
3. [12_TWILIO_VERIFICATION_HISTORY.md](12_TWILIO_VERIFICATION_HISTORY.md) — **mandatory** reading before touching SMS or compliance pages
4. [09_ONBOARDING.md](09_ONBOARDING.md) — how a new engineer / AI assistant picks up the work
