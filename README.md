# Wayfound

AI-powered itinerary planner for Hyderabad. Tell it your group size, age, vibe and budget — it plans your whole outing with real venues, timings and cost breakdown.

## Stack

- React + TypeScript + Vite
- Groq AI (llama-3.1-8b-instant) for itinerary generation
- Google Places API for venue lookup
- Smart mock engine as fallback (200+ verified Hyderabad places)

## Run locally

```bash
pnpm install
pnpm dev
```

Add a `.env` file:

```
VITE_GROQ_KEY=your_groq_key
VITE_GOOGLE_MAPS_API_KEY=your_maps_key
```

## Live

[wayfound-five.vercel.app](https://wayfound-five.vercel.app)
