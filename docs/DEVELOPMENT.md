# Development notes

## Checks to run before committing

```bash
# Backend
cd backend
python manage.py check
python manage.py test

# Frontend (from frontend/)
npm run lint
npm run build
```

The same checks run in GitHub Actions on every push and pull request.

## Commits

Look over your changes before staging them:

```bash
git status --short
git diff --stat
git diff --check
```

Keep each commit to one change and describe what it does, for example:

```bash
git commit -m "test: add cross-user access tests"
git commit -m "fix: allow longer job URLs"
git commit -m "docs: update setup instructions"
```

Never commit `.env`, database files, credentials or dependency folders such as `node_modules` and `.venv`.

## Database changes

After changing a model, create a new migration and run it:

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

Do not edit a migration that has already been applied.
