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
