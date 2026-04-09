"""
Business-logic service layer for accounts.

All mutations go through here — views never touch the ORM directly.
"""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.common.exceptions import ServiceError
from apps.common.sanitizers import sanitize_plain

User = get_user_model()


@transaction.atomic
def create_user(
    email: str,
    username: str,
    password: str,
    role: str,
    **kwargs,
) -> User:
    """
    Create and return a new user with sanitised text fields.

    Raises ValueError (caught by DRF) on missing required fields.
    """
    email = email.lower().strip()
    username = sanitize_plain(username)

    optional_text_fields = ("first_name", "last_name", "bio")
    for field in optional_text_fields:
        if field in kwargs and kwargs[field]:
            kwargs[field] = sanitize_plain(kwargs[field])

    return User.objects.create_user(
        email=email,
        username=username,
        password=password,
        role=role,
        **kwargs,
    )


def authenticate_user(email: str, password: str) -> tuple[User, dict]:
    """
    Authenticate by email + password. Return (user, tokens_dict).

    Raises ServiceError on invalid credentials or inactive account.
    """
    email = email.lower().strip()

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        raise ServiceError("Invalid email or password.")

    if not user.check_password(password):
        raise ServiceError("Invalid email or password.")

    if not user.is_active:
        raise ServiceError("This account has been deactivated.")

    tokens = _generate_tokens(user)
    return user, tokens


def refresh_tokens(refresh_token: str) -> dict:
    """
    Rotate a refresh token and return a new pair.

    Raises ServiceError if the token is invalid or blacklisted.
    """
    try:
        token = RefreshToken(refresh_token)
    except TokenError:
        raise ServiceError("Invalid or expired refresh token.")

    return {
        "access": str(token.access_token),
        "refresh": str(token),
    }


def blacklist_token(refresh_token: str) -> None:
    """
    Blacklist a refresh token (logout).

    Silently succeeds if the token is already blacklisted.
    """
    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
    except TokenError:
        raise ServiceError("Invalid or expired refresh token.")


@transaction.atomic
def update_user_profile(user: User, **kwargs) -> User:
    """
    Update editable profile fields on *user* and return the refreshed instance.
    """
    text_fields = ("first_name", "last_name", "bio")
    for field in text_fields:
        if field in kwargs and kwargs[field]:
            kwargs[field] = sanitize_plain(kwargs[field])

    for field, value in kwargs.items():
        setattr(user, field, value)

    user.full_clean()
    user.save(update_fields=[*kwargs.keys(), "updated_at"])
    user.refresh_from_db()
    return user


# ──────────────────────────────────────────────
# Internal helpers
# ──────────────────────────────────────────────


def _generate_tokens(user: User) -> dict:
    """Issue a fresh JWT pair for *user*."""
    token = RefreshToken.for_user(user)
    return {
        "access": str(token.access_token),
        "refresh": str(token),
    }
