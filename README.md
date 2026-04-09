# TRADLINKAPI

Production-ready Django 5.2 REST API for a Zimbabwe classifieds / marketplace platform.

## Tech Stack

- **Framework:** Django 5.2 + Django REST Framework
- **Auth:** JWT via `djangorestframework-simplejwt` (access 15 min / refresh 7 days, rotation + blacklist)
- **Database:** PostgreSQL via `psycopg` + `dj-database-url`
- **Cache / Broker:** Redis via `django-redis` + Celery
- **Storage:** S3 / Cloudflare R2 via `django-storages`
- **Monitoring:** Sentry SDK
- **Task Queue:** Celery + `django-celery-beat`

## Project Layout

```
├── apps/               # Django apps (accounts, listings, …)
├── config/
│   ├── settings/
│   │   ├── base.py     # Shared settings
│   │   ├── dev.py      # Development overrides
│   │   └── prod.py     # Production overrides
│   ├── celery.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── requirements/
│   ├── base.txt
│   ├── dev.txt
│   └── prod.txt
├── manage.py
├── .env.example
└── .gitignore
```

## Local Setup

### 1. Clone & create virtualenv

```bash
git clone <repo-url> && cd zimoraAPI
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements/dev.txt
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env — at minimum set SECRET_KEY and DATABASE_URL
```

### 4. Create database

```bash
createdb tradlinkapi          # or use pgAdmin / Docker
python manage.py migrate
python manage.py createsuperuser
```

### 5. Run development server

```bash
python manage.py runserver
```

### 6. Run Celery worker (separate terminal)

```bash
celery -A config worker -l info
```

### 7. Run Celery Beat scheduler (separate terminal)

```bash
celery -A config beat -l info
```

## Running Tests

```bash
pytest --cov=apps --cov-report=term-missing
```

## Production

Set `DJANGO_SETTINGS_MODULE=config.settings.prod` and ensure **all** required env vars are present (the prod settings file will raise `ImproperlyConfigured` for any missing values).

```bash
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

## License

Proprietary — all rights reserved.
