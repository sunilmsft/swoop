# Swoop 🦅

**Never miss a lead again.** AI-powered missed call text-back for small businesses.

A plumber is under a sink. Phone rings. Can't answer. Customer calls a competitor. That's $300 gone — and it happens 3–5 times a week.

**Swoop fixes this.** Missed call → instant text in 5 seconds → follow-up sequence → Google review request. All automated. $79–$149/mo.

---

## How It Works

```
Customer calls → You miss it → Swoop texts them in 5 seconds
  ↓
"Hey! Sorry we missed your call. What do you need help with?"
  ↓
Customer replies → Logged as a lead → Follow-up sequence starts
  ↓
Day 1: "Still need help? We have openings tomorrow."
Day 3: "Want us to schedule a visit?"
Day 7: "Last chance — reply anytime!"
  ↓
Job done → Auto Google review request ⭐
```

## v1 Features

- **Missed call text-back** — Auto SMS within seconds via Twilio
- **Lead logging** — Every caller becomes a contact in your database
- **Follow-up sequence** — Day 1, 3, 7 automatic texts (cancelled if they reply)
- **Review requests** — One-click Google review text after a job
- **Live dashboard** — See all leads, messages, and stats in real time

## Tech Stack

- **Backend:** Node.js + Express
- **SMS/Voice:** Twilio
- **Database:** SQLite (via better-sqlite3) — zero setup, file-based
- **Cron:** node-cron for follow-up scheduling
- **Dashboard:** Single HTML file (no framework)
- **Hosting:** Render free tier

## Quick Start

```bash
# Clone & install
git clone https://github.com/sunilmsft/swoop.git
cd swoop
npm install

# Configure
cp .env.example .env
# Edit .env with your Twilio credentials

# Run
npm run dev

# Open http://localhost:3000
```

## Twilio Setup

1. Create a [Twilio account](https://www.twilio.com/try-twilio) (free trial gives you $15)
2. Buy a phone number (~$1/mo)
3. In the phone number settings, set:
   - **Voice webhook:** `https://your-app.onrender.com/webhooks/voice` (POST)
   - **Voice status callback:** `https://your-app.onrender.com/webhooks/voice-status` (POST)
   - **SMS webhook:** `https://your-app.onrender.com/webhooks/sms` (POST)

## Local Testing Without Hitting Twilio

You can fully test dashboard and workflow behavior without sending real SMS.

1. In `.env`, set `TWILIO_MOCK_MODE=true`
2. Run `npm run dev`
3. Trigger sample events:

```bash
# Simulate a missed call that should auto-text and create/update a lead
curl -s -X POST http://localhost:3000/webhooks/voice-dial-result -d "DialCallStatus=no-answer&DialCallDuration=0&From=%2B14255551234&To=%2B18337830902"

# Simulate inbound STOP/START/HELP behavior
curl -s -X POST http://localhost:3000/webhooks/sms -d "From=%2B14255551234&To=%2B18337830902&Body=STOP"
curl -s -X POST http://localhost:3000/webhooks/sms -d "From=%2B14255551234&To=%2B18337830902&Body=START"
curl -s -X POST http://localhost:3000/webhooks/sms -d "From=%2B14255551234&To=%2B18337830902&Body=HELP"
```

All sends are logged as `MOCK SMS` in server logs and still flow through lead/message/follow-up logic.

## Deploy to Render (Free)

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add environment variables from `.env.example`
6. Deploy!

## Project Structure

```
swoop/
├── server/
│   ├── index.js           # Express server + cron
│   ├── db/
│   │   └── database.js    # SQLite schema + connection
│   ├── routes/
│   │   ├── webhooks.js    # Twilio voice + SMS handlers
│   │   └── api.js         # REST API for dashboard
│   └── services/
│       ├── twilio.js      # Twilio client + request validation
│       └── leads.js       # Lead management + follow-up logic
├── public/
│   └── index.html         # Dashboard UI
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## What's Next

- **v2 — Close the lead:** AI two-way text conversations (quotes, booking, Q&A)
- **v3 — Keep the customer:** Warranty reminders, service nudges, lifecycle automation

---

Built by Sunil & Tim · Seattle, WA
