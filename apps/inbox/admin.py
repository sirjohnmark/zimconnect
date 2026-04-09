from django.contrib import admin

from .models import Conversation, Message


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    fields = ("sender", "content", "is_read", "created_at")
    readonly_fields = ("created_at",)


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("pk", "listing", "created_at", "updated_at")
    list_filter = ("created_at",)
    search_fields = ("participants__email", "participants__username")
    readonly_fields = ("created_at", "updated_at")
    inlines = [MessageInline]
    ordering = ("-updated_at",)


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("pk", "conversation", "sender", "is_read", "created_at")
    list_filter = ("is_read", "created_at")
    search_fields = ("sender__email", "content")
    readonly_fields = ("created_at",)
    ordering = ("-created_at",)
