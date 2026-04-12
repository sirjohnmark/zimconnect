"""
Production settings for TRADLINKAPI.

All required env vars must be set or ImproperlyConfigured is raised.
"""

from decouple import config
from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F401, F403

# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────
def require_env(var_name: str) -> str:
    """Return env var value or raise ImproperlyConfigured."""
    value = config(var_name, default="")
    if not value:
        raise ImproperlyConfigured(f"Required environment variable '{var_name}' is not set.")
    return value


# ──────────────────────────────────────────────
# Core
# ──────────────────────────────────────────────
DEBUG = False
ALLOWED_HOSTS = config("ALLOWED_HOSTS", cast=lambda v: [h.strip() for h in v.split(",")])

# ──────────────────────────────────────────────
# Security headers
# ──────────────────────────────────────────────
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31_536_000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = "DENY"

# ──────────────────────────────────────────────
# Database — require explicit URL
# ──────────────────────────────────────────────
require_env("DATABASE_URL")

# ──────────────────────────────────────────────
# Static files — WhiteNoise (served from disk)
# ──────────────────────────────────────────────
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

MIDDLEWARE.insert(2, "whitenoise.middleware.WhiteNoiseMiddleware")  # noqa: F405

# ──────────────────────────────────────────────
# Cache — local memory (no Redis required)
# ──────────────────────────────────────────────
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "sanganai-prod",
    },
}

SESSION_ENGINE = "django.contrib.sessions.backends.db"

# ──────────────────────────────────────────────
# Celery — disabled (no Redis broker)
# ──────────────────────────────────────────────
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# ──────────────────────────────────────────────
# Channels — in-memory (no Redis layer)
# ──────────────────────────────────────────────
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    },
}

# ──────────────────────────────────────────────
# Email — console for now (swap to SMTP later)
# ──────────────────────────────────────────────
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# ──────────────────────────────────────────────
# Sentry (optional — skip if DSN not set)
# ──────────────────────────────────────────────
SENTRY_DSN = config("SENTRY_DSN", default="")

if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration

    def _before_send(event, hint):
        """Filter out noisy 404 and 429 errors from Sentry."""
        if "exc_info" in hint:
            exc_type = hint["exc_info"][0]
            if getattr(exc_type, "__name__", "") in ("Http404", "Throttled"):
                return None
        return event

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration()],
        traces_sample_rate=0.1,
        profiles_sample_rate=0.1,
        send_default_pii=False,
        before_send=_before_send,
    )

# ──────────────────────────────────────────────
# CORS — from env only
# ──────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    cast=lambda v: [h.strip() for h in v.split(",")],
)

# ──────────────────────────────────────────────
# Logging — structured JSON
# ──────────────────────────────────────────────
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "filters": {
        "request_id": {
            "()": "django.utils.log.CallbackFilter",
            "callback": lambda record: setattr(
                record, "request_id",
                __import__("apps.common.middleware", fromlist=["get_request_id"]).get_request_id() or "-",
            ) or True,
        },
    },
    "formatters": {
        "json": {
            "()": "pythonjsonlogger.json.JsonFormatter",
            "fmt": "%(asctime)s %(levelname)s %(name)s %(message)s",
            "rename_fields": {"asctime": "timestamp", "levelname": "level", "name": "logger"},
            "static_fields": {"environment": "production"},
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "json",
            "filters": ["request_id"],
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "WARNING",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
        "apps": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "Sanganai.requests": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}
