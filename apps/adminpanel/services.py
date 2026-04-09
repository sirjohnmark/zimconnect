"""
Business-logic service layer for admin operations.

Moderation actions and user management.
"""

from __future__ import annotations

from django.utils import timezone

from apps.common.constants import ListingStatus, UserRole
from apps.common.exceptions import PermissionDeniedError, ServiceError
from apps.common.sanitizers import sanitize_plain
from apps.listings.models import Listing


def approve_listing(listing: Listing, admin_user) -> Listing:
    """Set listing status to ACTIVE and record published_at."""
    _assert_moderator(admin_user)

    if listing.status != ListingStatus.DRAFT:
        raise ServiceError("Only draft listings can be approved.")

    listing.status = ListingStatus.ACTIVE
    listing.published_at = timezone.now()
    listing.rejection_reason = None
    listing.save(update_fields=["status", "published_at", "rejection_reason", "updated_at"])
    listing.refresh_from_db()
    return listing


def reject_listing(listing: Listing, admin_user, reason: str) -> Listing:
    """Set listing status to REJECTED with a reason."""
    _assert_moderator(admin_user)

    if listing.status not in {ListingStatus.DRAFT, ListingStatus.ACTIVE}:
        raise ServiceError("Only draft or active listings can be rejected.")

    reason = sanitize_plain(reason)
    if not reason:
        raise ServiceError("A rejection reason is required.")

    listing.status = ListingStatus.REJECTED
    listing.rejection_reason = reason
    listing.save(update_fields=["status", "rejection_reason", "updated_at"])
    listing.refresh_from_db()
    return listing


def deactivate_user(user, admin_user) -> object:
    """Deactivate a user account."""
    _assert_admin(admin_user)

    if user.pk == admin_user.pk:
        raise ServiceError("You cannot deactivate your own account.")

    user.is_active = False
    user.save(update_fields=["is_active", "updated_at"])
    user.refresh_from_db()
    return user


def activate_user(user, admin_user) -> object:
    """Activate a user account."""
    _assert_admin(admin_user)

    user.is_active = True
    user.save(update_fields=["is_active", "updated_at"])
    user.refresh_from_db()
    return user


def change_user_role(user, admin_user, new_role: str) -> object:
    """Change a user's role. Admin cannot change their own role."""
    _assert_admin(admin_user)

    if user.pk == admin_user.pk:
        raise ServiceError("You cannot change your own role.")

    if new_role not in {choice[0] for choice in UserRole.choices}:
        raise ServiceError(f"Invalid role: {new_role}")

    user.role = new_role
    user.save(update_fields=["role", "updated_at"])
    user.refresh_from_db()
    return user


# ── Internal helpers ──────────────────────────


def _assert_admin(user) -> None:
    """Raise PermissionDeniedError if user is not ADMIN."""
    if getattr(user, "role", None) != UserRole.ADMIN:
        raise PermissionDeniedError("Admin access required.")


def _assert_moderator(user) -> None:
    """Raise PermissionDeniedError if user is not ADMIN or MODERATOR."""
    if getattr(user, "role", None) not in {UserRole.ADMIN, UserRole.MODERATOR}:
        raise PermissionDeniedError("Moderator access required.")
