from django.contrib import admin

from apps.categories.models import Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "parent", "is_active", "display_order", "children_count")
    list_filter = ("is_active", "parent")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("display_order", "name")
    list_editable = ("display_order", "is_active")

    @admin.display(description="Children")
    def children_count(self, obj: Category) -> int:
        return obj.children_count
