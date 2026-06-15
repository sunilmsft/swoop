# 05 — Decision Log

Major architecture, product, and compliance decisions in chronological order. Each entry says **what** was decided, **why**, and **what we'd revisit it on**. Reverse-chronological within each phase.

---

## Compliance & TFV (May–June 2026)

### June 14, 2026 — Privacy page hardened with explicit no-share clause
- **What:** Added three coverage points of Twilio's exact "magic phrase" to `frontdesk-ai/public/swoop/privacy.html` (top callout, expanded Section 5, new dedicated Section 6).
- **Why:** Ignacio (Twilio TFV reviewer) sent an advisory email about Mixed-Use-Case pitfalls. Web-form opt-in templates often get pattern-matched against missing no-share language. Preemptive hardening is cheap insurance against next-round rejection.
- **Revisit if:** Twilio policy text changes, or we add a new "no mobile information will be shared" recipient (today: Subscriber business, Twilio, OpenAI, authorized WelcomeMat staff only).

### June 13, 2026 — TFV stays demo-only; 10DLC is the production path
- **What:** Toll-free `+1 (833) 783-0902` is permanently designated as Swoop's internal demo / test / sales line. Real customers will get local 10DLC numbers (one per customer, e.g. 425 area code for a Sammamish plumber) under a single shared "missed-call response" campaign on the WelcomeMat Digital LLC Brand.
- **Why:** Toll-free is wrong for trades — customers don't trust 833. Local numbers in the customer's own area code feel native. TFV is still worth finishing because we need a verified number to demo and dev-test against.
- **Revisit if:** TFV gets rejected twice more and the friction outweighs the demo value, OR if 10DLC vetting takes >30 days.

### June 11, 2026 — Manual review beats Persona on a young EIN
- **What:** When Twilio Business Profile auto-verification (Persona) failed twice on EIN 42-2903620 (issued only 10 days earlier), bypassed the wizard and emailed reviewer Jennifer directly with an evidence package: IRS CP 575 + WA Certificate of Formation + D&B negative lookup screenshot + OpenCorporates positive lookup screenshot.
- **Why:** Persona uses commercial data brokers (D&B / LexisNexis) that lag IRS by 2–6 weeks. The state-level data was correct; only the broker sync was missing. Approval came in ~1 hour after the evidence email.
- **Lesson:** For any future young-EIN verification, skip Persona retries and go straight to manual review with multi-source evidence. **Don't waste cycles on the wizard.**

### June 5, 2026 — Standalone opt-in section added to consent.html
- **What:** Added `#opt-in-flow` anchor section to `public/consent.html` (and mirrored to frontdesk-ai), documenting the opt-in as a single customer-initiated phone call — NOT bundled with anything.
- **Why:** Huvi (Twilio Trust Hub) flagged that web-form-style opt-in language was a mismatch for our verbal/inbound-call basis. The standalone section makes the FCC "prior express invitation" + CTIA call-back exception explicit.
- **Cleared by:** Huvi, June 5.

### May 29, 2026 — Default auto-reply rewritten for carrier compliance (v0.2.7)
- **What:** Changed default `auto_reply_message` in `server/db/database.js` to: `Hi! This is {business_name} returning your missed call. Msg&data rates may apply, reply STOP to opt out or HELP for help. How can we help?`
- **Why:** Carriers (T-Mobile especially) auto-block messages from new numbers that lack branded sender ID, rate disclosure, or opt-out keyword on the very first message. Without this, every owner's account gets flagged before the first real conversation.
- **Knock-on:** Also added explicit anti-marketing rule to AI agent system prompt — "Never sign up the customer for marketing, newsletters, or anything they didn't ask for. They consented to a service reply only."
- **Side effect:** Existing seed/demo businesses need re-seeding to pick up the new template (open backlog item).

### May 27, 2026 — Sent.dm and Sendblue ruled out as Twilio alternates
- **What:** Evaluated Sent.dm and Sendblue. Both rejected.
- **Why:** Sent.dm still requires A2P 10DLC registration (no shortcut). Sendblue is iMessage-only and silently fails for Android callers — a deal-breaker because trades customers are heavily Android.
- **Revisit if:** Bandwidth.com or Telnyx come up as alternates (same A2P rails, sometimes faster vetting).

---

## Business Identity (May–June 2026)

### June 2, 2026 — WelcomeMat Digital LLC as holding company over Swoop
- **What:** Restructured so `welcomematdigital.com` is the parent identity, and `/swoop` is one product subpath. Privacy/Terms/Consent pages all live under `/swoop/` with footers linking back to the parent.
- **Why:** Twilio reviewers want to verify the business identity behind the SMS sender. A single product-as-domain looks like a hobby project. A clear LLC with multiple potential products under it looks like a real company.
- **Also enables:** Future products (FrontDesk AI is the next one) can live under the same identity without re-registering everything.

### June 1, 2026 — Single Google login for all third-party accounts
- **What:** Twilio, OpenAI, Render, GitHub, Cloudflare, Zoho — all use Google login with `sunil1308@gmail.com`. Never Microsoft.
- **Why:** Hard requirement that the business survives loss of Microsoft access. Microsoft email = work account, can be revoked at any time.
- **Verify state:** See [09_ONBOARDING.md](09_ONBOARDING.md) → Third-Party Account Verification.

---

## Architecture (March–May 2026)

### v0.2.6 — Persistent disk on Render
- **What:** Added 1 GB persistent disk at `/var/data`, `DB_PATH=/var/data/swoop.db` env var.
- **Why:** Render free tier wipes the ephemeral filesystem on every deploy. Without persistence, every push deleted the SQLite DB. Demo data became unreliable.
- **Cost:** Free (included with Render free tier).
- **Revisit:** If we hit 1 GB (would take ~1M messages — far away).

### v0.2.6 — Dashboard / Test Console split into tabs
- **What:** Dashboard view never shows the scenario picker. Test Console is on a separate tab, hidden by default.
- **Why:** Priya persona flagged that owners would click "Run scenario" and panic. Production view must look like production.
- **Gating:** `localStorage.swoop_dev_mode === 'true'` or URL flag `?dev=1`.

### v0.2.6 — Test data tagging (`is_test` column)
- **What:** Every row created by `/api/test/simulate` gets `is_test=1`. Dashboard stats, lead list, and admin metrics exclude these. Reset scenario wipes only `is_test=1` rows.
- **Why:** Morgan persona: "Real and fake leads must be distinguishable in an audit." This is a compliance hygiene requirement, not just a usability one.

### v0.2.5 — OpenAI gpt-4o-mini, 3-turn budget, graceful handoff
- **What:** AI agent runs for up to 3 turns per lead (configurable per business via `max_ai_turns`), then hands off to the human owner with a written summary. AI never sells or schedules — it qualifies.
- **Why:** Two failure modes to avoid: (a) AI hallucinates a quote or appointment, owner can't honor it; (b) AI loops forever, customer gives up. 3 turns is the sweet spot from manual testing.
- **Model choice:** gpt-4o-mini because cost-per-conversation is ~$0.001. gpt-4o was tested — quality difference not worth the ~50× cost at our scale.
- **Revisit:** When we have real customer feedback. May tune per-trade.

### v0.1 — SQLite via better-sqlite3
- **What:** Single-file SQLite, no Postgres, no managed DB service.
- **Why:** Simplest possible thing. Zero setup. File-backed. Survives a Render deploy via persistent disk. better-sqlite3 is synchronous which makes the code dramatically easier to read.
- **Revisit:** When concurrent writes become a bottleneck (~thousands of TPS — far away) or when we need multi-region replicas. Migrate to Postgres on Render or Turso.

### v0.1 — Vanilla HTML / no framework
- **What:** `public/index.html` and `public/admin.html` are single-file vanilla JS apps. No React, no Vue, no build step.
- **Why:** Solo founder. No tooling churn. AI assistants can read the whole UI in one tool call. Owners on phones get instant load.
- **Revisit:** When UI complexity demands componentization (likely v0.4+, owner-editable settings panel).

---

## Process

### June 2026 — Squad Review with 4 personas before every commit
- **What:** Codified in `.github/copilot-instructions.md`. Four personas — Ray (owner), Priya (success), Jordan (power user), Morgan (compliance) — must all 👍 (or 🤷 with rationale) before a feature ships.
- **Why:** Solo founder = no peer review. The Squad simulates one. Especially Morgan, because Twilio mistakes are expensive and slow to undo.
- **Backlog sync:** After every Squad Review, `BACKLOG.md` gets updated with any 👎 as a new item, any new risks as watch items, any "won't fix" as By-Design entries.

### June 2026 — Never auto-push to remote
- **What:** Changes are committed locally, user reviews on localhost, **then** they explicitly say "push it". `git commit + git push` is never combined.
- **Why:** Render auto-deploys from `main`. `git push` = instant production. A single typo can break the live site or, worse, break the Twilio-verified Privacy/Terms URL while a review is pending.

### June 2026 — Repo-local git committer email = personal Gmail
- **What:** Both `swoop` and `frontdesk-ai` repos have `git config user.email = sunil1308@gmail.com` set at repo level. Global config still uses Microsoft email for actual work repos.
- **Why:** All historical commits were authored as `Sunil Venugopal <sunilve@microsoft.com>`. From the date of this change forward, all new commits attribute to the personal Gmail and get GitHub's "Verified" badge.
- **Not done:** History rewrite. Force-pushing rewritten SHAs has bigger downsides than the cosmetic gain. Best time to revisit is right before investor diligence, if ever.

---

## Conscious Non-Decisions

A few things that look like decisions but are actually "we deferred this until evidence demands it":

| Question | Default | Trigger to revisit |
|---|---|---|
| Mobile app? | Web-only | 10+ paying customers asking for it |
| Multi-tenant white label? | No | Agency partner asks |
| Replace SQLite with Postgres? | No | Concurrent write bottleneck or multi-region |
| React/Vue/Next? | No | UI complexity demands it (probably v0.4+) |
| TypeScript? | No | Bug rate justifies the friction |
| Migrate off Render? | No | Cost or reliability issue |
| Move from OpenAI to Claude/local model? | No | Pricing change or specific quality win |
| Add tests? | Not yet | Before first paying customer (🔴 blocker) |
