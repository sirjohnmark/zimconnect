from django.contrib import admin

from .models import Listing, ListingImage


class ListingImageInline(admin.TabularInline):
    model = ListingImage
    extra = 0
    fields = ("image", "caption", "display_order", "is_primary")


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = (
        "title", "owner", "category", "price", "currency",
        "status", "location", "is_featured", "views_count", "created_at",
    )
    list_filter = ("status", "currency", "condition", "location", "is_featured")
    search_fields = ("title", "slug", "owner__email")
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ("views_count", "created_at", "updated_at", "published_at")
    inlines = [ListingImageInline]
    ordering = ("-created_at",)


@admin.register(ListingImage)
class ListingImageAdmin(admin.ModelAdmin):
    list_display = ("pk", "listing", "caption", "display_order", "is_primary", "created_at")
    list_filter = ("is_primary",)
    ordering = ("listing", "display_order")
