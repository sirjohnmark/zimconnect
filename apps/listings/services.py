"""
Business-logic service layer for listings.

All mutations go through here — views never touch the ORM directly.
"""

from __future__ import annotations

from django.db import transaction
from django.utils import timezone

from apps.categories.models import Category
from apps.common.constants import ListingStatus, UserRole
from apps.common.exceptions import NotFoundError, PermissionDeniedError, ServiceError
from apps.common.sanitizers import sanitize_plain

from .models import Listing, ListingImage

MAX_IMAGES_PER_LISTING = 10


@transaction.atomic
def create_listing(
    *,
    owner,
    title: str,
    description: str,
    price,
    currency: str,
    condition: str,
    category_id: int,
    location: str,
    images=None,
) -> Listing:
    """
    Create a new listing in DRAFT status.

    Validates category is active, sanitizes text inputs,
    and processes images if provided (first image set as primary).
    """
    try:
        category = Category.objects.get(pk=category_id, is_active=True)
    except Category.DoesNotExist:
        raise ServiceError("Category not found or inactive.")

    listing = Listing.objects.create(
        owner=owner,
        title=sanitize_plain(title),
        description=sanitize_plain(description),
        price=price,
        currency=currency,
        condition=condition,
        status=ListingStatus.DRAFT,
        category=category,
        location=location,
    )

    if images:
        _process_images(listing, images, is_initial=True)

    return listing


@transaction.atomic
def update_listing(listing: Listing, user, **kwargs) -> Listing:
    """
    Update fields on an existing listing. Only the owner may update.

    Sanitizes text fields and returns the refreshed instance.
    """
    _assert_owner(listing, user)

    text_fields = ("title", "description")
    for field in text_fields:
        if field in kwargs and kwargs[field]:
            kwargs[field] = sanitize_plain(kwargs[field])

    if "category_id" in kwargs:
        try:
            category = Category.objects.get(pk=kwargs.pop("category_id"), is_active=True)
        except Category.DoesNotExist:
            raise ServiceError("Category not found or inactive.")
        kwargs["category"] = category

    for field, value in kwargs.items():
        setattr(listing, field, value)

    listing.full_clean()
    listing.save(update_fields=[*kwargs.keys(), "updated_at"])
    listing.refresh_from_db()
    return listing


def publish_listing(listing: Listing, user) -> Listing:
    """Set listing status to ACTIVE and record published_at timestamp."""
    _assert_owner(listing, user)

    if listing.status != ListingStatus.DRAFT:
        raise ServiceError("Only draft listings can be published.")

    listing.status = ListingStatus.ACTIVE
    listing.published_at = timezone.now()
    listing.save(update_fields=["status", "published_at", "updated_at"])
    listing.refresh_from_db()
    return listing


def delete_listing(listing: Listing, user) -> None:
    """Delete a listing. Only the owner or an admin may do this."""
    _assert_owner_or_admin(listing, user)
    listing.delete()


@transaction.atomic
def add_images(listing: Listing, images: list) -> list[ListingImage]:
    """
    Add images to a listing. Max 10 total images enforced.

    Returns the newly created ListingImage instances.
    """
    current_count = listing.images.count()
    if current_count + len(images) > MAX_IMAGES_PER_LISTING:
        raise ServiceError(
            f"A listing can have at most {MAX_IMAGES_PER_LISTING} images. "
            f"Currently {current_count}, attempting to add {len(images)}."
        )

    return _process_images(listing, images, is_initial=(current_count == 0))


def delete_image(image: ListingImage, user) -> None:
    """Delete a listing image. Only the owner or an admin may do this."""
    _assert_owner_or_admin(image.listing, user)
    image.delete()


@transaction.atomic
def set_primary_image(listing: Listing, image_id: int, user) -> ListingImage:
    """
    Mark *image_id* as the primary image for *listing*.

    Clears is_primary on all other images for the listing.
    """
    _assert_owner(listing, user)

    try:
        image = listing.images.get(pk=image_id)
    except ListingImage.DoesNotExist:
        raise NotFoundError("Image not found on this listing.")

    listing.images.update(is_primary=False)
    image.is_primary = True
    image.save(update_fields=["is_primary"])
    return image


# ── Internal helpers ──────────────────────────


def _process_images(listing: Listing, images: list, *, is_initial: bool) -> list[ListingImage]:
    """Create ListingImage records; mark first as primary if *is_initial*."""
    created = []
    for idx, img in enumerate(images):
        created.append(
            ListingImage.objects.create(
                listing=listing,
                image=img,
                display_order=idx,
                is_primary=(is_initial and idx == 0),
            )
        )
    return created


def _assert_owner(listing: Listing, user) -> None:
    """Raise PermissionDeniedError if *user* is not the listing owner."""
    if listing.owner_id != user.pk:
        raise PermissionDeniedError("You do not own this listing.")


def _assert_owner_or_admin(listing: Listing, user) -> None:
    """Raise PermissionDeniedError if *user* is neither the owner nor an admin."""
    if listing.owner_id != user.pk and getattr(user, "role", None) != UserRole.ADMIN:
        raise PermissionDeniedError("You do not have permission to perform this action.")
