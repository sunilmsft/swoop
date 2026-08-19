# 10 — Next Steps

> Prioritized, time-bounded, with success criteria. Pick the next thing in order unless circumstances change.

---

## Now (after the August 19, 2026 demo milestone)

### N-1. Implement forwarded-call production mode (🔴 blocker)
- **Why:** The direct demo call works, but a customer's existing number should forward only unanswered calls to Twilio. Twilio must send the SMS and end the call without ringing the owner again or repeating a long disclosure.
- **How:** Add a per-business call mode; capture/test Twilio forwarded-call metadata such as `ForwardedFrom`; use an explicit mode as fallback; skip `<Dial>` for forwarded calls; send one SMS and log one call event.
- **Success:** Business number rings normally, unanswered call reaches Twilio, caller hears a short response or clean hangup, exactly one SMS is sent, and the owner does not receive a second call.

### N-2. Validate the live runtime and AI reply path
- **Why:** Current testing surfaced intermittent 401 key failures; fallback response now prevents silence but AI should be restored for pilot quality.
- **How:** Update `OPENAI_API_KEY` in Render, redeploy, send customer-style inbound text, verify AI-generated reply appears in logs/messages.
- **Success:** Two-turn conversation works with AI on primary path (fallback only used on exception).

### N-3. Start A2P 10DLC brand + campaign registration
- **Why:** Toll-free is now approved for demo/testing, but production customer onboarding requires local numbers + 10DLC.
- **How:** Twilio Console → Messaging → Regulatory Compliance → A2P 10DLC: brand registration, then shared campaign for missed-call response.
- **Success:** Brand and campaign approved and ready for per-customer number attachment.

### N-4. Fix toll-free caller reputation for demos
- **Why:** A tester's phone flagged the `833` demo number as possible fraud and disconnected the call.
- **How:** Open a Twilio caller-ID reputation request and submit correction requests to the relevant carrier/reputation providers. Keep production positioning on local customer numbers.
- **Success:** Test phones no longer show the warning, or the demo process clearly uses a different verified local number.

### N-5. Implement landline/non-textable fallback
- **Why:** Home phone callers may not be SMS reachable; current flow needs callback routing when SMS is not viable.
- **How:** Twilio Lookup line-type check before first SMS; if landline/non-textable, create callback-needed lead state and owner alert.
- **Success:** Non-textable callers are never dropped; owner gets clear callback action.

### N-6. Repo hygiene — move out of OneDrive (recommended)
- **Why:** Repo lives in OneDrive sync folder. If OneDrive is corporate-tied, `.env` with live secrets is in M365 cloud.
- **How:** `git clone https://github.com/sunilmsft/swoop.git C:\dev\swoop`, copy `.env`, point VS Code there, delete the OneDrive copy.
- **Success:** New working tree under `C:\dev\swoop`, `.env` no longer sync'd anywhere.

---

## Soon (within 2 weeks of TFV approval)

### N-4. Add automated compliance tests (KI-1, 🔴 Blocker)
- **Why:** Morgan persona has flagged this as a blocker before first paying customer. A future code change could silently break opt-out and we wouldn't notice.
- **How:** Use `node:test` (built-in, no dep). 10–15 tests covering: STOP/STOPALL/UNSUBSCRIBE → opt_out=1, START → opt_out=0, HELP → reply with privacy URL, send blocked on opt_out across all 4 paths (auto-reply, AI reply, follow-up, review).
- **Success:** `npm test` runs, all tests pass, GitHub Action runs them on PR.

### N-5. Build magic-link auth (KI-2, 🔴 Blocker)
- **Why:** THE biggest blocker before onboarding a real customer. Today's URLs expose all leads to anyone who knows them.
- **How (minimum viable):**
  1. Owner enters phone or email at `/login`
  2. Server generates one-time link, sends via SMS (existing Twilio path) or email (need to wire SMTP)
  3. Link sets a signed cookie (JWT or sealed session), valid 30 days
  4. All `/api/leads/*` and `/api/businesses/*` queries get scoped by `business_id` from the session
  5. Admin gate: `/admin*` requires a known operator email
- **Success:** Visit `/` without a session → redirected to login. Two businesses' owners cannot see each other's leads.

### N-6. A2P 10DLC brand + campaign registration (🔴 Blocker)
- **Why:** Toll-free is for demo only (decided June 13). Customers need local numbers in their own area code, which requires 10DLC vetting.
- **How:**
  1. Twilio Console → Messaging → Regulatory Compliance → A2P 10DLC
  2. Register WelcomeMat Digital LLC as the Brand (~$4 vetting fee)
  3. Create a single shared "Missed-Call Response" campaign (~$10/mo)
  4. Wire campaign attachment into the future customer-provisioning flow
- **Success:** Brand approved, campaign approved, ready to attach customer numbers.

### N-7. Per-customer local number provisioning (🔴 Blocker)
- **Why:** Onboarding can't happen until each customer has their own local number.
- **How:**
  1. Add to `admin.html` Add Business form: area code selector
  2. On submit, call Twilio `/AvailablePhoneNumbers/{country}/Local` to find a number
  3. Buy the number programmatically
  4. Attach to 10DLC campaign
  5. Set webhooks to point at our endpoints
  6. Store number in the `businesses.phone` column
- **Success:** Adding a new business in `/admin` provisions a real Twilio number end-to-end in <60 seconds.

---

## Then (founding cohort)

### N-8. Founding 5 outreach
- **Why:** First 5 free for 30 days, $19/mo locked in for life if they stay. Marketing learning beats marketing perfection.
- **How:** NextDoor + local FB trade groups. Use the outreach generator in `OUTREACH_PLAYBOOK.html`. Marketing copy guardrails (Morgan): "we text people who already called you" never "we'll text your customers".
- **Cap:** 5 concurrent onboardings. Priya: solo founder can't safely onboard 10 at once.
- **Success:** 5 paying or paying-after-trial customers using the product weekly.

### N-9. Owner alerts (🟡 High)
- **Why:** Today, the only way an owner knows a lead hit "Needs Attention" is by opening the dashboard. Ray persona will not do this reliably.
- **How:** When a lead transitions to `needs_attention`, send the owner an SMS at their `forward_phone` with a short brief + a link to the lead.
- **Success:** Owner sees notification on their phone within seconds of handoff.

### N-10. Lift the auth blocker on demo URL
- **Why:** With auth shipped, point a friendly URL at production. `welcomematdigital.com/swoop/app` for owners, `welcomematdigital.com/swoop/admin` for me.
- **How:** Subpath routing via Cloudflare worker, or move the Swoop app under a `/swoop/*` route within the frontdesk-ai express server. Avoid serving two separate Render apps.
- **Success:** No customer ever sees `swoop-x79g.onrender.com`.

---

## Later (post first revenue)

### N-11. Stripe billing (🟡 High)
- **Why:** Need to actually charge.
- **How:** Stripe Checkout for plan selection. Webhook to update `businesses.subscription_status`. Self-service upgrade/downgrade.
- **Success:** First $29 charged to first customer.

### N-12. Owner-editable settings panel (🟡 High)
- **Why:** True self-service. Today, editing a business requires SQL.
- **Scope:** name/services/hours/pricing, AI on-off + tone + max_turns, FAQs, never_say, auto_reply_message (with the validator from KI-13).
- **Success:** Owner can open `/settings`, edit any field, hit save, see the change live.

### N-13. ROI dashboard (🟡 High, Jordan)
- **Why:** Competitors all show "we saved you $X". Owners need to see the ROI to justify the bill.
- **Scope:** "Swoop captured X leads worth ~$Y this month" with the $ figure auto-estimated from configured average-job-value per business.
- **Success:** Visible on dashboard top card. Defensible math (we know lead counts; the $ figure is owner-input × multiplier).

### N-14. Operational hardening
- **Why:** Once we have real customer money on the line.
- **What:** Sentry error monitoring, structured JSON logging, DB backup cron, Render paid tier ($7/mo) to kill cold-starts.

---

## Strategic Decisions Coming Up (don't decide now, decide when triggered)

| Decision | Trigger to decide |
|---|---|
| Should we bundle with FrontDesk AI at $99/$149? | When Handraiser becomes a frequent objection in sales |
| Migrate SQLite → Postgres? | When concurrent writes become a bottleneck (~thousands TPS — far away) |
| Introduce a UI framework? | When settings panel + owner editing become unwieldy in vanilla |
| Hire a part-time engineer? | When solo work becomes the bottleneck (probably ~15 paying customers) |
| Pursue agency/reseller program? | When inbound asks for white-label cross 3+ |

---

## The Failure-Mode Checklist (run monthly)

- [ ] Are all third-party accounts still accessible? (See [09_ONBOARDING.md](09_ONBOARDING.md) Phase 2)
- [ ] Are API keys overdue for rotation? (Twilio + OpenAI — rotate every 90 days)
- [ ] Is Render auto-deploy still working? (`git push` → see Render Events tab)
- [ ] Are calendar reminders still set for WA Annual Report (June 30, 2027)?
- [ ] Has any compliance URL drifted between this repo and `frontdesk-ai`?
- [ ] Is `BACKLOG.md` current?
