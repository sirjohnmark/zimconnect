"""
Shared abstract models for the platform.

SoftDeleteModel provides soft-delete behaviour: records are flagged as deleted
instead of being removed from the database.  Two managers are installed:

- ``objects`` — default, excludes soft-deleted rows (SoftDeleteManager).
- ``all_objects`` — includes soft-deleted rows (AllObjectsManager).
"""

from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils import timezone


class SoftDeleteQuerySet(models.QuerySet):
    """QuerySet with helpers for bulk soft-delete and restore."""

    def soft_delete(self, user=None):
        """Mark every row in the queryset as soft-deleted."""
        return self.update(
            is_deleted=True,
            deleted_at=timezone.now(),
            deleted_by=user,
        )

    def restore(self):
        """Restore every soft-deleted row in the queryset."""
        return self.update(
            is_deleted=False,
            deleted_at=None,
            deleted_by=None,
        )


class SoftDeleteManager(models.Manager):
    """Default manager that hides soft-deleted rows."""

    def get_queryset(self) -> SoftDeleteQuerySet:
        return SoftDeleteQuerySet(self.model, using=self._db).filter(is_deleted=False)


class AllObjectsManager(models.Manager):
    """Manager that returns *all* rows, including soft-deleted ones."""

    def get_queryset(self) -> SoftDeleteQuerySet:
        return SoftDeleteQuerySet(self.model, using=self._db)


class SoftDeleteModel(models.Model):
    """
    Abstract base providing soft-delete fields and instance helpers.

    Fields added:
        is_deleted  — boolean flag, indexed for fast filtering.
        deleted_at  — when the record was soft-deleted.
        deleted_by  — FK to User who performed the deletion.
    """

    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )

    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        abstract = True

    def soft_delete(self, user=None) -> None:
        """Flag this instance as deleted without removing the database row."""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.deleted_by = user
        self.save(update_fields=["is_deleted", "deleted_at", "deleted_by", "updated_at"])

    def restore(self) -> None:
        """Undo a soft-delete on this instance."""
        self.is_deleted = False
        self.deleted_at = None
        self.deleted_by = None
        self.save(update_fields=["is_deleted", "deleted_at", "deleted_by", "updated_at"])
