# Workout Tracker PWA

A full-stack Progressive Web App to log workouts, track progress, and see personal records — installable on iOS/Android directly from the browser.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Charts | Recharts |
| PWA | vite-plugin-pwa (Workbox) |
| Backend | Node.js + Express |
| Database | SQLite via better-sqlite3 |
| Dev runner | concurrently |

## Features

- **Log workouts** — name, date, notes, exercises, sets × reps × weight
- **Edit / delete** any past workout
- **Dashboard** — weekly volume, total workouts, personal records per exercise
- **History** — full timeline grouped by month, expandable workout cards
- **Progress charts** — max weight and volume over time per exercise (Recharts)
- **Offline shell** — service worker caches the app shell; logged data is persisted in SQLite

## Quick Start (local)

```bash
git clone <repo> workout-tracker
cd workout-tracker
npm run install:all   # installs root + backend + frontend deps
npm run dev           # starts API on :3001 and Vite on :5173
```

Open **http://localhost:5173** in your browser.

## Project Structure

```
workout-tracker/
├── backend/
│   ├── server.js         # Express API + SQLite schema
│   └── workout.db        # SQLite file (created on first run)
└── frontend/
    ├── src/
    │   ├── pages/        # Dashboard, LogWorkout, History, Progress
    │   ├── components/   # BottomNav, WorkoutCard
    │   └── api.js        # Thin fetch wrapper (reads VITE_API_URL)
    ├── public/
    │   ├── icon-192.png  # PWA icons (auto-generated at build time)
    │   └── icon-512.png
    └── vite.config.js    # PWA manifest + Workbox config
```

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3001` | Backend port |
| `DB_PATH` | `./workout.db` | SQLite file path |
| `VITE_API_URL` | `""` (same origin) | Backend base URL for production |

## Deployment

### Step 1 — Deploy backend to Railway

1. Create a [Railway](https://railway.app) account and click **New Project → Deploy from GitHub**.
2. Select this repo and set the **Root Directory** to `backend`.
3. Railway auto-detects Node.js. Set the start command to `node server.js`.
4. Add environment variable: `DB_PATH=/data/workout.db` and mount a **Volume** at `/data` so data persists across deploys.
5. Copy the public URL Railway gives you (e.g. `https://workout-api-xxx.up.railway.app`).

### Step 2 — Deploy frontend to Vercel (or Netlify)

**Vercel:**
```bash
npm i -g vercel
cd workout-tracker
vercel --cwd frontend
```
Set the environment variable in the Vercel dashboard:
```
VITE_API_URL=https://workout-api-xxx.up.railway.app
```
Trigger a redeploy after setting the variable.

**Netlify:**
1. Connect the repo; set **Base directory** to `frontend`, **Build command** to `npm run build`, **Publish directory** to `frontend/dist`.
2. Add env var `VITE_API_URL=https://workout-api-xxx.up.railway.app`.

### Step 3 — Install on your phone

1. Open the frontend URL in **Chrome** (Android) or **Safari** (iOS).
2. **Android**: tap the three-dot menu → *Add to Home Screen*.
3. **iOS**: tap the Share icon → *Add to Home Screen*.

The app will launch full-screen like a native app and cache the shell for offline use.

## API Reference

| Method | Path | Description |
|---|---|---|
| GET | `/api/workouts` | List all workouts (summary) |
| POST | `/api/workouts` | Create workout (with exercises + sets) |
| GET | `/api/workouts/:id` | Get workout with full exercises/sets |
| PUT | `/api/workouts/:id` | Replace workout |
| DELETE | `/api/workouts/:id` | Delete workout |
| GET | `/api/stats/dashboard` | Dashboard stats |
| GET | `/api/stats/progress` | Exercise list |
| GET | `/api/stats/progress?exercise=Bench+Press` | Progress data for one exercise |
| GET | `/api/health` | Health check |

## Notes

- Icons (`public/icon-*.png`) are generated automatically by `scripts/generate-icons.cjs` each time you run `dev` or `build`. They're plain purple squares — replace them with a real icon if you want.
- The SQLite database is a single file at `backend/workout.db`. Back it up by copying that file.
- For best PWA install support, serve the frontend over HTTPS (Vercel/Netlify both do this automatically).
