# Trackora frontend

The React + TypeScript interface for Trackora, built with Vite.

## Setup

```bash
npm ci
cp .env.example .env
npm run dev
```

The app runs at `http://localhost:5173` and expects the Django API at `http://localhost:8000/api/`. To use a different API address, set `VITE_API_BASE_URL` in `.env` (include the `/api/` part).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Type-check and create a production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build locally |

## Layout

- `src/api/` – Axios client and typed API functions
- `src/pages/` – one component per page (overview, analytics, follow-ups, import, details, login, register)
- `src/components/` – shared chart components
- `src/utils/` – shared dashboard calculations
- `src/Dashboard.tsx` – application list and add/edit form
- `src/App.tsx` – routing, session check and page layout

See the main [README](../README.md) for the backend and full setup.
