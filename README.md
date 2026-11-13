# Trackora

**Your career, in progress.** Trackora is a full-stack job-search workspace for keeping applications, interviews, follow-ups, and job-search insights in one place.

Trackora is built as a portfolio-quality software engineering project: a React + TypeScript single-page application backed by a Django REST API, with user-scoped data, session authentication, job-posting extraction, automated tests, and CI checks.

## Product capabilities

- **Secure accounts:** registration, login, logout, CSRF-protected session authentication, and a session-aware workspace.
- **Application pipeline:** save and update opportunities across Saved, Applied, Assessment, Interview, Offer, Rejected, and Withdrawn stages.
- **Application details:** capture company, role, job URL, location, work mode, salary range, job description, notes, applied date, interview date, and follow-up date.
- **Job import:** extract structured details from a single job-posting URL where the page exposes supported metadata or JSON-LD `JobPosting` data.
- **Career overview:** review application totals, pipeline progress, recent activity, and upcoming follow-ups.
- **Analytics:** explore job-search activity and status distribution.
- **Follow-up workspace:** keep upcoming follow-up dates visible so opportunities do not go cold.
- **Responsive interface:** a dedicated workspace layout with navigation, application forms, and page-level experiences.

> Job extraction depends on the target website's public HTML and may not work for sites that require authentication, block automated requests, or render all content in the browser. Always review imported details before saving.

## Technology

| Area | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router |
| UI | CSS, Lucide icons |
| API client | Axios |
| Backend | Python, Django 5.2, Django REST Framework |
| Authentication | Django session authentication and CSRF protection |
| Local database | SQLite by default |
| Production database | PostgreSQL supported through environment configuration |
| Quality | ESLint, Django tests, GitHub Actions |

## Repository structure

```text
Trackora/
├── backend/
│   ├── accounts/              # Registration, login, logout, profile model and tests
│   ├── applications/          # Application model, API, serializers, extraction and tests
│   ├── config/                # Django settings and root URL configuration
│   ├── requirements.txt       # Python dependencies
│   └── manage.py
├── frontend/
│   ├── public/                # Static icons and public assets
│   ├── src/
│   │   ├── api/               # Typed API functions and Axios/CSRF setup
│   │   ├── components/        # Reusable dashboard visualizations
│   │   ├── pages/             # Overview, analytics, import, follow-ups and auth pages
│   │   ├── App.tsx            # Routing, session gate and workspace shell
│   │   └── Dashboard.tsx      # Application list and create/edit workflow
│   ├── package.json
│   └── vite.config.ts
├── docs/                      # Architecture and development notes
├── .github/workflows/         # Continuous integration
├── .env.example               # Safe backend environment template
└── README.md
```

## Quick start

### Prerequisites

- Python 3.10 or newer (Python 3.12 recommended)
- Node.js 22 or newer and npm
- Git

SQLite is used for local development by default, so PostgreSQL is not required to get started.

### 1. Clone and configure

```bash
git clone <your-repository-url>
cd Trackora
cp .env.example .env
```

Generate a new Django secret key and place it in `.env` as `DJANGO_SECRET_KEY`. For example:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Never commit `.env`, real credentials, API keys, or production secrets. `.env.example` contains placeholders only.

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

Install and run:

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser   # optional: create an admin account
python manage.py runserver
```

The API endpoints are available under `http://127.0.0.1:8000/api/` and the Django admin at `http://127.0.0.1:8000/admin/`. The root URL (`http://127.0.0.1:8000/`) does not serve an application page.

### 3. Start the frontend

Open a second terminal:

```bash
cd Trackora/frontend
npm ci
cp .env.example .env
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). Register an account and start tracking applications.

### 4. Run quality checks

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

## Environment configuration

Backend variables are read from the project-root `.env` file:

| Variable | Purpose | Local default |
|---|---|---|
| `DJANGO_SECRET_KEY` | Django signing key | Required; generate your own |
| `DJANGO_DEBUG` | Enables development mode | `True` in `.env.example` |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated allowed hosts | `127.0.0.1,localhost` |
| `DATABASE_ENGINE` | Django database backend | SQLite |
| `DATABASE_NAME` | SQLite file path or PostgreSQL database name | `db.sqlite3` |
| `DATABASE_USER` | PostgreSQL user | `trackora_user` |
| `DATABASE_PASSWORD` | PostgreSQL password | Empty unless configured |
| `DATABASE_HOST` | PostgreSQL host | `localhost` |
| `DATABASE_PORT` | PostgreSQL port | `5432` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated trusted frontend origins | Local Vite origins |

To use PostgreSQL, set `DATABASE_ENGINE=django.db.backends.postgresql` and configure the database name, user, password, host, and port. The PostgreSQL driver is included in `backend/requirements.txt`.

The frontend can override the API endpoint with `VITE_API_BASE_URL` in `frontend/.env`. Include the `/api/` path, for example `http://localhost:8000/api/`.

## API overview

All application endpoints require an authenticated session.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/auth/csrf/` | Set/read the CSRF token |
| `POST` | `/api/auth/register/` | Create an account and profile |
| `POST` | `/api/auth/login/` | Start a session |
| `POST` | `/api/auth/logout/` | End the session |
| `GET` | `/api/auth/me/` | Return the signed-in user |
| `GET` | `/api/applications/` | List the current user's applications |
| `POST` | `/api/applications/` | Create an application |
| `GET/PATCH/DELETE` | `/api/applications/{id}/` | Read, update, or delete an owned application |
| `POST` | `/api/applications/extract/` | Extract fields from a job-posting URL |

The backend filters application queries by the authenticated user. An account cannot retrieve, edit, or delete another account's application by guessing its ID.

## Engineering notes

- Session cookies are HTTP-only; the frontend obtains a CSRF token from the backend before state-changing requests.
- The job importer accepts only HTTP(S) URLs, rejects embedded credentials and non-public network destinations, revalidates redirects, and limits the amount of response content read.
- Database schema changes belong in Django migrations. Do not edit an already-applied migration to change a deployed schema; create a new migration instead.
- The GitHub Actions workflow runs Django checks/tests and frontend lint/build on pushes and pull requests.
- Local environment files and generated build/database artifacts are excluded by `.gitignore`.

## Current project status

Trackora is an active development project. The included codebase contains the application tracking workflow, authentication, overview, analytics, follow-ups, job import, and multi-page navigation. The test and CI setup is being expanded alongside implementation. External job-board extraction is best-effort and should be treated as assisted data entry, not a guaranteed integration.

## License

MIT
