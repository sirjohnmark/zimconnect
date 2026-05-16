"""
Custom middleware for Sanganai API.
"""

from __future__ import annotations

import logging
import threading
import time
import uuid

from django.http import HttpRequest, HttpResponse

logger = logging.getLogger("Sanganai.requests")

_thread_locals = threading.local()


def get_request_id() -> str | None:
    """Return the request_id for the current thread, or None outside a request."""
    return getattr(_thread_locals, "request_id", None)


class RequestLoggingMiddleware:
    """
    Generate a UUID ``request_id`` for every request and log start + end.

    The request_id is stored in ``threading.local()`` so that any code
    running on the same thread (services, selectors, tasks kicked off
    synchronously) can retrieve it via ``get_request_id()``.

    Attach **after** AuthenticationMiddleware so ``request.user`` is set.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        request_id = uuid.uuid4().hex[:12]
        request.request_id = request_id
        _thread_locals.request_id = request_id

        user = getattr(request, "user", None)
        user_id = (
            str(user.pk) if user and getattr(user, "is_authenticated", False) else "anon"
        )

        logger.info(
            "request_start method=%s path=%s user=%s request_id=%s",
            request.method,
            request.get_full_path(),
            user_id,
            request_id,
        )

        start = time.monotonic()
        response = self.get_response(request)
        duration_ms = round((time.monotonic() - start) * 1000, 1)

        # Re-resolve user — it may have been set during the request
        user = getattr(request, "user", None)
        user_id = (
            str(user.pk) if user and getattr(user, "is_authenticated", False) else "anon"
        )

        logger.info(
            "request_end method=%s path=%s user=%s status=%d duration_ms=%.1f request_id=%s",
            request.method,
            request.get_full_path(),
            user_id,
            response.status_code,
            duration_ms,
            request_id,
        )

        _thread_locals.request_id = None
        return response


class RLSContextMiddleware:
    """
    Ensure every request starts with a clean anonymous RLS context.

    For authenticated requests the RLSJWTAuthentication class overwrites these
    values with the real user ID and role after token validation.  This
    middleware guarantees anonymous requests never accidentally inherit a prior
    user's context from a pooled connection.

    Place AFTER AuthenticationMiddleware in MIDDLEWARE so that Django's session-
    based user is available (DRF JWT auth happens inside the view, so we only
    clear stale state here).
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        _clear_rls_context_safe()
        return self.get_response(request)


def _clear_rls_context_safe() -> None:
    """Reset RLS session variables without failing on SQLite or missing DB."""
    try:
        from django.db import connection

        with connection.cursor() as cursor:
            cursor.execute("SELECT set_config('app.current_user_id', '', true)")
            cursor.execute("SELECT set_config('app.current_user_role', '', true)")
            cursor.execute("SELECT set_config('app.service_role', '', true)")
    except Exception:  # noqa: BLE001
        pass


class VersionHeaderMiddleware:
    """
    Append ``X-API-Version: 1`` to every API response.

    Placed after ``RequestLoggingMiddleware`` so it runs on the way out.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        response = self.get_response(request)
        response["X-API-Version"] = "1"
        return response
