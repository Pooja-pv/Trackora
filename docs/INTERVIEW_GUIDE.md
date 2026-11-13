# Trackora interview guide

Use this as a speaking guide, not a script to memorize. Be ready to point to the relevant files and explain the trade-offs.

## 60-second project introduction

"Trackora is a full-stack job application management platform. It helps job seekers organize opportunities, track each application's progress, plan follow-ups, and understand their search activity. I built the frontend with React and TypeScript and the backend with Django REST Framework. The backend uses session-based authentication with CSRF protection, and every application record is scoped to its owner. A job-import feature can extract publicly available posting details from supported job pages, reducing repetitive data entry. I also added automated checks and tests so changes can be validated consistently."

## Architecture questions

**Why separate frontend and backend?**

The React application owns the interactive user experience, while Django owns authentication, validation, authorization, and persistence. A clear API boundary makes each side easier to test and evolve independently.

**What happens when a user signs in?**

The frontend sends credentials to Django. Django authenticates the user and creates a session. The browser stores the session cookie. On later requests Axios sends credentials; the frontend first obtains a CSRF token for state-changing requests. The session endpoint lets the frontend restore the signed-in state after refresh.

**How do you stop one user from reading another user's applications?**

The application list and detail views filter their querysets using `request.user`. The create view sets the owner from the authenticated request on the server. The API does not trust a user ID supplied by the browser. Tests cover cross-user access.

**Why use a serializer?**

A DRF serializer defines the API representation and validates incoming fields before model persistence. It also keeps HTTP concerns separate from the database model.

**How does the job importer work?**

It validates the URL, requests the public page, parses structured JSON-LD `JobPosting` data and common metadata, then returns a draft of fields for the user to review. It is best-effort because job sites have different markup and may block automated requests.

**What security concerns exist in URL import?**

A server-side URL fetcher can be abused to request internal services (SSRF). Trackora restricts schemes, rejects embedded credentials and non-public destinations, and validates redirects. For a production-grade deployment, I would additionally enforce outbound network egress rules at infrastructure level and consider DNS-rebinding-resistant connection handling.

## Engineering decisions to understand

- **SQLite locally / PostgreSQL in deployment:** SQLite keeps onboarding simple; PostgreSQL is available through environment configuration for production-like deployment.
- **Session authentication:** appropriate for a same-site browser application; state-changing requests use CSRF protection.
- **Typed API layer:** TypeScript interfaces and API functions keep page components from duplicating endpoint details.
- **Server-side ownership:** authorization belongs on the backend, not just in hidden frontend controls.
- **CI:** a pull request should run backend checks/tests and frontend lint/build before merging.

## Honest limitations and next milestones

Do not claim features that have not been verified in a live environment. Before presenting Trackora, run the complete setup on your own machine, create a test account, and manually verify each workflow.

Good next milestones after this version:

1. Add browser-level end-to-end tests for registration, login, CRUD, follow-ups, and job import.
2. Add pagination/search/filter parameters on the backend instead of loading every record as the dataset grows.
3. Add background extraction jobs and per-user rate limits for expensive import requests.
4. Add observability: structured logs, error reporting, and request IDs.
5. Add deployment with PostgreSQL, HTTPS, secure cookie settings, environment-managed secrets, and outbound network restrictions.
6. Add accessibility checks and visual regression coverage for key pages.
