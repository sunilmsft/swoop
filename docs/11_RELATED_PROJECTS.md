# 11 — Related Projects

> Other repos and assets that touch this project's surface area. If you change Swoop's compliance surface, you almost certainly also need to change something in `frontdesk-ai`.

---

## `frontdesk-ai` — The Twin Repo You Will Edit Constantly

- **Local path:** `C:\Users\sunilve\OneDrive\GitHub Copilot Fun Projects\frontdesk-ai`
- **GitHub:** `github.com/sunilmsft/frontdesk-ai`
- **Production:** Render → custom domain **welcomematdigital.com**
- **Auto-deploy:** push to `main` → Render redeploys
- **Stack:** Same as Swoop (Node + Express + static HTML), separate Render service

### Why it matters for Swoop
1. **It hosts the Twilio-facing compliance pages.** Twilio reviewers fetch:
   - `welcomematdigital.com/swoop/consent.html`
   - `welcomematdigital.com/swoop/privacy.html`
   - `welcomematdigital.com/swoop/terms.html`
   - `welcomematdigital.com/swoop/index.html`
   These pages live in `frontdesk-ai/public/swoop/*.html`, NOT in this swoop repo.
2. **It is the parent brand identity.** WelcomeMat Digital LLC is the legal entity. Swoop is one product under it. FrontDesk AI is another. Both products link back to `welcomematdigital.com` as the home identity Twilio can verify.
3. **It's a separate product on its own.** FrontDesk AI is an AI chat widget for local businesses. Different problem, different sales motion, same legal entity, same compliance pipeline.

### What lives where (memorize the mirror pairs)

| In this repo (`swoop/`) | In `frontdesk-ai/` | Notes |
|---|---|---|
| `public/consent.html` | `public/swoop/consent.html` | Both must stay in sync — Twilio fetches the frontdesk-ai version |
| (none — privacy is in frontdesk-ai only) | `public/swoop/privacy.html` | Twilio Privacy Policy URL |
| (none — terms is in frontdesk-ai only) | `public/swoop/terms.html` | Twilio Terms & Conditions URL |
| `public/landing.html` (legacy, pre-LLC) | `public/swoop/index.html` | Public-facing product page |

### Critical operating rule
**When you edit `public/consent.html` here, also edit `frontdesk-ai/public/swoop/consent.html`.** They drift apart easily. We've been bitten by Twilio reviewers fetching a stale page while the local version was updated.

### FrontDesk AI's own status (June 2026)
- Deployed at https://welcomematdigital.com
- Pricing: $59/mo flat + $149/$299 one-time setup
- Phase 1 pitch.html refresh shipped May 22
- See FrontDesk AI repo for its own backlog and roadmap

---

## GitHub Pages Mirror

- **URL:** https://sunilmsft.github.io/swoop/
- **Source:** Deployed from `main` branch of this swoop repo
- **What's there:** `PLAYBOOK.html`, `OUTREACH_PLAYBOOK.html`, `consent.html`, `landing.html`
- **Why it exists:** Originally created (May 26, 2026 commit `1ce8cb1`) as an always-on static URL for Twilio reviewer-fetched assets, because Render free-tier cold starts could cause validation timeouts on the first hit
- **Current role:** Largely superseded by `welcomematdigital.com` (which has its own Render app that warms separately). The Pages URL is still in some Twilio bundle records — see [12_TWILIO_VERIFICATION_HISTORY.md](12_TWILIO_VERIFICATION_HISTORY.md) for which bundles point to which URLs.
- **Watch item:** If we ever rename the `sunilmsft` GitHub username (e.g. to `welcomematdigital`), the Pages URL changes. GitHub auto-301s the old URL, but Twilio bundles need explicit updates.

---

## OneDrive: WelcomeMat Digital folder

- **Path:** `OneDrive/WelcomeMat Digital/`
- **Contents:**
  - IRS CP 575 (EIN issuance PDF)
  - WA Certificate of Formation (WA SOS-issued PDF)
  - WA Business License Confirmation `0-052-653-982-2026-06-02.pdf`
  - Identity Snapshot HTML (current state of business identity, periodically updated)
  - Various Twilio submission screenshots and evidence packages

These are referenced in `BACKLOG.md` and Twilio submissions. They are NOT in source control (and shouldn't be — they contain personal info).

**Risk:** If OneDrive is corporate-tied and access is revoked, these vanish from the local machine. The IRS, WA SOS, and Twilio can all re-issue or re-fetch on request, but it's friction. Mirror these to a non-Microsoft location (Mercury vault, Google Drive on personal account, or external drive).

---

## Sister Projects Owned by the Same Founder

Not directly connected, but share infrastructure (Google login, same person, sometimes the same domain DNS provider).

| Project | What it is | Workspace |
|---|---|---|
| **FrontDesk AI** | AI chat widget for local businesses ($59/mo flat) | sibling repo — see above |
| **Tuck** | Capture/organize PWA | separate repo |
| **Kolo** | Family accountability PWA | separate repo (formerly "Loopi") |
| **HomeOps Hub** | Household dashboard | separate repo |
| **Project Cushion** | Expense analyzer | separate repo |
| **sunilvenugopal.com** | Personal site | separate repo |
| **subscriptions.html** | Personal subscription tracker | `GitHub Copilot Fun Projects/subscriptions.html` |

When Swoop adds a new paid service / domain / API key, add it to `subscriptions.html` (data lives in `localStorage` key `sub-tracker-v1`).

---

## External Services Map

```
welcomematdigital.com (Cloudflare DNS)
├── Apex / www       → Render: frontdesk-ai service (welcomematdigital.com)
│                       └── serves /swoop/{consent,privacy,terms,index}.html
├── MX records       → Zoho Mail (hello@, privacy@)
└── (nothing yet)    → Render: swoop service (swoop-x79g.onrender.com)
                        └── Will eventually move to welcomematdigital.com/swoop/app
                            once auth is built (N-10 in 10_NEXT_STEPS.md)

sunilmsft.github.io/swoop/ (GitHub Pages)
└── Mirrored docs: PLAYBOOK, OUTREACH_PLAYBOOK, consent, landing
    Used historically for Twilio compliance URLs; now mostly superseded

console.twilio.com (Twilio account)
├── Number: +1 (833) 783-0902 (toll-free, TFV in progress)
├── Trust Hub: Business Profile BUf71fa573b0fd6173b0cc31daba2ba41b (Approved)
├── Trust Hub: TFV ticket 27236005 (Appeal opened June 17 after Round 3 rejection; awaiting toll-free team)
└── Compliance URLs registered: welcomematdigital.com/swoop/{consent,privacy,terms}.html

platform.openai.com (OpenAI account)
└── API key used by services/ai-agent.js
    Model: gpt-4o-mini

mercury.com (banking)
└── WelcomeMat Digital LLC business account + IO credit card

ccfs.sos.wa.gov + business.wa.gov (state government)
└── LLC + WA Business License records
    Annual Report due June 30, 2027 (HARD deadline ~$70)
```

---

## A Word About `frontdesk-ai` Drift

This has bitten me three times. Symptoms and fix:

| Symptom | Likely cause | Fix |
|---|---|---|
| Twilio reviewer cites "missing X" but I just added X | Edited swoop's `public/consent.html`, forgot frontdesk-ai mirror | Mirror the change, push frontdesk-ai, wait for Render redeploy, ask reviewer to re-fetch |
| Live consent page looks old after edit | Same as above OR Render still rebuilding | Check `dashboard.render.com` → frontdesk-ai → Events |
| Different consent text on `/consent` vs `welcomematdigital.com/swoop/consent.html` | Two separate files, diverged | Pick the canonical version (frontdesk-ai), copy back to swoop |

Long-term fix is documented as KI-20 in [07_KNOWN_ISSUES.md](07_KNOWN_ISSUES.md): collapse to a single source of truth or add a pre-commit hook that warns on drift.
