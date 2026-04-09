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
# S3 / Cloudflare R2 storage
# ──────────────────────────────────────────────
AWS_ACCESS_KEY_ID = require_env("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = require_env("AWS_SECRET_ACCESS_KEY")
AWS_STORAGE_BUCKET_NAME = require_env("AWS_STORAGE_BUCKET_NAME")
AWS_S3_ENDPOINT_URL = config("AWS_S3_ENDPOINT_URL", default="")
AWS_S3_REGION_NAME = config("AWS_S3_REGION_NAME", default="auto")
AWS_S3_CUSTOM_DOMAIN = config("AWS_S3_CUSTOM_DOMAIN", default="")
AWS_DEFAULT_ACL = None
AWS_S3_OBJECT_PARAMETERS = {
    "CacheControl": "max-age=86400",
}
AWS_QUERYSTRING_AUTH = False

STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
    },
    "staticfiles": {
        "BACKEND": "storages.backends.s3boto3.S3StaticStorage",
    },
}

# ──────────────────────────────────────────────
# Email
# ──────────────────────────────────────────────
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = require_env("EMAIL_HOST")
EMAIL_PORT = config("EMAIL_PORT", default=587, cast=int)
EMAIL_HOST_USER = require_env("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = require_env("EMAIL_HOST_PASSWORD")
EMAIL_USE_TLS = True

# ──────────────────────────────────────────────
# Sentry
# ──────────────────────────────────────────────
SENTRY_DSN = require_env("SENTRY_DSN")

import sentry_sdk  # noqa: E402

sentry_sdk.init(
    dsn=SENTRY_DSN,
    traces_sample_rate=0.1,
    profiles_sample_rate=0.1,
    send_default_pii=False,
)

# ──────────────────────────────────────────────
# CORS — from env only
# ──────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    cast=lambda v: [h.strip() for h in v.split(",")],
)

# ──────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{asctime}] {levelname} {name} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
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
    },
}
