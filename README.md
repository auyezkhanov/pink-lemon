# Pink Lemon

Creative-direction studio site: static frontend + a small Node.js backend
(built-in `node:sqlite`, zero npm dependencies) that stores form submissions
("заявки") and serves them through a password-gated `/admin` dashboard.

## Run locally

```
node backend/server.js
```

Then open:
- Site: http://localhost:3000/
- Admin: http://localhost:3000/admin (key: `pinklemon-admin`, or whatever you set via `ADMIN_KEY`)

Change the port or admin key with environment variables:
```
PORT=3001 ADMIN_KEY=something-only-you-know node backend/server.js
```

## Push to GitHub (needed before either deploy below)

```
git remote add origin https://github.com/<your-username>/pink-lemon.git
git branch -M main
git push -u origin main
```

## Deploy option A — everything on Render (simplest, one host)

1. On [render.com](https://render.com) → **New +** → **Web Service** → connect the repo.
2. Render detects the `Dockerfile` automatically — leave the defaults, just set:
   - **Instance type:** Free
   - **Environment variable:** `ADMIN_KEY` = a real secret (don't keep the default in production)
3. Deploy. You'll get a URL like `https://pink-lemon-xxxx.onrender.com` — site, API and `/admin` all live there.

## Deploy option B — static frontend on Vercel + backend on Render

Vercel only serves static files / serverless functions — it can't run the
persistent Node server or keep the SQLite file, so the backend has to live
somewhere else. This repo is already set up for that split:

1. **Backend first, on Render** — same as option A steps 1–3 above. Copy the
   resulting URL (e.g. `https://pink-lemon-xxxx.onrender.com`).
2. **Point the frontend at it** — edit `assets/js/config.js`:
   ```js
   window.PL_API_BASE = "https://pink-lemon-xxxx.onrender.com";
   ```
   Commit and push that change.
3. **Frontend on Vercel** — on [vercel.com](https://vercel.com) → **Add New… → Project**
   → import the same repo. Framework preset: **Other**. Leave build command
   empty, output directory as `.` (repo root). Deploy.
4. You'll get two URLs: the Vercel one is what you share (e.g.
   `https://pink-lemon.vercel.app`); Render keeps running the API + `/admin`
   in the background. `.vercelignore` already keeps the `backend/` folder out
   of the Vercel build, and CORS is already enabled on the backend so the
   cross-origin form submissions work.

Note either way: Render's free tier filesystem is not persistent across
redeploys/restarts — the SQLite file (and any leads in it) resets when the
service restarts. Fine for a demo; for real persistent storage later, move to
a hosted Postgres (e.g. Render's free Postgres, or Supabase) or a host with a
persistent volume (e.g. Fly.io).

## Project structure

```
index.html / work.html / about.html / contact.html / 404.html   — pages
assets/css/style.css                                            — shared styles (incl. dark mode)
assets/js/config.js                                              — backend URL for split deploys (edit this for option B)
assets/js/main.js                                                — shared behaviour (modals, forms, theme)
backend/server.js                                                — Node http server + SQLite storage + CORS
backend/admin.html                                               — leads dashboard
Dockerfile / render.yaml                                         — Render deploy config
vercel.json / .vercelignore                                      — Vercel static-deploy config (option B)
```
