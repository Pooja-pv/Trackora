# Trackora

Trackora is a job-search tracker for keeping applications, interviews and follow-ups in one place.

It is a personal full-stack project: a React + TypeScript single-page app talking to a Django REST API. It has user accounts with session authentication, data that belongs to each user, job-posting import, backend tests and a CI workflow.

## Features

- **Accounts:** register, log in and log out, using Django sessions with CSRF protection.
- **Application pipeline:** track opportunities through Saved, Applied, Assessment, Interview, Offer, Rejected and Withdrawn.
- **Application details:** company, role, job URL, location, work mode, salary range, job description, notes, applied date, interview date and follow-up date.
- **Job import:** fill in the details from a single job-posting URL, when the page exposes supported metadata or JSON-LD `JobPosting` data.
- **Overview:** totals, pipeline progress, recent applications and upcoming follow-ups.
- **Analytics:** application activity over time and the status breakdown.
- **Follow-ups:** a list of follow-up dates so nothing is forgotten.
- **Responsive layout:** sidebar navigation with separate pages for each area.

> Job import reads the page's public HTML. It may not work for sites that need a login, block automated requests, or render everything in the browser. Check the imported details before saving.

## Technology

| Area | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router |
| UI | CSS, Lucide icons |
| API client | Axios |
| Backend | Python, Django 5.2, Django REST Framework |
| Authentication | Django session authentication and CSRF protection |
| Local database | SQLite by default |
| Production database | PostgreSQL, set through environment variables |
| Quality | ESLint, Django tests, GitHub Actions |

## Repository structure

```text
Trackora/
├── backend/
│   ├── accounts/              # Registration, login, logout, profile model and tests
│   ├── applications/          # Application model, API, serializers, job import and tests
│   ├── config/                # Django settings and root URL configuration
│   ├── requirements.txt       # Python dependencies
│   └── manage.py
├── frontend/
│   ├── public/                # Static icons and assets
│   ├── src/
│   │   ├── api/               # API functions and the Axios/CSRF setup
│   │   ├── components/        # Reusable chart components
│   │   ├── pages/             # Overview, analytics, import, follow-ups, details and auth pages
│   │   ├── utils/             # Shared dashboard calculations
│   │   ├── App.tsx            # Routing, session check and workspace layout
│   │   └── Dashboard.tsx      # Application list and add/edit form
│   ├── package.json
│   └── vite.config.ts
├── docs/                      # Architecture, design and development notes
├── .github/workflows/         # Continuous integration
├── .env.example               # Backend environment template
└── README.md
```

## Getting started

### Requirements

- Python 3.10 or newer (3.12 recommended)
- Node.js 22.13 or newer, with npm
- Git

SQLite is used by default for local development, so you do not need to install PostgreSQL.

### 1. Clone and configure

```bash
git clone https://github.com/Pooja-pv/Trackora.git
cd Trackora
cp .env.example .env
```

Generate a Django secret key and put it in `.env` as `DJANGO_SECRET_KEY`:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Do not commit `.env` or any real credentials. `.env.example` only contains placeholders.

### 2. Start the backend

```bash
cd backend
python -m venv .venv
```

Activate the environment:

```bash
# Windows PowerShell
.venv\Scripts\Activate.ps1

# macOS / Linux
source .venv/bin/activate
```

Then install the dependencies and run the server:

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser   # optional, for the admin site
python manage.py runserver
```

The API is at `http://127.0.0.1:8000/api/` and the Django admin is at `http://127.0.0.1:8000/admin/`. The root URL (`http://127.0.0.1:8000/`) has no page.

### 3. Start the frontend

In a second terminal:

```bash
cd Trackora/frontend
npm ci
cp .env.example .env
npm run dev
```

Open the address Vite prints (usually `http://localhost:5173`), register an account and add your first application.

### 4. Run the checks

Backend:

```bash
cd backend
python manage.py check
python manage.py test
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

## Environment variables

The backend reads these from the `.env` file in the project root:

| Variable | Purpose | Local default |
|---|---|---|
| `DJANGO_SECRET_KEY` | Django signing key | Required, generate your own |
| `DJANGO_DEBUG` | Turns on development mode | `True` in `.env.example` |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated allowed hosts | `127.0.0.1,localhost` |
| `DATABASE_ENGINE` | Django database backend | SQLite |
| `DATABASE_NAME` | SQLite file path or PostgreSQL database name | `db.sqlite3` |
| `DATABASE_USER` | PostgreSQL user | `trackora_user` |
| `DATABASE_PASSWORD` | PostgreSQL password | Empty unless set |
| `DATABASE_HOST` | PostgreSQL host | `localhost` |
| `DATABASE_PORT` | PostgreSQL port | `5432` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins | Local Vite origins |

To use PostgreSQL, set `DATABASE_ENGINE=django.db.backends.postgresql` and fill in the database name, user, password, host and port. The PostgreSQL driver is already in `backend/requirements.txt`.

The frontend can point at a different API with `VITE_API_BASE_URL` in `frontend/.env`. Include the `/api/` part, for example `http://localhost:8000/api/`.

## API

The application endpoints need a logged-in session. The CSRF, register and login endpoints do not.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/auth/csrf/` | Set and return the CSRF token |
| `POST` | `/api/auth/register/` | Create an account and profile |
| `POST` | `/api/auth/login/` | Start a session |
| `POST` | `/api/auth/logout/` | End the session |
| `GET` | `/api/auth/me/` | Return the signed-in user |
| `GET` | `/api/applications/` | List the current user's applications (10 per page) |
| `POST` | `/api/applications/` | Create an application |
| `GET/PATCH/DELETE` | `/api/applications/{id}/` | Read, update or delete one of your applications |
| `POST` | `/api/applications/extract/` | Extract fields from a job-posting URL |

The list endpoint returns `count`, `next`, `previous` and `results`. Application queries are always filtered by the logged-in user, so one account cannot read, edit or delete another account's application by guessing an ID.

## Notes

- Session cookies are HTTP-only. The frontend fetches a CSRF token from the backend before each state-changing request.
- The job importer only accepts HTTP(S) URLs, rejects URLs with embedded credentials and non-public network addresses, checks every redirect again, and downloads at most 5 MB of a page.
- Change the database schema with a new Django migration. Do not edit a migration that has already been applied.
- The GitHub Actions workflow runs the Django checks and tests, and the frontend lint and build, on pushes and pull requests.
- `.gitignore` keeps local environment files, databases and build output out of the repository.

## Project status

Still in development. The application workflow, authentication, overview, analytics, follow-ups, job import and page navigation are in place. Known limits:

- Job import is best-effort. Treat it as a shortcut for typing, not a guaranteed integration with any job board.
- The backend tests cover accounts, applications and URL validation. There are no frontend or end-to-end tests yet.
- The frontend loads all of a user's applications and filters them in the browser. Server-side search and filtering would scale better.

More detail is in [`docs/`](docs).

## License

MIT
