"""
DRF serializers for the listings app.
"""

from rest_framework import serializers

from apps.common.constants import Currency, ListingCondition, ZimbabweCity
from apps.listings.models import Listing, ListingImage, SavedListing


# ──────────────────────────────────────────────
# Image serializers
# ──────────────────────────────────────────────


class ListingImageSerializer(serializers.ModelSerializer):
    """Read-only representation of a listing image."""

    class Meta:
        model = ListingImage
        fields = ("id", "image", "caption", "display_order", "is_primary")
        read_only_fields = fields


class ListingImageUploadSerializer(serializers.Serializer):
    """Validate image upload payload (1–10 images)."""

    images = serializers.ListField(
        child=serializers.ImageField(),
        min_length=1,
        max_length=10,
    )


# ──────────────────────────────────────────────
# Nested helpers
# ──────────────────────────────────────────────


class _CategoryInlineSerializer(serializers.Serializer):
    """Minimal category info embedded in listing responses."""

    name = serializers.CharField(read_only=True)
    slug = serializers.SlugField(read_only=True)


class _OwnerInlineSerializer(serializers.Serializer):
    """Minimal owner info for list views."""

    username = serializers.CharField(read_only=True)


class _OwnerDetailSerializer(serializers.Serializer):
    """Expanded owner info for detail views."""

    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    profile_picture = serializers.ImageField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)


# ──────────────────────────────────────────────
# Listing read serializers
# ──────────────────────────────────────────────


class ListingListSerializer(serializers.ModelSerializer):
    """Compact listing representation for list endpoints."""

    category = _CategoryInlineSerializer(read_only=True)
    owner = _OwnerInlineSerializer(read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = (
            "id",
            "title",
            "slug",
            "price",
            "currency",
            "condition",
            "status",
            "location",
            "category",
            "owner",
            "primary_image",
            "is_featured",
            "views_count",
            "created_at",
        )
        read_only_fields = fields

    def get_primary_image(self, obj: Listing) -> str | None:
        """Return the URL of the first primary image, or None."""
        # Works with prefetched images to avoid extra queries
        for img in obj.images.all():
            if img.is_primary:
                return img.image.url if img.image else None
        return None


class ListingDetailSerializer(serializers.ModelSerializer):
    """Full listing detail with all images and expanded owner."""

    category = _CategoryInlineSerializer(read_only=True)
    owner = _OwnerDetailSerializer(read_only=True)
    images = ListingImageSerializer(many=True, read_only=True)

    class Meta:
        model = Listing
        fields = (
            "id",
            "title",
            "slug",
            "description",
            "price",
            "currency",
            "condition",
            "status",
            "location",
            "category",
            "owner",
            "images",
            "is_featured",
            "views_count",
            "created_at",
            "updated_at",
            "published_at",
        )
        read_only_fields = fields


# ──────────────────────────────────────────────
# Listing write serializers
# ──────────────────────────────────────────────


class ListingCreateSerializer(serializers.Serializer):
    """Validate listing creation input. Actual creation is in services.py."""

    title = serializers.CharField(max_length=200)
    description = serializers.CharField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.ChoiceField(choices=Currency.choices, default=Currency.USD)
    condition = serializers.ChoiceField(choices=ListingCondition.choices)
    category_id = serializers.IntegerField()
    location = serializers.ChoiceField(choices=ZimbabweCity.choices)


class SavedListingSerializer(serializers.ModelSerializer):
    """Saved listing response — embeds full listing detail."""

    listing = ListingListSerializer(read_only=True)

    class Meta:
        model = SavedListing
        fields = ("id", "listing", "saved_at")
        read_only_fields = fields


class ListingUpdateSerializer(serializers.Serializer):
    """Validate listing update input. All fields optional (partial)."""

    title = serializers.CharField(max_length=200, required=False)
    description = serializers.CharField(required=False)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    currency = serializers.ChoiceField(choices=Currency.choices, required=False)
    condition = serializers.ChoiceField(choices=ListingCondition.choices, required=False)
    category_id = serializers.IntegerField(required=False)
    location = serializers.ChoiceField(choices=ZimbabweCity.choices, required=False)
