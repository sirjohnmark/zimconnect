"""
Custom DRF authentication class that sets PostgreSQL RLS session variables
immediately after JWT validation so that all ORM queries in the same request
run with the authenticated user's context enforced at the database level.

Requires ATOMIC_REQUESTS = True so that SET LOCAL (transaction-scoped) persists
for the entire request lifecycle.
"""

from __future__ import annotations

import logging

from django.db import connection
from rest_framework_simplejwt.authentication import JWTAuthentication

logger = logging.getLogger(__name__)


class RLSJWTAuthentication(JWTAuthentication):
    """
    JWT authentication that also injects RLS context into the DB session.

    After validating the JWT, sets two PostgreSQL transaction-local variables:
      app.current_user_id   — the authenticated user's PK (integer as text)
      app.current_user_role — the user's role string (BUYER / SELLER / ADMIN / MODERATOR)

    These are consumed by the RLS helper functions (app_current_user_id(),
    app_current_user_role()) defined in the database migration.
    """

    def authenticate(self, request):
        result = super().authenticate(request)
        if result is not None:
            user, _token = result
            _set_rls_context(str(user.pk), str(getattr(user, "role", "")))
        return result


def _set_rls_context(user_id: str, role: str) -> None:
    """
    Write app.current_user_id and app.current_user_role as transaction-local
    PostgreSQL settings using set_config(..., is_local=true).

    is_local=true makes the setting revert at the end of the current transaction,
    preventing leakage across pooled connections.
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT set_config('app.current_user_id', %s, true)",
                [user_id],
            )
            cursor.execute(
                "SELECT set_config('app.current_user_role', %s, true)",
                [role],
            )
    except Exception:  # noqa: BLE001
        logger.warning(
            "rls_context_set_failed user_id=%s role=%s — "
            "database may not support app.* settings (e.g. SQLite in tests)",
            user_id,
            role,
        )


def set_service_role_context() -> None:
    """
    Mark the current DB session as a trusted backend/service operation.

    Call this at the start of Celery tasks or management commands that need
    to access data across user boundaries. Sets app.service_role=true which
    the RLS policies use to bypass normal user-level restrictions.
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT set_config('app.service_role', 'true', true)")
    except Exception:  # noqa: BLE001
        logger.warning("rls_service_role_set_failed")


def clear_rls_context() -> None:
    """Reset RLS session variables to an empty / anonymous state."""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT set_config('app.current_user_id', '', true)")
            cursor.execute("SELECT set_config('app.current_user_role', '', true)")
            cursor.execute("SELECT set_config('app.service_role', '', true)")
    except Exception:  # noqa: BLE001
        pass
