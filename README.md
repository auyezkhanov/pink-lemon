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

## Deploy (Render, free tier)

1. Push this repo to GitHub (see below).
2. On [render.com](https://render.com) → **New +** → **Web Service** → connect the repo.
3. Render detects the `Dockerfile` automatically — leave the defaults, just set:
   - **Instance type:** Free
   - **Environment variable:** `ADMIN_KEY` = a real secret (don't keep the default in production)
4. Deploy. You'll get a URL like `https://pink-lemon-xxxx.onrender.com`.

Note: the free tier's filesystem is not persistent across redeploys/restarts —
the SQLite file (and any leads in it) resets when the service restarts. Fine for
a demo; for real persistent storage later, move to a hosted Postgres (e.g. Render's
free Postgres, or Supabase) or a host with a persistent volume (e.g. Fly.io).

## Push to GitHub

```
git remote add origin https://github.com/<your-username>/pink-lemon.git
git branch -M main
git push -u origin main
```

## Project structure

```
index.html / work.html / about.html / contact.html / 404.html   — pages
assets/css/style.css                                            — shared styles (incl. dark mode)
assets/js/main.js                                                — shared behaviour (modals, forms, theme)
backend/server.js                                                — Node http server + SQLite storage
backend/admin.html                                               — leads dashboard
Dockerfile / render.yaml                                         — deploy config
```
