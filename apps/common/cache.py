"""
Centralised cache key constants, TTLs, and helpers.

Works with django-redis in production and LocMemCache in dev.
"""

from __future__ import annotations

import logging

from django.core.cache import cache

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────
# TTLs (seconds)
# ──────────────────────────────────────────────

TTL_CATEGORY_TREE = 60 * 60       # 1 hour
TTL_LISTING_DETAIL = 60 * 5       # 5 minutes
TTL_DASHBOARD_STATS = 60 * 10     # 10 minutes


# ──────────────────────────────────────────────
# Key constants
# ──────────────────────────────────────────────

class CacheKeys:
    """All cache key prefixes and patterns in one place."""

    CATEGORY_TREE = "category_tree_v1"
    LISTING_DETAIL_PREFIX = "listing_{id}_v1"
    DASHBOARD_STATS = "admin_dashboard_stats_v1"
    LISTING_VIEWS_PREFIX = "listing_views:"


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def make_cache_key(prefix: str, *args) -> str:
    """
    Build a cache key by formatting *prefix* with *args*.

    Examples:
        make_cache_key("listing_{id}_v1", id=42) → "listing_42_v1"
        make_cache_key("listing_{id}_v1", 42)    → uses positional as 'id'
    """
    if args and not isinstance(args[0], dict):
        # Positional shorthand: extract the single placeholder name
        try:
            # e.g. "listing_{id}_v1" → fill 'id' from args[0]
            field = prefix.split("{")[1].split("}")[0]
            return prefix.format(**{field: args[0]})
        except (IndexError, KeyError):
            pass
    return prefix.format(*args)


def invalidate_pattern(pattern: str) -> None:
    """
    Delete all keys matching *pattern* (glob-style).

    Requires django-redis's delete_pattern. Falls back to a no-op with a
    warning if the cache backend doesn't support it (e.g. LocMemCache).
    """
    delete_fn = getattr(cache, "delete_pattern", None)
    if delete_fn is not None:
        delete_fn(pattern)
    else:
        logger.debug(
            "invalidate_pattern: cache backend does not support delete_pattern, "
            "pattern '%s' not cleared",
            pattern,
        )


def invalidate_listing_detail(listing_id: int) -> None:
    """Delete the cached detail for a specific listing."""
    key = make_cache_key(CacheKeys.LISTING_DETAIL_PREFIX, listing_id)
    cache.delete(key)


def invalidate_category_tree() -> None:
    """Delete the cached category tree."""
    cache.delete(CacheKeys.CATEGORY_TREE)


def invalidate_dashboard_stats() -> None:
    """Delete the cached admin dashboard stats."""
    cache.delete(CacheKeys.DASHBOARD_STATS)
