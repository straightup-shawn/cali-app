# Calisthenics Log

A mobile-first progressive web application for tracking calisthenics workouts. Designed for fast, one-handed interaction during active training sessions.

## Features

- **Exercise Library** — System-default and custom exercises with progression chains
- **Routine Builder** — Create reusable workout templates with target sets/reps/weight
- **Live Workout Logging** — Efficient set logging with minimal taps
- **Three Timer Systems** — Independent workout, rest, and exercise duration timers
- **Personal Records** — Automatic detection of max reps, max weight, max volume, and longest hold
- **Bodyweight Tracking** — Log bodyweight over time with trend visualization
- **Unit System** — Toggle between metric (kg) and imperial (lbs)
- **Offline Support** — Active workout persists to localStorage; syncs when online
- **PWA** — Installable on mobile home screen with standalone display

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 |
| Routing | React Router 7 |
| Server State | TanStack Query 5 |
| Forms | React Hook Form + Zod |
| Backend | Supabase (PostgreSQL, Auth, RLS) |
| Deployment | Render (static site) |
| PWA | vite-plugin-pwa |

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A [Supabase](https://supabase.com/) account and project

## Local Development Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd lite-heavy4calistnx
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your Supabase credentials:

- `VITE_SUPABASE_URL` — Your Supabase project URL (Settings → API)
- `VITE_SUPABASE_ANON_KEY` — Your Supabase anonymous/public key (Settings → API)

### 4. Set up the database

Run the migration files in order against your Supabase project using the SQL Editor or Supabase CLI:

```bash
# If using Supabase CLI:
supabase db push
```

Or manually run these files in the Supabase SQL Editor:

1. `supabase/migrations/00001_create_tables.sql` — Creates all tables, constraints, indexes, and triggers
2. `supabase/migrations/00002_rls_policies.sql` — Enables Row-Level Security policies

### 5. Seed default exercises

Run the seed script to populate the exercise library with system-default exercises and progression chains:

```sql
-- Run in Supabase SQL Editor or via CLI:
supabase db seed
```

Or manually execute `supabase/seed.sql`.

### 6. Start the dev server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run Oxlint |

## Deployment to Render

The project includes a `render.yaml` for one-click deployment as a static site.

1. Connect your GitHub repository to [Render](https://render.com/)
2. Render will detect `render.yaml` automatically
3. Set the environment variables in the Render dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy — the build command (`npm ci && npm run build`) and SPA fallback rewrite are pre-configured

## PWA Installation

### iPhone / iPad

1. Open the app in Safari
2. Tap the Share button
3. Select **Add to Home Screen**

### Android / Chrome

The browser install prompt should appear automatically. If not:

1. Tap the three-dot menu in Chrome
2. Select **Install app** or **Add to Home Screen**

## Project Structure

```
├── public/                  # Static assets (icons, favicon)
├── src/
│   ├── assets/              # Images and SVGs
│   ├── components/          # Reusable UI components
│   ├── context/             # React context providers (Auth, ActiveWorkout)
│   ├── hooks/               # Custom hooks (useAuth, useExercises, useTimer, etc.)
│   ├── lib/                 # Utility modules (supabase client, units, persistence)
│   ├── pages/               # Route page components
│   ├── types/               # TypeScript types and database definitions
│   ├── App.tsx              # Root component with routing
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles and Tailwind imports
├── supabase/
│   ├── migrations/          # SQL migration files (schema + RLS)
│   └── seed.sql             # Default exercise data
├── render.yaml              # Render deployment config
├── vite.config.ts           # Vite + PWA configuration
└── .env.example             # Environment variable template
```

## Database Schema

The database schema is defined in `supabase/migrations/`. Key tables:

- **profiles** — User preferences (unit system, default rest time)
- **exercises** — System and custom exercises with type and muscle groups
- **routines** / **routine_exercises** — Workout templates
- **workouts** / **workout_exercises** / **exercise_sets** — Completed workout data
- **personal_records** — Best performance per exercise per metric
- **bodyweight_entries** — Bodyweight log

All tables use Row-Level Security to isolate user data. See `supabase/migrations/00002_rls_policies.sql` for policy definitions.

## License

Private project.
