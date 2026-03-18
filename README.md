# Local Side Quest — AI Travel Planner

## How it works

```
User's browser  →  /api/generate (your Vercel server)  →  OpenAI GPT-4o
  (no secrets)       (holds OPENAI_API_KEY secretly)       (generates itinerary)
```

The frontend sends a prompt to YOUR server. Your server adds the API key and forwards to OpenAI. The key never reaches the browser.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Create `.env.local`
```bash
cp .env.example .env.local
```
Then add your OpenAI API key:
```
OPENAI_API_KEY=sk-your-key-here
```
Get a key at: https://platform.openai.com/api-keys

### 3. Run locally
```bash
npm run dev
```
Open http://localhost:3000

### 4. Deploy to Vercel
```bash
npx vercel
```
Or push to GitHub and connect the repo in Vercel dashboard.

**Important:** In Vercel Dashboard → Settings → Environment Variables, add:
- `OPENAI_API_KEY` = your key

## Project structure

```
app/
  page.tsx           ← Main app (client component)
  layout.tsx         ← Root layout with metadata
  api/
    generate/
      route.ts       ← API route (server-side, holds API key)
lib/
  knowledge-packs.ts ← Bangkok, Tokyo, Paris curated data
  build-prompt.ts    ← Prompt builder utility
```

## Costs

GPT-4o pricing (as of 2025):
- ~$2.50 per million input tokens
- ~$10 per million output tokens
- Each itinerary generation costs roughly **$0.02-0.05**
- 1,000 generations ≈ $20-50

## Adding more cities

Edit `lib/knowledge-packs.ts` and add a new entry to the `KNOWLEDGE_PACKS` object. Follow the Bangkok/Tokyo/Paris pattern.
