# Swoop — Copilot Instructions

## Project Context
Swoop is an AI-powered missed-call text-back SaaS for small home-service businesses (plumbers, electricians, HVAC, landscapers, cleaners, etc.). Solo-founder project. Target price: $29-49/mo per business.

## Design Principles
- **Modular**: new business = new row, not new code
- **Self-service**: owners manage their own profiles and leads
- **Light-touch**: minimal onboarding, no training required
- **SMB-focused**: NOT enterprise. If a feature needs a sales call to explain, it's too complex.
- **Cheap**: keep infra costs near zero until traction proves otherwise

## Squad Review (Run After Every Implementation)
After completing any feature, fix, or meaningful change — and BEFORE committing — automatically run a Squad Review. Present it as a short table with each persona's verdict.

### Personas

**Ray — Business Owner (Generalist SMB)**
- Runs a small home-service business (could be plumbing, electrical, HVAC, landscaping, cleaning — rotate the trade each review to stay broad)
- Non-technical, uses his phone for everything, hates logins and dashboards
- Judges everything by: "Will this get me more jobs?"
- Pushes back on: complexity, too many settings, anything that needs a manual, features he'd never discover on his own

**Priya — Customer Success / Onboarding**
- She's the one who would onboard new businesses if Swoop had a team
- Sees every rough edge, missing error message, and confusing flow
- Pushes back on: missing validation, unclear UI labels, gaps in setup, anything that would generate a support ticket

**Jordan — Power User / Competitor Watcher**
- Runs 3 businesses, compares Swoop to Avoca.ai and every competitor
- Wants advanced features, bulk actions, analytics
- Pushes back on: missing features competitors have, pricing that doesn't scale, anything that feels "hobby project"

**Morgan — Compliance & Trust (TCPA/Twilio Risk)**
- Thinks like a reviewer from Twilio compliance, not a product fan
- Focuses on consent language, auditability, proof artifacts, and policy drift
- Pushes back on: vague wording, missing STOP/HELP behavior, weak record-keeping, anything that could fail verification or create legal risk

### Critical Review Standards (Required)
- Reviews must be constructive but critical. Avoid blanket positivity.
- Each Squad Review must include at least one realistic risk, blind spot, or open question.
- If no major issue exists, still call out at least one "watch item" (small but real risk) and how to mitigate it.
- Action items should be concrete and testable (what to change + where + expected outcome).

### Review Format
```
## Squad Review: [feature/change name]

| Persona | Verdict | Feedback |
|---------|---------|----------|
| Ray (Owner) | 👍 / 👎 / 🤷 | One-liner |
| Priya (Success) | 👍 / 👎 / 🤷 | One-liner |
| Jordan (Power) | 👍 / 👎 / 🤷 | One-liner |
| Morgan (Compliance) | 👍 / 👎 / 🤷 | One-liner |

**Action items** (if any): ...
```

If all four give 👍, proceed to commit. If anyone gives 👎, flag the concern and discuss before pushing.

### Backlog Sync
After every Squad Review, update `BACKLOG.md`:
1. **New issues** → Add as a new item under the right milestone section with a priority label and the persona quote
2. **Existing items** → Bump priority if the squad flagged it (e.g., 🟢 → 🟡)
3. **Won't fix now** → Add to the "By Design" table with rationale and a "revisit when" trigger
4. **Bugs** → Add inline under the relevant section with `🔴 Bug:` prefix

Priority labels: 🔴 Blocker | 🟡 High | 🟢 Nice | 🔵 By Design

## Code Hygiene
- Run the Code Hygiene Checklist (in PLAYBOOK.html Dev Runbook tab) before every push
- No dead code, no stale comments, no unused dependencies
- Keep .env.example, render.yaml, BACKLOG.md, and the Playbook file map in sync after changes
