"""
DRF serializers for the admin panel app.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.listings.models import Listing

User = get_user_model()


# ──────────────────────────────────────────────
# Nested helpers
# ──────────────────────────────────────────────


class _AdminOwnerInlineSerializer(serializers.Serializer):
    """Minimal owner info for moderation views."""

    email = serializers.EmailField(read_only=True)
    username = serializers.CharField(read_only=True)


class _AdminCategoryInlineSerializer(serializers.Serializer):
    """Minimal category info."""

    name = serializers.CharField(read_only=True)
    slug = serializers.SlugField(read_only=True)


# ──────────────────────────────────────────────
# Dashboard
# ──────────────────────────────────────────────


class AdminDashboardSerializer(serializers.Serializer):
    """Aggregate stats for the admin dashboard."""

    total_users = serializers.IntegerField()
    total_listings = serializers.IntegerField()
    total_listings_pending = serializers.IntegerField()
    new_users_today = serializers.IntegerField()
    new_listings_today = serializers.IntegerField()
    total_conversations = serializers.IntegerField()


# ──────────────────────────────────────────────
# User management
# ──────────────────────────────────────────────


class AdminUserListSerializer(serializers.ModelSerializer):
    """Compact user representation for admin list views."""

    listings_count = serializers.IntegerField(read_only=True)
    is_verified = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "username",
            "role",
            "is_active",
            "email_verified",
            "phone_verified",
            "is_verified",
            "listings_count",
            "created_at",
        )
        read_only_fields = fields

    def get_is_verified(self, obj) -> bool:
        return obj.email_verified or obj.phone_verified


class AdminUserDetailSerializer(serializers.ModelSerializer):
    """Full user detail for admin views."""

    listings_count = serializers.IntegerField(read_only=True)
    conversations_count = serializers.IntegerField(read_only=True)
    is_verified = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "phone",
            "role",
            "profile_picture",
            "bio",
            "location",
            "is_active",
            "is_staff",
            "email_verified",
            "phone_verified",
            "is_verified",
            "listings_count",
            "conversations_count",
            "last_login",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_is_verified(self, obj) -> bool:
        return obj.email_verified or obj.phone_verified


class AdminUserUpdateSerializer(serializers.Serializer):
    """Fields an admin can update on a user."""

    is_active = serializers.BooleanField(required=False)
    role = serializers.CharField(required=False)


# ──────────────────────────────────────────────
# Listing moderation
# ──────────────────────────────────────────────


class AdminListingModerationSerializer(serializers.ModelSerializer):
    """Listing representation for moderation queue."""

    owner = _AdminOwnerInlineSerializer(read_only=True)
    category = _AdminCategoryInlineSerializer(read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = (
            "id",
            "title",
            "description",
            "owner",
            "category",
            "location",
            "price",
            "currency",
            "condition",
            "status",
            "rejection_reason",
            "primary_image",
            "created_at",
        )
        read_only_fields = fields

    def get_primary_image(self, obj: Listing) -> str | None:
        for img in obj.images.all():
            if img.is_primary:
                return img.image.url if img.image else None
        return None


class ModerationActionSerializer(serializers.Serializer):
    """Input for approve/reject moderation actions."""

    reason = serializers.CharField(max_length=1000, required=False, allow_blank=True, default="")


# ──────────────────────────────────────────────
# Soft-delete views
# ──────────────────────────────────────────────


class _AdminDeletedByInlineSerializer(serializers.Serializer):
    """Minimal info about the user who performed a soft-delete."""

    id = serializers.IntegerField(read_only=True)
    email = serializers.EmailField(read_only=True)
    username = serializers.CharField(read_only=True)


class AdminDeletedListingSerializer(serializers.ModelSerializer):
    """Listing representation for the deleted-listings admin view."""

    owner = _AdminOwnerInlineSerializer(read_only=True)
    category = _AdminCategoryInlineSerializer(read_only=True)
    deleted_by = _AdminDeletedByInlineSerializer(read_only=True)

    class Meta:
        model = Listing
        fields = (
            "id",
            "title",
            "owner",
            "category",
            "location",
            "price",
            "currency",
            "status",
            "is_deleted",
            "deleted_at",
            "deleted_by",
            "created_at",
        )
        read_only_fields = fields


class AdminDeletedUserSerializer(serializers.ModelSerializer):
    """User representation for the deleted-users admin view."""

    listings_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "username",
            "role",
            "is_active",
            "is_deleted",
            "deleted_at",
            "listings_count",
            "created_at",
        )
        read_only_fields = fields
