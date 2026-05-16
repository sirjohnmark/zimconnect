from django.contrib import admin

from .models import Conversation, ConversationParticipant, Message


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    fields = ("sender", "recipient", "content", "message_type", "status", "created_at")
    readonly_fields = ("created_at",)


class ConversationParticipantInline(admin.TabularInline):
    model = ConversationParticipant
    extra = 0
    fields = ("user", "role", "archived_at", "muted_at", "last_read_at")
    readonly_fields = ("last_read_at",)


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("pk", "listing", "buyer", "seller", "status", "last_message_at", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("participants__email", "participants__username", "listing__title")
    readonly_fields = ("created_at", "updated_at", "last_message_at")
    inlines = [ConversationParticipantInline, MessageInline]
    ordering = ("-updated_at",)


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("pk", "conversation", "sender", "message_type", "status", "created_at")
    list_filter = ("status", "message_type", "created_at")
    search_fields = ("sender__email", "content")
    readonly_fields = ("created_at", "updated_at", "delivered_at", "read_at")
    ordering = ("-created_at",)


@admin.register(ConversationParticipant)
class ConversationParticipantAdmin(admin.ModelAdmin):
    list_display = ("pk", "conversation", "user", "role", "archived_at", "muted_at")
    list_filter = ("role",)
    search_fields = ("user__email", "user__username")
