# Design notes

Why Trackora is built the way it is, and what could be improved. See [ARCHITECTURE.md](ARCHITECTURE.md) for how the pieces fit together.

## Decisions

**Separate frontend and backend.** The React app handles the interface. Django handles authentication, validation, authorization and storage. With a clear API between them, each side can be tested and changed on its own.

**Session authentication.** Signing in sends the credentials to Django, which creates a session and sets a session cookie. Axios sends the cookie on later requests, and before any state-changing request the frontend fetches a CSRF token. The `/api/auth/me/` endpoint lets the frontend restore the signed-in state after a page refresh. This suits a browser app served from the same site. Cookies would need rethinking if the frontend and API ran on different domains.

**Server-side ownership.** The application list and detail views filter their querysets by `request.user`, and the create view sets the owner on the server. The API never trusts a user ID sent by the browser. Tests cover reading another user's application.

**Serializers.** A DRF serializer defines the API shape and validates incoming fields before they reach the database, which keeps HTTP handling separate from the model.

**Typed API layer.** TypeScript interfaces and the functions in `frontend/src/api/` keep endpoint details out of the page components.

**SQLite locally, PostgreSQL in deployment.** SQLite keeps setup simple. PostgreSQL is available through environment variables.

**CI.** Backend checks and tests, plus frontend lint and build, run on every push and pull request.

## Job import

The importer validates the URL, downloads the public page, reads structured JSON-LD `JobPosting` data and common metadata, and returns a draft for the user to review. It is best-effort, because job sites use different markup and may block automated requests.

A server that fetches user-supplied URLs can be tricked into requesting internal services (SSRF). The importer accepts only HTTP(S), rejects embedded credentials and non-public addresses, and checks every redirect again. A deployed version should also restrict outbound network access at the infrastructure level and connect in a way that cannot be redirected by DNS rebinding.

## Limitations and next steps

The API is paginated (10 per page), but the frontend fetches every page and filters in the browser. Server-side search and filtering would scale better.

Ideas for later:

1. Browser-level end-to-end tests for registration, login, CRUD, follow-ups and job import.
2. Backend search, filter and sort parameters.
3. Per-user rate limits for the import endpoint, and limits on login attempts.
4. Structured logging, error reporting and request IDs.
5. Deployment with PostgreSQL, HTTPS, secure cookies, managed secrets and outbound network restrictions.
6. Accessibility checks and visual regression tests for key pages.
