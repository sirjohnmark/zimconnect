"""
Read-only selectors for the admin dashboard.

Aggregates data from User, Listing, and Conversation models.
"""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db.models import Count, Q, QuerySet
from django.utils import timezone

from apps.accounts.models import SellerUpgradeRequest
from apps.categories.models import Category
from apps.common.cache import CacheKeys, TTL_DASHBOARD_STATS
from apps.common.constants import ListingStatus, SellerUpgradeStatus, UserRole
from apps.common.exceptions import NotFoundError
from apps.inbox.models import Conversation
from apps.listings.models import Listing

User = get_user_model()


def get_dashboard_stats() -> dict:
    """Aggregate key metrics for the admin dashboard. Cached for 10 minutes."""
    data = cache.get(CacheKeys.DASHBOARD_STATS)
    if data is not None:
        return data

    today = timezone.now().date()

    total_users = User.objects.count()
    total_sellers = User.objects.filter(role=UserRole.SELLER).count()
    total_buyers = User.objects.filter(role=UserRole.BUYER).count()
    new_users_today = User.objects.filter(created_at__date=today).count()

    total_listings_active = Listing.objects.filter(status=ListingStatus.ACTIVE).count()
    total_listings_pending = Listing.objects.filter(status=ListingStatus.DRAFT).count()
    total_listings_rejected = Listing.objects.filter(status=ListingStatus.REJECTED).count()
    total_listings_all = Listing.objects.count()
    new_listings_today = Listing.objects.filter(created_at__date=today).count()

    total_conversations = Conversation.objects.count()
    total_categories = Category.objects.count()

    data = {
        "total_users": total_users,
        "total_sellers": total_sellers,
        "total_buyers": total_buyers,
        "total_listings": total_listings_active,
        "total_listings_all": total_listings_all,
        "total_listings_pending": total_listings_pending,
        "total_listings_rejected": total_listings_rejected,
        "new_users_today": new_users_today,
        "new_listings_today": new_listings_today,
        "total_conversations": total_conversations,
        "total_categories": total_categories,
    }
    cache.set(CacheKeys.DASHBOARD_STATS, data, TTL_DASHBOARD_STATS)
    return data


def get_all_users(filters: dict | None = None) -> QuerySet:
    """
    Return users annotated with listings_count, optionally filtered.

    Supported filter keys: role, is_active, search (email/username icontains).
    """
    qs = User.objects.annotate(listings_count=Count("listings")).order_by("-created_at")

    if not filters:
        return qs

    if role := filters.get("role"):
        qs = qs.filter(role=role)

    if (is_active := filters.get("is_active")) is not None:
        qs = qs.filter(is_active=is_active)

    if search := filters.get("search"):
        qs = qs.filter(
            Q(email__icontains=search) | Q(username__icontains=search)
        )

    return qs


def get_listings_for_moderation() -> QuerySet:
    """Return draft listings ordered oldest first for moderator review."""
    return (
        Listing.objects
        .filter(status=ListingStatus.DRAFT)
        .select_related("owner", "category")
        .prefetch_related("images")
        .order_by("created_at")
    )


def get_listing_moderation_detail(listing_id: int) -> Listing:
    """Return a single listing for moderation review."""
    try:
        return (
            Listing.objects
            .select_related("owner", "category")
            .prefetch_related("images")
            .get(pk=listing_id)
        )
    except Listing.DoesNotExist:
        raise NotFoundError(f"Listing with id {listing_id} not found.")


def get_deleted_listings() -> QuerySet:
    """Return soft-deleted listings for admin restore view."""
    return (
        Listing.all_objects
        .filter(is_deleted=True)
        .select_related("owner", "category", "deleted_by")
        .prefetch_related("images")
        .order_by("-deleted_at")
    )


def get_deleted_listing_by_id(listing_id: int) -> Listing:
    """Return a single soft-deleted listing. Raises NotFoundError if not found."""
    try:
        return (
            Listing.all_objects
            .select_related("owner", "category", "deleted_by")
            .prefetch_related("images")
            .get(pk=listing_id, is_deleted=True)
        )
    except Listing.DoesNotExist:
        raise NotFoundError(f"Deleted listing with id {listing_id} not found.")


def get_seller_upgrade_requests(filters: dict | None = None) -> QuerySet:
    """
    Return seller upgrade requests ordered newest first.

    Supported filter keys: status (PENDING/APPROVED/REJECTED), search (email/username).
    """
    qs = (
        SellerUpgradeRequest.objects
        .select_related("user", "reviewed_by")
        .order_by("-requested_at")
    )

    if not filters:
        return qs

    if status_filter := filters.get("status"):
        qs = qs.filter(status=status_filter)

    if search := filters.get("search"):
        qs = qs.filter(
            Q(user__email__icontains=search) | Q(user__username__icontains=search)
        )

    return qs


def get_seller_upgrade_request_by_id(request_id: int) -> SellerUpgradeRequest:
    """Return a single seller upgrade request. Raises NotFoundError if not found."""
    try:
        return (
            SellerUpgradeRequest.objects
            .select_related("user", "reviewed_by")
            .get(pk=request_id)
        )
    except SellerUpgradeRequest.DoesNotExist:
        raise NotFoundError(f"Seller upgrade request with id {request_id} not found.")


def get_deleted_users() -> QuerySet:
    """Return soft-deleted users for admin view."""
    return (
        User.all_objects
        .filter(is_deleted=True)
        .annotate(listings_count=Count("listings"))
        .order_by("-deleted_at")
    )
