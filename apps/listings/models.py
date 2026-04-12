"""
Listing and ListingImage models for the marketplace.
"""

from __future__ import annotations

from django.conf import settings
from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import SearchVectorField
from django.db import models
from django.db.models import F
from django.utils import timezone
from django.utils.text import slugify

from apps.common.constants import Currency, ListingCondition, ListingStatus, ZimbabweCity
from apps.common.models import SoftDeleteModel
from apps.common.validators import ImageContentTypeValidator, ImageSizeValidator


class Listing(SoftDeleteModel):
    """
    A marketplace listing posted by a user.

    Status lifecycle: DRAFT → ACTIVE → SOLD / ARCHIVED / REJECTED.
    """

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="listings",
    )
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=250, unique=True, db_index=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(
        max_length=5,
        choices=Currency.choices,
        default=Currency.USD,
    )
    condition = models.CharField(
        max_length=20,
        choices=ListingCondition.choices,
    )
    status = models.CharField(
        max_length=20,
        choices=ListingStatus.choices,
        default=ListingStatus.DRAFT,
    )
    category = models.ForeignKey(
        "categories.Category",
        on_delete=models.PROTECT,
        related_name="listings",
    )
    location = models.CharField(
        max_length=30,
        choices=ZimbabweCity.choices,
    )
    is_featured = models.BooleanField(default=False)
    views_count = models.PositiveIntegerField(default=0)
    rejection_reason = models.TextField(null=True, blank=True)
    search_vector = SearchVectorField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "listings"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"], name="idx_listing_status_created"),
            models.Index(fields=["category", "status"], name="idx_listing_cat_status"),
            models.Index(fields=["owner", "status"], name="idx_listing_owner_status"),
            models.Index(fields=["location", "status"], name="idx_listing_loc_status"),
            models.Index(fields=["is_featured", "status"], name="idx_listing_feat_status"),
            GinIndex(fields=["search_vector"], name="listing_search_vector_idx"),
        ]

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_unique_slug()
        super().save(*args, **kwargs)

    def increment_views(self) -> None:
        """Atomically increment the view counter using F() to avoid race conditions."""
        Listing.all_objects.filter(pk=self.pk).update(views_count=F("views_count") + 1)

    # ── Internal ──────────────────────────────

    def _generate_unique_slug(self) -> str:
        """Slugify the title. Append a counter if the slug already exists."""
        base_slug = slugify(self.title)[:200]
        slug = base_slug
        counter = 1
        while Listing.all_objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        return slug


class ListingImage(models.Model):
    """
    An image attached to a listing.

    Max 10 images per listing (enforced in service layer).
    Exactly one image per listing should have is_primary=True.
    """

    listing = models.ForeignKey(
        Listing,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image = models.ImageField(
        upload_to="listing_images/%Y/%m/",
        validators=[
            ImageSizeValidator(max_mb=5),
            ImageContentTypeValidator(),
        ],
    )
    caption = models.CharField(max_length=200, blank=True, default="")
    display_order = models.IntegerField(default=0)
    is_primary = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "listing_images"
        ordering = ["display_order", "created_at"]

    def __str__(self) -> str:
        return f"Image {self.pk} for {self.listing_id}"
