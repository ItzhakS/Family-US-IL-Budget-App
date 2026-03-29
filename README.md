# Family US-IL Budget App

This project was initially started in Google AI Studio.
As the app grew in complexity, development moved out of AI Studio because the AI workflow could not reliably handle the larger scope.

The app is now managed in Cursor and deployed on Vercel.

## Supabase Keep-Alive (Free Tier)

Supabase pauses free projects after 7 days of inactivity. To prevent this:

1. **Vercel Cron** (built-in): Runs daily at ~12:00 UTC. Verify in Vercel Dashboard → your project → **Settings** → **Cron Jobs** → **View Logs** for `/api/keep-alive`.

2. **External backup** (recommended): Use [cron-job.org](https://cron-job.org) — create a free job that GETs `https://YOUR_APP.vercel.app/api/keep-alive` every 5 days. More reliable than Vercel Cron on Hobby (which runs only once/day and can be imprecise).

Original AI Studio project: https://ai.studio/apps/drive/13v0V7Ek6fnDBb_DfKsNv14MowVTrVyeK

## Run Locally

**Prerequisites:**  Node.js

