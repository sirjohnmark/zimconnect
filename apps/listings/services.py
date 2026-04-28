"""
Business-logic service layer for listings.

All mutations go through here — views never touch the ORM directly.
"""

from __future__ import annotations

import logging

from django.contrib.postgres.search import SearchVector
from django.db import transaction
from django.utils import timezone

from apps.categories.models import Category
from apps.common.cache import invalidate_dashboard_stats, invalidate_listing_detail
from apps.common.constants import ListingStatus, UserRole
from apps.common.exceptions import ConflictError, NotFoundError, PermissionDeniedError, ServiceError
from apps.common.sanitizers import sanitize_plain

from .models import Listing, ListingImage, SavedListing

logger = logging.getLogger(__name__)

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
    if not (owner.email_verified or owner.phone_verified):
        raise PermissionDeniedError(
            "Please verify your email or phone number before posting a listing.",
        )

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

    _update_search_vector(listing)

    # Process images in the background (resize, WebP conversion, thumbnails)
    from apps.listings.tasks import process_listing_images

    process_listing_images.delay(listing.id)

    logger.info(
        "listing_created id=%d owner=%d category=%s",
        listing.pk, owner.pk, category.slug,
    )
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

    # Update search vector if any text/location fields changed
    search_fields = {"title", "description", "location"}
    if search_fields & set(kwargs.keys()):
        _update_search_vector(listing)

    invalidate_listing_detail(listing.pk)
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
    invalidate_listing_detail(listing.pk)
    invalidate_dashboard_stats()
    logger.info("listing_published id=%d owner=%d", listing.pk, user.pk)
    return listing


def delete_listing(listing: Listing, user) -> None:
    """Soft-delete a listing. Only the owner or an admin may do this."""
    _assert_owner_or_admin(listing, user)
    listing.soft_delete(user)
    invalidate_listing_detail(listing.pk)
    invalidate_dashboard_stats()
    logger.info("listing_soft_deleted id=%d by_user=%d", listing.pk, user.pk)


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


# ── Saved listings (buyer wishlist) ──────────


@transaction.atomic
def save_listing(buyer, listing_id: int) -> SavedListing:
    """
    Add *listing_id* to *buyer*'s wishlist.

    - Only ACTIVE listings can be saved.
    - Duplicate saves return 409.
    """
    from apps.listings.selectors import get_saved_listing

    try:
        listing = Listing.objects.get(pk=listing_id)
    except Listing.DoesNotExist:
        raise NotFoundError(f"Listing with id {listing_id} not found.")

    if listing.status != ListingStatus.ACTIVE:
        raise ServiceError("Only active listings can be saved.")

    if get_saved_listing(buyer, listing_id) is not None:
        raise ConflictError("You have already saved this listing.")

    saved = SavedListing.objects.create(buyer=buyer, listing=listing)
    logger.info("listing_saved buyer=%d listing=%d", buyer.pk, listing_id)
    return saved


@transaction.atomic
def unsave_listing(buyer, listing_id: int) -> None:
    """Remove *listing_id* from *buyer*'s wishlist. Raises NotFoundError if not saved."""
    from apps.listings.selectors import get_saved_listing

    saved = get_saved_listing(buyer, listing_id)
    if saved is None:
        raise NotFoundError("This listing is not in your saved list.")

    saved.delete()
    logger.info("listing_unsaved buyer=%d listing=%d", buyer.pk, listing_id)


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


def _update_search_vector(listing: Listing) -> None:
    """Recompute the search_vector column for a single listing."""
    Listing.all_objects.filter(pk=listing.pk).update(
        search_vector=(
            SearchVector("title", weight="A")
            + SearchVector("description", weight="B")
            + SearchVector("location", weight="C")
        ),
    )


def _assert_owner(listing: Listing, user) -> None:
    """Raise PermissionDeniedError if *user* is not the listing owner."""
    if listing.owner_id != user.pk:
        raise PermissionDeniedError("You do not own this listing.")


def _assert_owner_or_admin(listing: Listing, user) -> None:
    """Raise PermissionDeniedError if *user* is neither the owner nor an admin."""
    if listing.owner_id != user.pk and getattr(user, "role", None) != UserRole.ADMIN:
        raise PermissionDeniedError("You do not have permission to perform this action.")
