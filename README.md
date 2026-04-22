# Job Assistant — Local Setup Guide

A personal AI job search tool. Phase 1–3 complete.

## What's included
- **CV Tailor** — upload your CV, paste a job description, get a tailored CV, cover letter, Q&A answers and fit score
- **Board** — Kanban tracker (drag between Applied → Interview → Offer → Rejected)
- **Analytics** — weekly activity chart, response rate by role type, activity heatmap, insights
- **CV Tracker** — which CV version gets the most responses, time-to-response by company
- **Weekly Digest** — AI-generated weekly summary with action plan

## Setup (2 minutes)

### Step 1 — Get an API key
1. Go to https://console.anthropic.com
2. Sign up or log in
3. Go to API Keys → Create Key
4. Copy the key (starts with `sk-ant-...`)

### Step 2 — Add your key
1. Copy the example file: `cp js/secrets.local.example.js js/secrets.local.js`
2. Open `js/secrets.local.js` and replace `sk-ant-api03-YOUR_KEY_HERE` with your real key from Anthropic.

`js/secrets.local.js` is listed in `.gitignore` so it is not committed. If you ever pasted a key into `js/app.js` in an old version, rotate that key in the Anthropic console and use the new key only in `secrets.local.js`.

### Step 3 — Run it

**Option A — Simplest (Python, no install needed)**
```bash
cd job-assistant
python3 -m http.server 3000
```
Then open http://localhost:3000

**Option B — Node.js**
```bash
npm install -g serve
cd job-assistant
serve .
```
Then open http://localhost:3000

**Option C — VS Code**
Install the "Live Server" extension, right-click index.html → Open with Live Server

> ⚠️  Do NOT open index.html directly as a file (file://) — the browser will block API calls.
> Always use a local server (http://localhost).

## File structure
```
job-assistant/
├── index.html          — app shell and sidebar
├── css/
│   └── style.css       — all styles
├── js/
│   ├── storage.js      — localStorage wrapper
│   ├── data.js         — shared job data and helpers
│   ├── tailor.js       — Phase 1: CV tailor
│   ├── app.js          — router + Board + Analytics + CV Tracker + Digest
└── README.md
```

## Data
All your data is stored in your browser's localStorage — nothing is sent anywhere except to the Anthropic API for AI generation. Clear your browser data to reset.

## Coming next (Phase 4+)
- Job discovery — search and match roles automatically
- Interview prep — AI generates likely questions per role
- Auto-fill — browser extension to fill application forms
- Mobile app

## Cost
Anthropic API calls cost roughly $0.003–0.005 per generation (tailored CV + cover letter). At 5 applications/day that's under $1/month.
