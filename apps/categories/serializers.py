"""
DRF serializers for categories — flat, detail, recursive tree, and admin CRUD.
"""

from rest_framework import serializers

from apps.categories.models import Category


class CategoryListSerializer(serializers.ModelSerializer):
    """Flat representation used in lists and as nested children."""

    children_count = serializers.IntegerField(read_only=True)
    parent_id = serializers.PrimaryKeyRelatedField(
        source="parent",
        read_only=True,
    )

    class Meta:
        model = Category
        fields = (
            "id",
            "name",
            "slug",
            "icon",
            "parent_id",
            "children_count",
            "is_active",
        )


class CategoryDetailSerializer(serializers.ModelSerializer):
    """Full detail with direct children nested as CategoryListSerializer."""

    children = CategoryListSerializer(many=True, read_only=True)
    children_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "parent",
            "icon",
            "image",
            "is_active",
            "display_order",
            "children",
            "children_count",
            "created_at",
            "updated_at",
        )


class CategoryTreeSerializer(serializers.ModelSerializer):
    """
    Recursive serializer for the full category tree.

    Each node embeds its active children as a nested list.
    """

    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ("id", "name", "slug", "icon", "children")

    def get_children(self, obj: Category) -> list[dict]:
        children_qs = obj.children.filter(is_active=True).order_by("display_order", "name")
        return CategoryTreeSerializer(children_qs, many=True).data


class CategoryCreateUpdateSerializer(serializers.ModelSerializer):
    """Admin serializer for creating / updating categories."""

    class Meta:
        model = Category
        fields = (
            "name",
            "slug",
            "description",
            "parent",
            "icon",
            "image",
            "is_active",
            "display_order",
        )
        extra_kwargs = {
            "slug": {"required": False, "allow_blank": True},
        }

    def validate_parent(self, value: Category | None) -> Category | None:
        """Prevent setting a category as its own parent."""
        if value and self.instance and value.pk == self.instance.pk:
            raise serializers.ValidationError("A category cannot be its own parent.")
        return value
