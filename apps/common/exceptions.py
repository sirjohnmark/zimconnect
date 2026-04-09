"""
Custom DRF exceptions and a unified exception handler.

All API errors return:
    {
        "error": {
            "code": "service_error",
            "message": "Something went wrong.",
            "details": {}
        }
    }
"""

from __future__ import annotations

from typing import Any

from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


# ──────────────────────────────────────────────
# Custom exception classes
# ──────────────────────────────────────────────


class ServiceError(APIException):
    """Generic 400 — bad request caused by business-logic violation."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "A service error occurred."
    default_code = "service_error"


class ConflictError(APIException):
    """409 — resource already exists or state conflict."""

    status_code = status.HTTP_409_CONFLICT
    default_detail = "This resource conflicts with an existing one."
    default_code = "conflict"


class UnprocessableError(APIException):
    """422 — validation passed but the entity cannot be processed."""

    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_detail = "The request was well-formed but could not be processed."
    default_code = "unprocessable_entity"


class PermissionDeniedError(APIException):
    """403 — authenticated but not authorized."""

    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "You do not have permission to perform this action."
    default_code = "permission_denied"


class NotFoundError(APIException):
    """404 — resource does not exist."""

    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "The requested resource was not found."
    default_code = "not_found"


# ──────────────────────────────────────────────
# Unified exception handler
# ──────────────────────────────────────────────


def _normalise_detail(detail: Any) -> tuple[str, dict]:
    """
    Convert DRF's detail variants into (message, details) pair.

    DRF can produce:
      - str  → single message
      - list → multiple non-field errors
      - dict → field-level errors
    """
    if isinstance(detail, str):
        return detail, {}

    if isinstance(detail, list):
        messages = [str(item) for item in detail]
        return messages[0], {"non_field_errors": messages} if len(messages) > 1 else {}

    if isinstance(detail, dict):
        flat: dict[str, list[str]] = {}
        for key, value in detail.items():
            if isinstance(value, list):
                flat[key] = [str(v) for v in value]
            else:
                flat[key] = [str(value)]
        first_msg = next(
            (msgs[0] for msgs in flat.values() if msgs),
            "Validation error.",
        )
        return first_msg, flat

    return str(detail), {}


def custom_exception_handler(exc: Exception, context: dict) -> Response | None:
    """
    Wrap all DRF exceptions into a consistent envelope:

        {"error": {"code": "...", "message": "...", "details": {...}}}
    """
    response = drf_exception_handler(exc, context)
    if response is None:
        return None

    code = getattr(exc, "default_code", "error")
    message, details = _normalise_detail(response.data)

    response.data = {
        "error": {
            "code": code,
            "message": message,
            "details": details,
        },
    }
    return response
