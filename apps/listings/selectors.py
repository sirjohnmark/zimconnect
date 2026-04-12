"""
Read-only query selectors for listings.

Views call selectors for reads and services for writes.
"""

from __future__ import annotations

from django.contrib.postgres.search import SearchQuery, SearchRank
from django.core.cache import cache
from django.db.models import Q, QuerySet

from apps.common.cache import CacheKeys, TTL_LISTING_DETAIL, make_cache_key
from apps.common.constants import ListingStatus
from apps.common.exceptions import NotFoundError

from .models import Listing


def get_listing_by_id(listing_id: int) -> Listing:
    """
    Return a listing with related owner, category, and prefetched images.

    Cached for 5 minutes. Raises NotFoundError if not found.
    """
    cache_key = make_cache_key(CacheKeys.LISTING_DETAIL_PREFIX, listing_id)
    listing = cache.get(cache_key)
    if listing is not None:
        return listing

    try:
        listing = (
            Listing.objects
            .select_related("owner", "category")
            .prefetch_related("images")
            .get(pk=listing_id)
        )
    except Listing.DoesNotExist:
        raise NotFoundError(f"Listing with id {listing_id} not found.")

    cache.set(cache_key, listing, TTL_LISTING_DETAIL)
    return listing


def get_active_listings(filters: dict | None = None) -> QuerySet:
    """
    Return active listings, optionally filtered.

    Supported filter keys:
        category    — category id (includes subcategories)
        location    — ZimbabweCity value
        min_price   — Decimal lower bound
        max_price   — Decimal upper bound
        condition   — ListingCondition value
        search      — title icontains
        featured    — bool
        ordering    — one of: price, -price, created_at, -created_at,
                      views_count, -views_count  (default: -created_at)
    """
    qs = (
        Listing.objects
        .filter(status=ListingStatus.ACTIVE)
        .select_related("owner", "category")
        .prefetch_related("images")
    )

    if not filters:
        return qs.order_by("-created_at")

    if category_id := filters.get("category"):
        from apps.categories.models import Category

        subcategory_ids = list(
            Category.objects.filter(parent_id=category_id, is_active=True)
            .values_list("pk", flat=True)
        )
        qs = qs.filter(category_id__in=[category_id, *subcategory_ids])

    if location := filters.get("location"):
        qs = qs.filter(location=location)

    if (min_price := filters.get("min_price")) is not None:
        qs = qs.filter(price__gte=min_price)

    if (max_price := filters.get("max_price")) is not None:
        qs = qs.filter(price__lte=max_price)

    if condition := filters.get("condition"):
        qs = qs.filter(condition=condition)

    if search := filters.get("search"):
        query = SearchQuery(search, search_type="plain")
        qs = qs.filter(search_vector=query).annotate(
            rank=SearchRank("search_vector", query),
        )
        # Override ordering to rank + recency for FTS results
        if filters.get("featured"):
            qs = qs.filter(is_featured=True)
        return qs.order_by("-rank", "-created_at")

    if filters.get("featured"):
        qs = qs.filter(is_featured=True)

    allowed_orderings = {
        "price", "-price",
        "created_at", "-created_at",
        "views_count", "-views_count",
    }
    ordering = filters.get("ordering", "-created_at")
    if ordering not in allowed_orderings:
        ordering = "-created_at"

    return qs.order_by(ordering)


def get_user_listings(user, status: str | None = None) -> QuerySet:
    """Return all listings owned by *user*, optionally filtered by status."""
    qs = (
        Listing.objects
        .filter(owner=user)
        .select_related("category")
        .prefetch_related("images")
    )
    if status:
        qs = qs.filter(status=status)
    return qs.order_by("-created_at")


def get_listings_for_moderation() -> QuerySet:
    """Return draft listings ordered by creation date for moderator review."""
    return (
        Listing.objects
        .filter(status=ListingStatus.DRAFT)
        .select_related("owner", "category")
        .prefetch_related("images")
        .order_by("created_at")
    )


def search_listings_trigram(search: str, filters: dict | None = None) -> QuerySet:
    """
    Trigram similarity fallback for partial / typo-tolerant matches.

    Called when full-text search returns 0 results. Uses pg_trgm's
    TrigramSimilarity on the title field, ordered by similarity desc.
    """
    from django.contrib.postgres.search import TrigramSimilarity

    qs = (
        Listing.objects
        .filter(status=ListingStatus.ACTIVE)
        .select_related("owner", "category")
        .prefetch_related("images")
        .annotate(similarity=TrigramSimilarity("title", search))
        .filter(similarity__gte=0.15)
        .order_by("-similarity", "-created_at")
    )

    if not filters:
        return qs

    if category_id := filters.get("category"):
        from apps.categories.models import Category

        subcategory_ids = list(
            Category.objects.filter(parent_id=category_id, is_active=True)
            .values_list("pk", flat=True)
        )
        qs = qs.filter(category_id__in=[category_id, *subcategory_ids])

    if location := filters.get("location"):
        qs = qs.filter(location=location)

    if (min_price := filters.get("min_price")) is not None:
        qs = qs.filter(price__gte=min_price)

    if (max_price := filters.get("max_price")) is not None:
        qs = qs.filter(price__lte=max_price)

    if condition := filters.get("condition"):
        qs = qs.filter(condition=condition)

    if filters.get("featured"):
        qs = qs.filter(is_featured=True)

    return qs
