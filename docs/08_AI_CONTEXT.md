# 08 — AI Context Pack

> **For the next AI assistant who picks up this project.** This file is structured so you can paste it into context and immediately operate as if you'd been on this codebase for months. Read [01_EXECUTIVE_SUMMARY.md](01_EXECUTIVE_SUMMARY.md) first if you haven't.

---

## Who You're Working With

**The user:** Sunil Venugopal — Product Manager at Microsoft, based in Sammamish WA. Building Swoop as a solo founder side project. Not a software engineer by training. Prefers:

- High autonomy. Show plan → build → let them review. Don't ask permission for every small step.
- Clear "local vs. pushed" status after every change. They check welcomematdigital.com thinking it's updated when something is still local-only.
- Simple over clever. Long technical explanations frustrate them. Show the change, summarize the impact in 1–2 sentences.
- Honest critical reviews via the Squad personas. Avoid blanket positivity.

## Hard Operating Rules

These are non-negotiable. Violating any of them has burned past sessions.

1. **NEVER auto-push to remote.** Render auto-deploys from `master`. `git push` = instant production. The flow is always: make changes → commit locally → user reviews on localhost → user says "push it" → THEN push. Never combine commit + push in one command.

2. **Always state LOCAL vs PUSHED.** After any change, explicitly tell the user whether it's local-only or live. They will assume the worst (and check the wrong URL) otherwise.

3. **ALWAYS use `welcomematdigital.com`** for any demo/customer-facing URL. NEVER the raw `swoop-x79g.onrender.com` or `frontdesk-ai-vx1s.onrender.com` Render URLs. The user has corrected this multiple times.

4. **Squad Review after every meaningful change.** Four personas — Ray (owner), Priya (success), Jordan (power user), Morgan (compliance) — must all 👍 or 🤷 before commit. If anyone 👎, discuss before pushing. Format and persona descriptions are in `.github/copilot-instructions.md`.

5. **After every Squad Review, update `BACKLOG.md`.** Add new issues with the right priority label and persona quote. Bump existing items if the squad flagged them. Add to "By Design" with rationale if "won't fix".

6. **Touching the compliance surface = read `12_TWILIO_VERIFICATION_HISTORY.md` first.** That includes: the default `auto_reply_message`, STOP/HELP handlers, `public/consent.html`, the frontdesk-ai mirrors at `welcomematdigital.com/swoop/{consent,privacy,terms}.html`, and the AI system prompt's anti-marketing rule.

7. **API key exposure warning.** The user has pasted live API keys into chat multiple times. Always warn them to regenerate immediately.

8. **Microsoft accounts are forbidden** for any third-party signup. All accounts (Twilio, OpenAI, Render, GitHub, Cloudflare, Zoho) use Google login with `sunil1308@gmail.com`. If you find a setup screen asking for an email, default to the Gmail address.

## Project at a Glance

```
What:    AI missed-call text-back SaaS for small home-service businesses
Who:     Solo founder, target customers = plumbers/electricians/HVAC at $29–$49/mo
Where:   Node + Express + SQLite + Twilio + OpenAI, hosted on Render Starter with a 1 GB disk
Status:  Direct demo call verified August 19, 2026. TFV approved June 23. Latest deployed commit: 77c52d1.
          Blockers before first paying customer: owner auth, A2P 10DLC/local numbers, and production forwarded-call mode.
Brand:   "Swoop." — product under "WelcomeMat Digital LLC" (the holding entity)
```

## Repo Map (memorize this)

```
server/
  index.js                 — Express bootstrap + cron
  db/database.js           — Schema + inline migrations
  routes/
    webhooks.js            — Twilio voice + SMS handlers
    api.js                 — Dashboard / admin / business REST
    test.js                — /api/test/simulate (Test Console backend)
  services/
    twilio.js              — sendSMS + signature validation
    ai-agent.js            — OpenAI client + system prompt builder + handoff
    leads.js               — handleMissedCall / handleInboundSMS / cron job
  seed.js                  — Demo data

public/
  index.html               — Owner dashboard (vanilla JS SPA)
  admin.html               — Platform-operator console
  consent.html             — SMS Consent & Opt-In Policy

docs/                      — THIS folder. Preservation package.
BACKLOG.md                 — Live backlog (source of truth)
PLAYBOOK.html              — 11-tab single-file reference doc
.github/copilot-instructions.md — Squad Review rules
.env                       — Live secrets (gitignored)
.env.example               — Template
render.yaml                — Render service definition
```

## The Sibling Repo You Will Constantly Interact With

`frontdesk-ai` — at `C:\Users\sunilve\OneDrive\GitHub Copilot Fun Projects\frontdesk-ai`. Hosts `welcomematdigital.com`. Critical because:

- `public/swoop/consent.html`, `public/swoop/privacy.html`, `public/swoop/terms.html` — these are the URLs Twilio reviewers fetch
- `public/swoop/index.html` — the customer-facing Swoop page on the welcomematdigital.com domain
- Auto-deploys to Render on push to `main`

When you change `public/consent.html` in this repo, **also update** `frontdesk-ai/public/swoop/consent.html`. They drift apart easily. See [11_RELATED_PROJECTS.md](11_RELATED_PROJECTS.md).

## Tech Stack (no surprises)

- **Node.js ≥ 18, Express 5** — CommonJS (`require()`)
- **better-sqlite3** — synchronous SQLite client; pragma WAL
- **OpenAI SDK** — `gpt-4o-mini`, chat completions API
- **Twilio SDK v6** — programmable messaging + voice
- **node-cron** — 15-min schedule for follow-ups
- **dotenv** — `.env` loading
- **No build step. No framework. No TypeScript. No tests yet.**

## Common Tasks — Cheat Sheet

### Run locally
```bash
npm install
cp .env.example .env   # if not present
# fill in TWILIO_*, OPENAI_API_KEY (or set TWILIO_MOCK_MODE=true to skip Twilio)
npm run dev            # node --watch server/index.js, port 3000
```

### Reset demo data
```bash
npm run seed   # drops + recreates DB with 2 businesses, 6 leads
```

### Simulate a missed call (no Twilio needed if MOCK_MODE)
```bash
curl -s -X POST http://localhost:3000/webhooks/voice-dial-result \
  -d "DialCallStatus=no-answer&DialCallDuration=0&From=%2B14255551234&To=%2B18337830902"
```

### Simulate STOP/START/HELP
```bash
curl -s -X POST http://localhost:3000/webhooks/sms -d "From=%2B14255551234&To=%2B18337830902&Body=STOP"
curl -s -X POST http://localhost:3000/webhooks/sms -d "From=%2B14255551234&To=%2B18337830902&Body=START"
curl -s -X POST http://localhost:3000/webhooks/sms -d "From=%2B14255551234&To=%2B18337830902&Body=HELP"
```

### Deploy
```bash
  git push origin master   # only after user explicitly says "push it"
# Render auto-deploys. Watch logs at dashboard.render.com
```

### Test Console (dev-only UI)
Open `http://localhost:3000` then either:
- Add `?dev=1` to URL, or
- Run in console: `localStorage.swoop_dev_mode = 'true'` and refresh

You'll get a second tab with 6 named scenarios.

## How Decisions Are Made Here

| Question | How to decide |
|---|---|
| New feature idea | Filter through 4 design principles (modular, self-service, light-touch, cheap). If it fails any, push back. |
| Should we add this dependency? | Only if (a) it removes ≥50 lines of brittle code AND (b) it's a well-maintained package. The repo has 6 deps total. |
| New UI complexity | Default to vanilla. Only adopt a framework when complexity genuinely demands it. Settings panel (v0.4) is the likely trigger. |
| Touch the compliance surface | Read [12_TWILIO_VERIFICATION_HISTORY.md](12_TWILIO_VERIFICATION_HISTORY.md). If the change affects what Twilio sees, run a separate "compliance review" with Morgan persona. |
| Migrate / rename / refactor | Default no. Only do it for a concrete reason. The user explicitly hates speculative refactoring. |
| Should we test this? | If it's compliance-related (STOP/HELP/opt-out): yes, blocker. If it's a UI change: no, manual test in Test Console. |

## Personas — The Voice in Your Head

Run every change through these mentally before shipping.

- **Ray (owner-operator)** — "Will this get me more jobs? Is it on my phone? Do I need a manual?"
- **Priya (customer success)** — "Will this generate support tickets I can't answer alone? Is the error message clear?"
- **Jordan (power user, watches competitors)** — "Is this competitive with Avoca/Podium/Handraiser? Where's the ROI metric?"
- **Morgan (compliance / Twilio risk)** — "Will this survive a TCPA complaint? Is the consent provable? Are STOP/HELP enforced?"

If any of them gives 👎, that becomes a `BACKLOG.md` entry with their quote.

## What's "Done" vs. "Aspirational" in This Codebase

Done (working in production):
- Missed-call → branded SMS → 3-turn AI conversation → handoff
- 3-touch follow-up sequence (day 1, 3, 7), cancelled on reply or opt-out
- STOP/START/HELP keyword handling at platform level
- Opt-out enforcement on all four send paths
- Test Console with 6 scenarios + test-data tagging
- Owner dashboard, admin dashboard, single-business view
- Static consent / privacy / terms (mirrored to GitHub Pages and to frontdesk-ai)

Aspirational (not built):
- Auth (🔴 blocker)
- A2P 10DLC for production customer numbers (🔴 blocker)
- Local-number per-customer provisioning (🔴 blocker)
- Owner SMS alert on handoff
- Stripe billing
- Anything self-service for owners beyond initial Add-Business
- Automated tests

## Recurring Mistakes to Avoid

These have all been made and learned from:

1. **Pushed without user review.** Multiple times. Stop assuming "this is small, it's fine." The user reviews everything locally first.
2. **Used `frontdesk-ai-vx1s.onrender.com` URL** in conversation/demo. Always say `welcomematdigital.com`.
3. **Modified `public/consent.html` without mirroring to `frontdesk-ai`.** They drift. Result: Twilio reviewer fetches stale page.
4. **Suggested rewriting git history** to clean up Microsoft email attribution. Don't. Force-push has bigger downsides than the cosmetic gain. Past commits stay as-is.
5. **Treated Persona/automated KYB as the only path.** When it fails on young EIN, go to manual review with evidence package immediately. (Lesson from June 11 BP approval — see decision log.)
6. **Trusted Twilio form prefill.** The Terms URL silently dropped between BP and TFV resubmits. Always re-verify every field on the form.

## When You're Stuck

1. Check the live `BACKLOG.md` at repo root — most current open items
2. Check `PLAYBOOK.html` — comprehensive reference, especially the Dev Runbook tab
3. Check `/memories/repo/context.md` if you have memory access — recent session state
4. Render dashboard logs are the fastest path to runtime errors
5. Twilio Console → Messaging Logs is the fastest path to delivery issues
6. If you're about to do something potentially destructive (force-push, drop a table, delete a Twilio bundle): STOP and ask the user first
