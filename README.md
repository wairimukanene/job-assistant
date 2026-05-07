# Apply Pilot — Local Setup Guide

Apply Pilot is an AI job search copilot. Phases 1-6 are implemented in the current build, with Phase 7 (Product and Monetisation) planned next.

## Current product status

### Phase 1 — CV Tailor
- Upload or paste CV text
- Paste JD or job URL
- Generate tailored CV, cover letter, Q&A and fit analysis

### Phase 2 — Application Tracker
- Kanban board with drag/drop stages
- Manual and auto-filled application tracking

### Phase 3 — Intelligence
- Response-rate and activity analytics
- CV version tracking and weekly digest

### Phase 4 — Job Discovery
- Multi-source role search by title/location
- CV-aware ranking and eligibility labels
- Save roles directly to board

### Phase 5 — Interview Prep
- Likely interview questions per role
- Practice answer feedback
- Competency-based question bank
- Salary negotiation scripts

### Phase 6 — Auto-Apply
- Browser extension scaffold for form reading and preview autofill
- Review queue (approve/reject before tracking)
- Direct extension-to-app draft sync via API bridge

## Setup (2 minutes)

### Step 1 — Get an API key
1. Go to https://console.anthropic.com
2. Sign up or log in
3. Go to API Keys → Create Key
4. Copy the key (starts with `sk-ant-...`)

### Step 2 — Add your key
1. Copy the example file: `cp .env.local.example .env.local`
2. Open `.env.local` and replace `sk-ant-api03-YOUR_KEY_HERE` with your real key from Anthropic.

`.env.local` is listed in `.gitignore` so it is not committed.

### Step 3 — Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## File structure
```
job-assistant/
├── index.html          — app shell and sidebar
├── extension/          — Chrome extension scaffold for Phase 6
├── css/
│   └── style.css       — all styles
├── js/
│   ├── storage.js      — localStorage wrapper
│   ├── data.js         — shared job data and helpers
│   ├── tailor.js       — Phase 1: CV tailor
│   ├── discovery.js    — Phase 4: job discovery
│   ├── interview.js    — Phase 5: interview prep
│   ├── autoapply.js    — Phase 6: review queue
│   ├── app.js          — router + module bootstrapping
├── app/api/            — Next.js API routes (Anthropic, jobs search, auto-apply bridge)
└── README.md
```

## Data and privacy
- Core app data currently uses browser localStorage.
- AI generation requests are proxied through server API routes to Anthropic.
- Auto-apply bridge queue is short-lived in server memory before sync into local review queue.
- Nothing is auto-submitted to job sites.

## Next (Phase 7 — Product and Monetisation)
- User accounts + cloud sync (moving beyond localStorage)
- Landing page + waitlist
- Stripe + M-Pesa payment integration
- B2B dashboard for coaches (multi-candidate management)
- Coach analytics (response rates, placement rates)
- Mobile app (React Native)

## Cost
Anthropic API calls cost roughly $0.003–0.005 per generation (tailored CV + cover letter). At 5 applications/day that's under $1/month.
