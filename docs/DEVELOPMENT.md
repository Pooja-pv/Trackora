# Development workflow

## Before changing code

```bash
git status --short
git log --oneline -8
```

Keep unrelated local work intact. Do not reset, clean, or force-push a branch just to make the working tree look tidy.

## Verify changes

```bash
# Backend
cd backend
python manage.py check
python manage.py test

# Frontend (from frontend/)
npm run lint
npm run build
```

## Commit by meaningful change

Review the diff before staging:

```bash
git diff --check
git diff --stat
git status --short
```

Stage only the files belonging to one logical change and use a message that describes the outcome. Examples (use only when they match the actual diff):

```bash
git add backend/accounts/tests.py backend/applications/tests.py
git commit -m "test: expand authentication and application coverage"

git add backend/requirements.txt backend/config/settings.py .env.example frontend/src/api/client.ts frontend/.env.example
git commit -m "chore: improve local configuration and API setup"

git add .github/workflows/ci.yml README.md docs/
git commit -m "docs: add project architecture and CI workflow"
```

Do not copy these examples blindly: inspect `git diff` and group the final changes based on what actually changed. Keep `.env`, database files, credentials, and dependency folders out of commits.
