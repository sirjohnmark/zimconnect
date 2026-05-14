"""
Business-logic service layer for categories.
"""

from __future__ import annotations

from django.db import transaction
from django.db.models.deletion import ProtectedError

from apps.common.cache import invalidate_category_tree
from apps.common.exceptions import ConflictError
from apps.common.sanitizers import sanitize_plain

from .models import Category


@transaction.atomic
def create_category(name: str, parent_id: int | None = None, **kwargs) -> Category:
    """Create a new category, optionally nested under *parent_id*."""
    parent = None
    if parent_id is not None:
        parent = Category.objects.get(pk=parent_id)

    name = sanitize_plain(name)
    if "description" in kwargs and kwargs["description"]:
        kwargs["description"] = sanitize_plain(kwargs["description"])

    category = Category.objects.create(name=name, parent=parent, **kwargs)
    invalidate_category_tree()
    return category


@transaction.atomic
def update_category(category: Category, **kwargs) -> Category:
    """Update fields on an existing category and return refreshed instance."""
    text_fields = ("name", "description")
    for field in text_fields:
        if field in kwargs and kwargs[field]:
            kwargs[field] = sanitize_plain(kwargs[field])

    for field, value in kwargs.items():
        setattr(category, field, value)

    category.full_clean()
    category.save(update_fields=[*kwargs.keys(), "updated_at"])
    category.refresh_from_db()
    invalidate_category_tree()
    return category


@transaction.atomic
def toggle_category_active(category: Category) -> Category:
    """Flip the is_active flag and return the updated category."""
    category.is_active = not category.is_active
    category.save(update_fields=["is_active", "updated_at"])
    category.refresh_from_db()
    invalidate_category_tree()
    return category


@transaction.atomic
def delete_category(category: Category) -> None:
    """Permanently delete a category when it is not referenced elsewhere."""
    try:
        category.delete()
    except ProtectedError:
        raise ConflictError(
            "This category cannot be deleted because it has child categories or listings."
        )
    invalidate_category_tree()
