"""
Development settings for TRADLINKAPI.

Usage:
    DJANGO_SETTINGS_MODULE=config.settings.dev python manage.py runserver
"""

from .base import *  # noqa: F401, F403

# ──────────────────────────────────────────────
# Debug
# ──────────────────────────────────────────────
DEBUG = True
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0"]

# ──────────────────────────────────────────────
# Debug Toolbar
# ──────────────────────────────────────────────
INSTALLED_APPS += ["debug_toolbar"]  # noqa: F405
MIDDLEWARE.insert(0, "debug_toolbar.middleware.DebugToolbarMiddleware")  # noqa: F405
INTERNAL_IPS = ["127.0.0.1"]

# ──────────────────────────────────────────────
# Email — console backend for dev
# ──────────────────────────────────────────────
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# ──────────────────────────────────────────────
# Static / Media — local filesystem
# ──────────────────────────────────────────────
DEFAULT_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"
MEDIA_ROOT = BASE_DIR / "media_temp"  # noqa: F405

# ──────────────────────────────────────────────
# CORS — allow localhost frontends
# ──────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# ──────────────────────────────────────────────
# REST Framework — add browsable API in dev
# ──────────────────────────────────────────────
REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = (  # noqa: F405
    "rest_framework.renderers.JSONRenderer",
    "rest_framework.renderers.BrowsableAPIRenderer",
)

# ──────────────────────────────────────────────
# Cache — LocMemCache (no Redis required locally)
# ──────────────────────────────────────────────
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

# ──────────────────────────────────────────────
# Sessions — use DB instead of cache so admin
# sessions survive dev-server auto-reloads
# ──────────────────────────────────────────────
SESSION_ENGINE = "django.contrib.sessions.backends.db"

# ──────────────────────────────────────────────
# CSRF — trust localhost origins (Django 4+ requirement)
# ──────────────────────────────────────────────
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]
