"""
Test settings for Sanganai API.

Uses SQLite (no network required) and disables features that need external
services. All RLS set_config() calls gracefully no-op on SQLite.
"""

from .dev import *  # noqa: F401, F403

# ──────────────────────────────────────────────
# Override database to use local SQLite for tests
# ──────────────────────────────────────────────
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "test_db.sqlite3",  # noqa: F405
        "ATOMIC_REQUESTS": True,
    },
}

# ──────────────────────────────────────────────
# Faster password hashing in tests
# ──────────────────────────────────────────────
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# ──────────────────────────────────────────────
# Suppress email during tests
# ──────────────────────────────────────────────
EMAIL_BACKEND = "django.core.mail.backends.dummy.EmailBackend"

# ──────────────────────────────────────────────
# Media — in-memory / temp dir, no S3
# ──────────────────────────────────────────────
DEFAULT_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"
MEDIA_ROOT = BASE_DIR / "test_media"  # noqa: F405

# ──────────────────────────────────────────────
# Celery — always synchronous in tests
# ──────────────────────────────────────────────
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# ──────────────────────────────────────────────
# Disable debug toolbar in tests
# ──────────────────────────────────────────────
INSTALLED_APPS = [app for app in INSTALLED_APPS if app != "debug_toolbar"]  # noqa: F405
MIDDLEWARE = [mw for mw in MIDDLEWARE if "debug_toolbar" not in mw]  # noqa: F405

# ──────────────────────────────────────────────
# Skip migrations — use syncdb-style table creation from models.
# This avoids PostgreSQL-specific RunSQL in 0003/0004 that cannot run on SQLite.
# The RLS migration (apps/common/migrations/0001_rls_setup.py) is also skipped;
# RLS policies are enforced by the application layer on SQLite anyway.
# ──────────────────────────────────────────────
MIGRATION_MODULES = {
    "accounts": None,
    "listings": None,
    "categories": None,
    "inbox": None,
    "common": None,
    "adminpanel": None,
    # Django built-ins — keep migrations enabled so auth / sessions / etc. work
}
