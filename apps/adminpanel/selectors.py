"""
Read-only selectors for the admin dashboard.

Aggregates data from User, Listing, and Conversation models.
"""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db.models import Count, Q, QuerySet
from django.utils import timezone

from apps.common.constants import ListingStatus
from apps.common.exceptions import NotFoundError
from apps.inbox.models import Conversation
from apps.listings.models import Listing

User = get_user_model()


def get_dashboard_stats() -> dict:
    """Aggregate key metrics for the admin dashboard."""
    today = timezone.now().date()

    total_users = User.objects.count()
    new_users_today = User.objects.filter(created_at__date=today).count()

    total_listings_active = Listing.objects.filter(status=ListingStatus.ACTIVE).count()
    total_listings_pending = Listing.objects.filter(status=ListingStatus.DRAFT).count()
    new_listings_today = Listing.objects.filter(created_at__date=today).count()

    total_conversations = Conversation.objects.count()

    return {
        "total_users": total_users,
        "total_listings": total_listings_active,
        "total_listings_pending": total_listings_pending,
        "new_users_today": new_users_today,
        "new_listings_today": new_listings_today,
        "total_conversations": total_conversations,
    }


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
