"""
Custom middleware for ZimConnect API.
"""

from __future__ import annotations

import logging
import threading
import time
import uuid

from django.http import HttpRequest, HttpResponse

logger = logging.getLogger("zimconnect.requests")

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
