"""
DRF serializers for the admin panel app.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.accounts.models import SellerUpgradeRequest
from apps.common.constants import SellerUpgradeStatus
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
    total_sellers = serializers.IntegerField()
    total_buyers = serializers.IntegerField()
    total_listings = serializers.IntegerField()
    total_listings_all = serializers.IntegerField()
    total_listings_pending = serializers.IntegerField()
    total_listings_rejected = serializers.IntegerField()
    new_users_today = serializers.IntegerField()
    new_listings_today = serializers.IntegerField()
    total_conversations = serializers.IntegerField()
    total_categories = serializers.IntegerField()


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


# ──────────────────────────────────────────────
# Seller upgrade requests
# ──────────────────────────────────────────────


class _AdminUpgradeUserInlineSerializer(serializers.Serializer):
    """Minimal user info for seller upgrade request views."""

    id = serializers.IntegerField(read_only=True)
    email = serializers.EmailField(read_only=True)
    username = serializers.CharField(read_only=True)
    email_verified = serializers.BooleanField(read_only=True)
    phone_verified = serializers.BooleanField(read_only=True)


class AdminSellerRequestListSerializer(serializers.ModelSerializer):
    """Compact representation of a seller upgrade request for list views."""

    user = _AdminUpgradeUserInlineSerializer(read_only=True)

    class Meta:
        model = SellerUpgradeRequest
        fields = (
            "id",
            "user",
            "status",
            "business_name",
            "requested_at",
            "reviewed_at",
        )
        read_only_fields = fields


class AdminSellerRequestDetailSerializer(serializers.ModelSerializer):
    """Full representation of a seller upgrade request."""

    user = _AdminUpgradeUserInlineSerializer(read_only=True)
    reviewed_by = serializers.SerializerMethodField()

    class Meta:
        model = SellerUpgradeRequest
        fields = (
            "id",
            "user",
            "status",
            "business_name",
            "business_description",
            "rejection_reason",
            "requested_at",
            "reviewed_at",
            "reviewed_by",
        )
        read_only_fields = fields

    def get_reviewed_by(self, obj) -> dict | None:
        if obj.reviewed_by is None:
            return None
        return {
            "id": obj.reviewed_by_id,
            "email": obj.reviewed_by.email,
            "username": obj.reviewed_by.username,
        }


class AdminSellerRequestActionSerializer(serializers.Serializer):
    """Input for rejecting a seller upgrade request (requires a reason)."""

    reason = serializers.CharField(min_length=10, max_length=1000)


class AdminUpgradeRequestFlatSerializer(serializers.ModelSerializer):
    """
    Flat representation of a seller upgrade request for the /upgrade-requests/ endpoint.

    Matches the AdminUpgradeRequest TypeScript interface used by the frontend.
    """

    user_id = serializers.IntegerField(source="user.id", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    full_name = serializers.SerializerMethodField()
    business_type = serializers.SerializerMethodField()
    national_id_url = serializers.SerializerMethodField()
    passport_url = serializers.SerializerMethodField()
    company_registration_url = serializers.SerializerMethodField()

    class Meta:
        model = SellerUpgradeRequest
        fields = (
            "id",
            "status",
            "business_type",
            "business_name",
            "business_description",
            "rejection_reason",
            "requested_at",
            "reviewed_at",
            "user_id",
            "username",
            "email",
            "full_name",
            "national_id_url",
            "passport_url",
            "company_registration_url",
        )
        read_only_fields = fields

    def get_full_name(self, obj) -> str:
        parts = [obj.user.first_name, obj.user.last_name]
        return " ".join(p for p in parts if p).strip()

    def get_business_type(self, obj) -> str:
        return "individual"

    def get_national_id_url(self, obj) -> str | None:
        return None

    def get_passport_url(self, obj) -> str | None:
        return None

    def get_company_registration_url(self, obj) -> str | None:
        return None
