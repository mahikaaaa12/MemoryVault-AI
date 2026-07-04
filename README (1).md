# MemoryVault

A Django application for capturing and organizing memories, with categories, search, an AI assistant, and productivity tools.

## Local Development

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env
# edit .env and fill in SECRET_KEY at minimum

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

The app will be available at http://127.0.0.1:8000/.

## Environment Variables

See `.env.example` for the full list. Required for any deployment:

- `SECRET_KEY` — Django secret key (generate a fresh one per environment, never reuse the dev key)
- `DEBUG` — must be `False` in production
- `ALLOWED_HOSTS` — comma-separated list of hosts allowed to serve the app
- `DATABASE_URL` — Postgres connection string in production (falls back to local SQLite if unset)
- `ANTHROPIC_API_KEY` — optional, powers the AI Assistant feature

## Deploying to Render

### Option A: Blueprint (one-click, recommended)

This repo includes a `render.yaml` Blueprint that defines the web service and a Postgres database together.

1. Push this repository to GitHub/GitLab.
2. Go to [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints) and connect the repo.
3. Render reads `render.yaml` and provisions both resources. You'll be prompted for the one secret marked `sync: false` (`ANTHROPIC_API_KEY`) — everything else (`SECRET_KEY`, `DATABASE_URL`, `ALLOWED_HOSTS`) is generated or wired up automatically.
4. Click **Apply** to deploy.

Notes:
- `render.yaml` pins `region: oregon` and `plan: starter` (web) / `plan: free` (database) — edit these in the file before deploying if you want a different region or plan. The free database plan expires after 30 days, so switch it to a paid plan before relying on it long-term.
- Uploaded avatars and memory attachments are written to local disk, which Render's default web service disk does **not** persist across deploys/restarts. `render.yaml` has a commented-out `disk:` block you can enable if you want uploads to survive deploys (requires a paid plan and rules out running multiple instances); otherwise, treat file uploads as ephemeral until that's addressed.

### Option B: Manual setup

1. Push this repository to GitHub/GitLab.
2. In the Render dashboard, create a **New Web Service** from the repo.
3. Set:
   - **Build Command:** `./build.sh`
   - **Start Command:** `gunicorn memoryvault_project.wsgi:application --log-file -` (also defined in `Procfile`, so Render may auto-detect it)
4. Add a **PostgreSQL** instance from the Render dashboard and copy its **Internal Database URL** into the `DATABASE_URL` environment variable on the web service.
5. Set the remaining environment variables from `.env.example` (`SECRET_KEY`, `DEBUG=False`, `ALLOWED_HOSTS`, `ANTHROPIC_API_KEY`, etc.) in the Render dashboard's **Environment** tab.
6. Deploy. `build.sh` will install dependencies, run `collectstatic`, and run `migrate` automatically on every deploy.
7. Static files are served directly by the app via WhiteNoise — no separate static host is required.

## Running Tests

```bash
python manage.py test
```

## Project Structure

- `memoryvault_project/` — Django project settings, root URLs, WSGI/ASGI entrypoints
- `vault/` — the main application: models, views, templates, static assets, migrations
- `vault/views/` — views split by feature area (auth, dashboard, memories, categories, search, productivity)
- `vault/ai_service.py` — Anthropic API integration for the AI Assistant feature

## Production Readiness

This project has undergone a production readiness audit. See the audit notes in your deployment records for details on settings hardening, security review, and performance review. As of this file's last update, deployment scaffolding (dependency pinning, WhiteNoise static file serving, gunicorn, build script) is in place; a full settings/security/performance pass may still be pending — confirm with the latest audit status before deploying to a live environment.
