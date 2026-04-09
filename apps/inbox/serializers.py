"""
DRF serializers for the inbox messaging app.
"""

from rest_framework import serializers

from apps.inbox.models import Conversation, Message


# ──────────────────────────────────────────────
# Nested helpers
# ──────────────────────────────────────────────


class _ParticipantSerializer(serializers.Serializer):
    """Minimal user info for conversation participants."""

    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    profile_picture = serializers.ImageField(read_only=True)


class _ListingInlineSerializer(serializers.Serializer):
    """Minimal listing info embedded in conversation responses."""

    id = serializers.IntegerField(read_only=True)
    title = serializers.CharField(read_only=True)
    primary_image = serializers.SerializerMethodField()

    def get_primary_image(self, obj) -> str | None:
        for img in obj.images.all():
            if img.is_primary:
                return img.image.url if img.image else None
        return None


# ──────────────────────────────────────────────
# Message serializers
# ──────────────────────────────────────────────


class MessageSerializer(serializers.ModelSerializer):
    """Read-only representation of a message."""

    sender = _ParticipantSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ("id", "sender", "content", "is_read", "created_at")
        read_only_fields = fields


# ──────────────────────────────────────────────
# Conversation serializers
# ──────────────────────────────────────────────


class ConversationListSerializer(serializers.ModelSerializer):
    """Compact conversation representation for list endpoints."""

    participants = _ParticipantSerializer(many=True, read_only=True)
    listing = _ListingInlineSerializer(read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = (
            "id",
            "participants",
            "listing",
            "last_message",
            "unread_count",
            "updated_at",
        )
        read_only_fields = fields

    def get_last_message(self, obj: Conversation) -> dict | None:
        msg = obj.last_message
        if msg is None:
            return None
        return MessageSerializer(msg).data

    def get_unread_count(self, obj: Conversation) -> int:
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            return obj.unread_count(request.user)
        return 0


class ConversationDetailSerializer(ConversationListSerializer):
    """Full conversation with paginated messages."""

    messages = MessageSerializer(many=True, read_only=True)

    class Meta(ConversationListSerializer.Meta):
        fields = ConversationListSerializer.Meta.fields + ("messages",)
        read_only_fields = fields


# ──────────────────────────────────────────────
# Write serializers
# ──────────────────────────────────────────────


class StartConversationSerializer(serializers.Serializer):
    """Validate input for starting a new conversation."""

    recipient_id = serializers.IntegerField()
    listing_id = serializers.IntegerField(required=False, allow_null=True)
    initial_message = serializers.CharField(max_length=2000)


class SendMessageSerializer(serializers.Serializer):
    """Validate input for sending a message in an existing conversation."""

    content = serializers.CharField(max_length=2000)
