# Trackora architecture

## Request flow

1. A user opens the React application. `App.tsx` asks Django whether a valid session exists.
2. React Router sends unauthenticated visitors to login or registration. Authenticated users enter the workspace shell.
3. Page components call typed functions in `frontend/src/api/` rather than constructing endpoints throughout the UI.
4. The shared Axios client attaches cookies and obtains a CSRF token before POST, PUT, PATCH, or DELETE requests.
5. Django routes requests to the `accounts` or `applications` app.
6. DRF serializers validate and serialize application data. Querysets are scoped to `request.user` before records are returned or modified.
7. Django persists data through the configured database backend.

## Backend responsibilities

- `accounts/models.py`: optional profile data associated with Django's user model.
- `accounts/views.py`: CSRF bootstrap, account registration, session login/logout, and current-user response.
- `applications/models.py`: the job application entity and its status/work-mode choices.
- `applications/serializers.py`: the API representation and writable fields for an application.
- `applications/views.py`: list/create, detail/update/delete, and job-detail extraction endpoints.
- `applications/job_extraction.py`: defensive URL validation, HTML/JSON-LD parsing, and best-effort extraction.
- `config/settings.py`: environment-based settings, database configuration, middleware, CORS, and REST defaults.

## Frontend responsibilities

- `App.tsx`: session gate, route definitions, workspace navigation, and logout handling.
- `Dashboard.tsx`: application list and create/edit workflow.
- `pages/`: focused page experiences for overview, analytics, follow-ups, importing, details, login, and registration.
- `api/client.ts`: one configured Axios client, cookie support, API base URL, and CSRF handling.
- `api/auth.ts` and `api/applications.ts`: typed API operations and data contracts.
- `components/`: reusable visual components such as pipeline analytics.

## Data ownership and security boundary

`JobApplication.user` is the ownership boundary. List and detail querysets are always filtered to the authenticated request user. Creation assigns the owner on the server rather than trusting a client-provided user ID. Keep this invariant when adding endpoints.

## Adding a feature safely

1. Define the expected user flow and data contract.
2. Add or update the model and create a migration if the schema changes.
3. Add serializer validation and enforce ownership in the view/queryset.
4. Add backend tests for success, invalid input, unauthenticated access, and cross-user access.
5. Add a typed frontend API function.
6. Implement the UI states: loading, empty, success, and failure.
7. Run backend tests, frontend lint, and production build.
8. Update documentation and commit the change with a focused message.
