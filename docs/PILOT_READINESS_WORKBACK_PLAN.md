# Swoop — Pilot Readiness Workback Plan

Captured August 24, 2026. A checklist across every workstream needed before, during, and after the pilot — not just the product build. See `PILOT_GAP_ANALYSIS.md` for the code-specific blockers this references.

**Not legal or tax advice** — items below flagged with ⚖️ should be confirmed with an actual attorney/accountant before acting.

---

## 0. Naming and brand risk — resolve first

- [ ] ⚖️ Get a real trademark check on "Swoop" (paid search or 30 min with a trademark attorney) — found competing product **Swoopd** (missed-call text-back for tradies, NZ/AU) and multiple active **SWOOP** trademark registrations in software/SaaS classes (e.g. SwoopMe Inc.)
- [ ] Decide: keep "Swoop" and accept the risk, or pick a new name before more brand equity is committed
- [ ] This decision blocks: domain purchase, A2P 10DLC brand registration, marketing materials, pilot-facing messaging

---

## 1. Legal / entity structure

- [ ] ⚖️ Confirm whether A2P 10DLC brand registration can use a DBA name, or must match the LLC's legal name exactly
- [ ] File a Washington state trade name (DBA) registration for the chosen product name under WelcomeMat Digital LLC, if operating as a distinct brand
- [ ] Confirm whether a business bank account/Stripe account needs to be under the DBA or is fine under WelcomeMat Digital LLC
- [ ] Revisit "does this need its own LLC" only if/when the product has real revenue or outside investment — not a pre-pilot blocker

## 2. Domain and hosting

- [ ] Finalize product name (see §0) before buying anything
- [ ] Decide: subdomain/path off welcomematdigital.com, or standalone domain
  - Leaning standalone: decouples from WelcomeMat's still-unresolved broader positioning; cheap (~$12-15/yr); cleaner for a focused product pitch
  - Can note "a WelcomeMat Digital product" in the footer either way, for credibility without subordination
- [ ] Register domain once name is locked
- [ ] Update the SMS opt-in Terms link (currently `welcomematdigital.com/swoop`) to match wherever this actually lives
- [ ] Point domain at existing Render hosting or migrate — confirm which

## 3. Marketing materials (pilot-scale, not full launch)

- [ ] One simple, honest landing page: what it does, who it's for, current status (pilot / not yet self-serve) — not a full marketing site
- [ ] One-page printable/PDF explainer for in-person and warm-intro pitches — matches how trust actually gets built (per Camellia), not cold digital marketing
- [ ] Terms of Service + Privacy Policy page (required for A2P 10DLC compliance regardless of scale)
- [ ] Hold off on paid ads, SEO content, or a full multi-page site — premature before pilot data exists

## 4. Pilot candidate recruitment

- [ ] List realistic first candidates — Camellia's network, personal contacts, Eastside/Sammamish local businesses
- [ ] Add a qualifying question when screening candidates: **what phone system does your business line run on** (standard cell/landline vs. VoIP like Google Voice/RingCentral/Grasshopper) — conditional forwarding works very differently on VoIP systems; screen this before committing an onboarding slot
- [ ] Target 3-5 businesses per the pilot plan already defined in `SWOOP_ONBOARDING_BRIEF.html`

## 5. Pilot feedback mechanism

- [ ] Simple running log (spreadsheet is fine) per business: date, channel, feedback given, action taken — don't over-build this
- [ ] First-few-days check-in (per business) — informal, high-touch
- [ ] Weekly check-in cadence — structured around the questions already listed in `PILOT_ONBOARDING_JOURNEY.md`
- [ ] **Add a mid-pilot (week 2) willingness-to-pay pulse check** — don't wait until week 4 to learn whether the value is landing; catch it early enough to adjust
- [ ] End-of-pilot structured exit conversation — decide continue/adjust/stop per business

## 6. Internal operational tracking (you + Claude, not owner-facing)

- [ ] Start with a spreadsheet, not custom software — one row per pilot business, columns for: onboarding stage, activation test results (per the 11 scenarios), current status (testing / live / paused), last check-in date, open issues, notes
- [ ] This is distinct from both `admin.html` (business config tool) and the owner dashboard (business-facing) — purely internal, for catching problems before an owner has to report them
- [ ] Revisit whether this needs to become real software only if/when pilot scale outgrows a spreadsheet

## 7. Product build sequence (from `PILOT_GAP_ANALYSIS.md`)

- [ ] Auth + business-level isolation (combined build — highest priority, live data-exposure issue today)
- [ ] Owner notifications (wiring existing pieces together)
- [ ] Production forwarding mode + duplicate-event protection (same webhook code, do together)
- [ ] ON/OFF control (once the pipeline it gates exists)
- [ ] Emergency escalation — **product decision needed first** (severity tiers, exact caller-facing wording, notification method) before this goes back to Claude Code

## 8. Compliance (already partially tracked in repo, listed here for visibility)

- [ ] A2P 10DLC brand + campaign registration (in progress per `BACKLOG.md`)
- [ ] Per-business local number provisioning (manual for pilot scale — fine)
- [ ] STOP/START/HELP automated test coverage
- [ ] Per-carrier conditional-forwarding validation, done live with each pilot business during activation

---

## Suggested order of operations

1. Resolve naming (§0) — blocks domain, compliance registration, and materials
2. Legal/DBA filing (§1) in parallel — doesn't block anything else, just needs to happen
3. Domain + minimal landing page (§2, §3) once name is locked
4. Product build sequence (§7) — this is the longest pole, start now regardless of naming
5. Pilot candidate list + screening (§4) — can happen in parallel with the build
6. Feedback mechanism + internal tracker (§5, §6) — lightweight, set up just before first business goes live, not before
