"""
Reusable DRF permission classes for RBAC.

Checks ``request.user.role`` against ``apps.common.constants.UserRole``.
"""

from rest_framework.permissions import BasePermission

from apps.common.constants import UserRole


class IsAdmin(BasePermission):
    """Allow access only to users with ADMIN role."""

    message = "Admin access required."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == UserRole.ADMIN
        )

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsModerator(BasePermission):
    """Allow access to users with MODERATOR or ADMIN role."""

    message = "Moderator access required."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None)
            in {UserRole.ADMIN, UserRole.MODERATOR}
        )

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsSeller(BasePermission):
    """Allow access only to users with SELLER role."""

    message = "Seller access required."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == UserRole.SELLER
        )

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsBuyer(BasePermission):
    """Allow access only to users with BUYER role."""

    message = "Only buyers can perform this action."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == UserRole.BUYER
        )

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsBuyerOrSeller(BasePermission):
    """Allow access to normal marketplace users: BUYER or SELLER."""

    message = "Buyer or seller access required."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) in {UserRole.BUYER, UserRole.SELLER}
        )

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class RequireTwoFactor(BasePermission):
    """
    For ADMIN and MODERATOR users: block access unless 2FA is enabled.

    Applied to admin dashboard views. Regular buyers/sellers are not affected.
    Returns a 403 with code `2fa_setup_required` so the frontend can redirect
    to the security settings page instead of showing a generic error.
    """

    message = "Admin and moderator accounts must have two-factor authentication enabled."

    def has_permission(self, request, view):
        from apps.common.constants import UserRole

        if not request.user or not request.user.is_authenticated:
            return True  # Let IsAuthenticated handle unauthenticated requests.

        role = getattr(request.user, "role", None)
        if role not in {UserRole.ADMIN, UserRole.MODERATOR}:
            return True  # Non-admin users are not required to have 2FA.

        try:
            return request.user.totp_device.is_enabled
        except Exception:  # noqa: BLE001
            return False

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsAdminOrReadOnly(BasePermission):
    """
    Full access for ADMIN users; read-only for everyone else.

    Safe methods: GET, HEAD, OPTIONS.
    """

    message = "Admin access required for write operations."

    def has_permission(self, request, view):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == UserRole.ADMIN
        )

    def has_object_permission(self, request, view, obj):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == UserRole.ADMIN
        )
