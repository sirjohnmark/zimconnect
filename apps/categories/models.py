"""
Hierarchical category model for the marketplace.

Supports parent → child nesting with self-referencing FK.
"""

from django.db import models
from django.utils.text import slugify

from apps.common.validators import ImageSizeValidator


class Category(models.Model):
    """
    A marketplace category with optional parent for tree structure.

    Root categories have parent=None. Use PROTECT to prevent
    accidentally deleting a parent that still has children.
    """

    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True, db_index=True)
    description = models.TextField(blank=True, default="")
    parent = models.ForeignKey(
        "self",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="children",
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="Icon name or emoji (e.g. '📱', 'car', 'home').",
    )
    image = models.ImageField(
        upload_to="category_images/%Y/%m/",
        blank=True,
        default="",
        validators=[ImageSizeValidator(max_mb=5)],
    )
    is_active = models.BooleanField(default=True, db_index=True)
    display_order = models.IntegerField(default=0, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "categories"
        ordering = ["display_order", "name"]
        verbose_name = "category"
        verbose_name_plural = "categories"
        indexes = [
            models.Index(fields=["parent", "is_active"], name="idx_cat_parent_active"),
        ]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_unique_slug()
        super().save(*args, **kwargs)

    # ── Properties ────────────────────────────

    @property
    def is_root(self) -> bool:
        """True if this is a top-level category."""
        return self.parent_id is None

    def get_children_count(self) -> int:
        """Number of direct children (use when queryset is *not* annotated)."""
        return self.children.count()

    # ── Methods ───────────────────────────────

    def get_ancestors(self) -> list["Category"]:
        """
        Return a list of ancestors from root → immediate parent.

        Walks up the tree via parent FK. Capped at 10 levels to
        guard against accidental circular references.
        """
        ancestors: list[Category] = []
        current = self.parent
        depth = 0
        while current is not None and depth < 10:
            ancestors.append(current)
            current = current.parent
            depth += 1
        ancestors.reverse()
        return ancestors

    # ── Internal ──────────────────────────────

    def _generate_unique_slug(self) -> str:
        """Slugify the name. Append a counter if the slug already exists."""
        base = slugify(self.name)
        slug = base
        counter = 1
        while Category.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            slug = f"{base}-{counter}"
            counter += 1
        return slug
