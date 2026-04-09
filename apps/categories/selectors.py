"""
Read-only selectors for categories.
"""

from __future__ import annotations

from django.db.models import Count, QuerySet

from apps.common.exceptions import NotFoundError

from .models import Category


def get_category_by_id(category_id: int) -> Category:
    """Return category or raise NotFoundError."""
    try:
        return Category.objects.annotate(
            children_count=Count("children"),
        ).get(pk=category_id)
    except Category.DoesNotExist:
        raise NotFoundError(f"Category with id {category_id} not found.")


def get_category_by_slug(slug: str) -> Category:
    """Return category by slug or raise NotFoundError."""
    try:
        return Category.objects.annotate(
            children_count=Count("children"),
        ).get(slug=slug)
    except Category.DoesNotExist:
        raise NotFoundError(f"Category '{slug}' not found.")


def get_root_categories() -> QuerySet:
    """Active root categories (parent=None), ordered by display_order."""
    return (
        Category.objects.filter(parent__isnull=True, is_active=True)
        .annotate(children_count=Count("children"))
        .order_by("display_order", "name")
    )


def get_active_categories() -> QuerySet:
    """All active categories, flat."""
    return (
        Category.objects.filter(is_active=True)
        .annotate(children_count=Count("children"))
        .order_by("display_order", "name")
    )


def get_category_tree() -> QuerySet:
    """
    Root categories with children prefetched for tree serialization.

    The serializer recurses into children; prefetch_related reduces queries.
    """
    return (
        Category.objects.filter(parent__isnull=True, is_active=True)
        .prefetch_related("children", "children__children")
        .order_by("display_order", "name")
    )
