"""
Read-only query selectors for accounts.

Views call selectors for reads and services for writes.
"""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import QuerySet

User = get_user_model()


def get_user_by_email(email: str) -> User | None:
    """Return the user with *email*, or None."""
    try:
        return User.objects.get(email=email.lower().strip())
    except User.DoesNotExist:
        return None


def get_user_by_id(user_id: int) -> User | None:
    """Return the user with *user_id*, or None."""
    try:
        return User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return None


def get_all_users(filters: dict | None = None) -> QuerySet:
    """
    Return a queryset of users, optionally filtered.

    Supported filter keys: role, is_active, location.
    """
    qs = User.objects.all()
    if not filters:
        return qs

    allowed_filters = {"role", "is_active", "location"}
    clean = {k: v for k, v in filters.items() if k in allowed_filters and v is not None}
    return qs.filter(**clean)


def get_verified_users() -> QuerySet:
    """Return users who verified at least one channel (email or phone)."""
    return User.objects.filter(
        models.Q(email_verified=True) | models.Q(phone_verified=True),
    )


def get_unverified_users() -> QuerySet:
    """Return users who have not verified any channel."""
    return User.objects.filter(email_verified=False, phone_verified=False)
