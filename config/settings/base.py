"""
Django base settings for TRADLINKAPI.

All environment-specific settings inherit from this module.
Environment variables are loaded via python-decouple.
"""

import os
from datetime import timedelta
from pathlib import Path

from decouple import Csv, config

# ──────────────────────────────────────────────
# Paths
# ──────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# ──────────────────────────────────────────────
# Security
# ──────────────────────────────────────────────
SECRET_KEY = config("SECRET_KEY")
DEBUG = config("DEBUG", default=False, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="", cast=Csv())

# ──────────────────────────────────────────────
# Africa's Talking SMS (OTP)
# ──────────────────────────────────────────────
AT_USERNAME = config("AT_USERNAME", default="sandbox")
AT_API_KEY = config("AT_API_KEY", default="")
AT_SENDER_ID = config("AT_SENDER_ID", default="")

# ──────────────────────────────────────────────
# Application definition
# ──────────────────────────────────────────────
DJANGO_APPS = [
    "daphne",  # Must be before django.contrib.staticfiles for ASGI
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "channels",
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "storages",
    "django_celery_beat",
    "drf_spectacular",
]

LOCAL_APPS: list[str] = [
    "apps.common",
    "apps.accounts",
    "apps.categories",
    "apps.listings",
    "apps.inbox",
    "apps.adminpanel",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# ──────────────────────────────────────────────
# Middleware
# ──────────────────────────────────────────────
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "apps.common.middleware.RequestLoggingMiddleware",
    "apps.common.middleware.VersionHeaderMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# ──────────────────────────────────────────────
# Database  (dj-database-url from DATABASE_URL)
# ──────────────────────────────────────────────
import dj_database_url  # noqa: E402

DATABASE_URL = config("DATABASE_URL", default="sqlite:///db.sqlite3")

DATABASES = {
    "default": dj_database_url.parse(
        DATABASE_URL,
        conn_max_age=600,
        conn_health_checks=True,
    ),
}

# ──────────────────────────────────────────────
# Password validation
# ──────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ──────────────────────────────────────────────
# Internationalization
# ──────────────────────────────────────────────
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Harare"
USE_I18N = True
USE_TZ = True

# ──────────────────────────────────────────────
# Static & Media files
# ──────────────────────────────────────────────
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "accounts.User"

# ──────────────────────────────────────────────
# Django REST Framework
# ──────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "apps.common.pagination.StandardResultsSetPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "anon": "60/minute",
        "user": "120/minute",
        "login": "10/hour",
        "register": "5/hour",
        "listing_create": "20/day",
        "image_upload": "30/day",
        "message": "60/hour",
        "password_reset": "3/hour",
        "otp_send": "3/hour",
        "otp_verify": "10/hour",
        "email_otp_send": "3/hour",
        "email_otp_verify": "10/hour",
    },
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
    ),
    "EXCEPTION_HANDLER": "apps.common.exceptions.custom_exception_handler",
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

# ──────────────────────────────────────────────
# drf-spectacular (OpenAPI / Swagger)
# ──────────────────────────────────────────────
SPECTACULAR_SETTINGS = {
    "TITLE": "Sanganai API",
    "DESCRIPTION": (
        "Zimbabwe classifieds & marketplace REST API.\n\n"
        "## Authentication\n"
        "All authenticated endpoints require a JWT Bearer token in the "
        "`Authorization` header:\n\n"
        "```\nAuthorization: Bearer <access_token>\n```\n\n"
        "Obtain tokens via **POST /api/v1/auth/login/**. "
        "Refresh via **POST /api/v1/auth/token/refresh/**.\n\n"
        "## Roles\n"
        "- **BUYER** — browse & message sellers\n"
        "- **SELLER** — create & manage listings\n"
        "- **MODERATOR** — approve / reject listings\n"
        "- **ADMIN** — full platform access\n"
    ),
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "SCHEMA_PATH_PREFIX": r"/api/v1/",
    "TAGS": [
        {"name": "Auth", "description": "Registration, login, logout, token refresh, profile"},
        {"name": "Categories", "description": "Category tree, lists, and CRUD (admin)"},
        {"name": "Listings", "description": "Marketplace listings CRUD, images, publishing"},
        {"name": "Inbox", "description": "Conversations and messaging between users"},
        {"name": "Admin", "description": "Dashboard, user management, listing moderation"},
        {"name": "Real-time", "description": (
            "WebSocket endpoint for real-time chat messaging.\n\n"
            "**Connect:** `ws://host/ws/chat/{conversation_id}/?token=<JWT>`\n\n"
            "**Auth:** Pass a valid JWT access token as the `token` query parameter.\n\n"
            "**Client → Server messages (JSON):**\n"
            "- `{\"type\": \"message\", \"content\": \"Hello!\"}` — send a chat message\n"
            "- `{\"type\": \"mark_read\", \"message_id\": 42}` — mark a message as read\n\n"
            "**Server → Client messages (JSON):**\n"
            "- `{\"type\": \"history\", \"messages\": [...]}` — last 20 messages on connect\n"
            "- `{\"type\": \"chat_message\", \"message\": {...}}` — new message broadcast\n"
            "- `{\"type\": \"messages_read\", \"message_id\": N, \"reader\": \"username\"}` — read receipt\n"
            "- `{\"type\": \"error\", \"message\": \"...\"}` — error responses\n\n"
            "**Close codes:** 4001 = unauthenticated, 4003 = not a participant."
        )},
    ],
    "SECURITY": [{"jwtAuth": []}],
    "APPEND_COMPONENTS": {
        "securitySchemes": {
            "jwtAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
            },
        },
    },
    "ENUM_NAME_OVERRIDES": {
        "UserRoleEnum": "apps.common.constants.UserRole",
        "ListingStatusEnum": "apps.common.constants.ListingStatus",
        "ListingConditionEnum": "apps.common.constants.ListingCondition",
        "CurrencyEnum": "apps.common.constants.Currency",
        "ZimbabweCityEnum": "apps.common.constants.ZimbabweCity",
    },
}

# ──────────────────────────────────────────────
# Simple JWT
# ──────────────────────────────────────────────
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
}

# ──────────────────────────────────────────────
# Cache (django-redis)
# ──────────────────────────────────────────────
REDIS_URL = config("REDIS_URL", default="redis://127.0.0.1:6379/0")

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "TIMEOUT": 300,
        "KEY_PREFIX": "Sanganai",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        },
    },
}

SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"

# ──────────────────────────────────────────────
# Celery
# ──────────────────────────────────────────────
CELERY_BROKER_URL = config("REDIS_URL", default="redis://127.0.0.1:6379/0")
CELERY_RESULT_BACKEND = CELERY_BROKER_URL
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True
# Set CELERY_TASK_ALWAYS_EAGER=True in .env to run tasks inline without a broker (local dev)
CELERY_TASK_ALWAYS_EAGER = config("CELERY_TASK_ALWAYS_EAGER", default=False, cast=bool)
CELERY_TASK_EAGER_PROPAGATES = CELERY_TASK_ALWAYS_EAGER

# ──────────────────────────────────────────────
# Django Channels (WebSocket)
# ──────────────────────────────────────────────
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [REDIS_URL],
        },
    },
}

# ──────────────────────────────────────────────
# CORS
# ──────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    default="http://localhost:3000",
    cast=Csv(),
)
CORS_ALLOW_CREDENTIALS = True

# ──────────────────────────────────────────────
# Email (overridden per environment)
# ──────────────────────────────────────────────
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default="noreply@tradlink.co.zw")

# ──────────────────────────────────────────────
# Security headers
# ──────────────────────────────────────────────
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_BROWSER_XSS_FILTER = True

# ──────────────────────────────────────────────
# Logging
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
        "verbose": {
            "format": "{asctime} {levelname} {name} [rid={request_id}] {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
            "filters": ["request_id"],
        },
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "apps": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
        "Sanganai.requests": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}
