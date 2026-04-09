"""
Listing-specific permission classes.
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsOwnerOrReadOnly(BasePermission):
    """
    Allow read access to anyone; write access only to the listing owner.
    """

    message = "Only the listing owner can perform this action."

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated and obj.owner_id == request.user.pk
