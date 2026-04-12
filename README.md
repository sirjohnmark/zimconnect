# TRADLINKAPI

Production-ready Django 5.2 REST API for a Zimbabwe classifieds / marketplace platform.

## Tech Stack

- **Framework:** Django 5.2 + Django REST Framework
- **Auth:** JWT via `djangorestframework-simplejwt` (access 15 min / refresh 7 days, rotation + blacklist)
- **Database:** PostgreSQL via `psycopg` + `dj-database-url`
- **Cache / Broker:** Redis via `django-redis` + Celery
- **Real-time:** Django Channels + Daphne (ASGI) + `channels-redis`
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
# HTTP only (WSGI)
python manage.py runserver

# HTTP + WebSocket (ASGI via Daphne — recommended)
daphne -b 0.0.0.0 -p 8000 config.asgi:application
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

## WebSocket — Real-time Chat

The API exposes a WebSocket endpoint for real-time messaging within conversations.

### Connection

```
ws://host/ws/chat/{conversation_id}/?token=<JWT_ACCESS_TOKEN>
```

Authentication uses the same JWT access token from the REST API, passed as a
`token` query parameter. The server validates the token and checks the user is
a participant in the conversation before accepting the connection.

### JavaScript Example

```javascript
const token = "eyJhbGciOiJIUzI1NiIs...";   // JWT access token
const conversationId = 5;

const ws = new WebSocket(
  `ws://localhost:8000/ws/chat/${conversationId}/?token=${token}`
);

ws.onopen = () => console.log("Connected");

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case "history":
      // Initial payload: last 20 messages
      console.log("History:", data.messages);
      break;
    case "chat_message":
      // New message from any participant
      console.log("New message:", data.message);
      break;
    case "messages_read":
      // Read receipt
      console.log(`Message ${data.message_id} read by ${data.reader}`);
      break;
    case "error":
      console.error("Error:", data.message);
      break;
  }
};

// Send a message
ws.send(JSON.stringify({ type: "message", content: "Hello!" }));

// Mark a message as read
ws.send(JSON.stringify({ type: "mark_read", message_id: 42 }));
```

### Close Codes

| Code | Meaning                           |
|------|-----------------------------------|
| 4001 | Unauthenticated (no/invalid JWT)  |
| 4003 | Not a participant in conversation |

## API Versioning

All API endpoints are served under the `/api/v1/` prefix:

| Resource     | Base URL                                 |
|--------------|------------------------------------------|
| Auth         | `/api/v1/auth/`                          |
| Categories   | `/api/v1/categories/`                    |
| Listings     | `/api/v1/listings/`                      |
| Inbox        | `/api/v1/inbox/`                         |
| Admin Panel  | `/api/v1/admin/`                         |
| OpenAPI Docs | `/api/v1/docs/`                          |
| WebSocket    | `ws://host/ws/chat/{id}/?token=<JWT>`    |

### Deprecated `/api/` prefix

The legacy `/api/` prefix returns a **301 Permanent Redirect** to `/api/v1/`
with the following headers:

- `Deprecation: true`
- `Sunset: 2026-10-01`
- `Link: </api/v1/>; rel="successor-version"`

Clients should migrate to `/api/v1/` before the sunset date.

### Response headers

Every API response includes `X-API-Version: 1`.

## License

Proprietary — all rights reserved.
