"""
DRF serializers for the inbox messaging app.
"""

from rest_framework import serializers

from apps.inbox.models import Conversation, ConversationParticipant, Message, MessageStatus


# ──────────────────────────────────────────────
# Nested helpers
# ──────────────────────────────────────────────


class _UserInlineSerializer(serializers.Serializer):
    """Minimal user info for participants and sender/recipient fields."""

    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)
    profile_picture = serializers.ImageField(read_only=True)


class _ListingInlineSerializer(serializers.Serializer):
    """Minimal listing info embedded in conversation responses."""

    id = serializers.IntegerField(read_only=True)
    title = serializers.CharField(read_only=True)
    status = serializers.CharField(read_only=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    currency = serializers.CharField(read_only=True)
    primary_image = serializers.SerializerMethodField()

    def get_primary_image(self, obj) -> str | None:
        for img in obj.images.all():
            if img.is_primary:
                return img.image.url if img.image else None
        return None


class _ParticipantMetaSerializer(serializers.ModelSerializer):
    """ConversationParticipant metadata."""

    user = _UserInlineSerializer(read_only=True)

    class Meta:
        model = ConversationParticipant
        fields = ("user", "role", "archived_at", "muted_at", "last_read_at")
        read_only_fields = fields


# ──────────────────────────────────────────────
# Message serializers
# ──────────────────────────────────────────────


class MessageSerializer(serializers.ModelSerializer):
    """Read-only representation of a message."""

    sender = _UserInlineSerializer(read_only=True)
    recipient = _UserInlineSerializer(read_only=True)

    class Meta:
        model = Message
        fields = (
            "id",
            "sender",
            "recipient",
            "content",
            "message_type",
            "status",
            "delivered_at",
            "read_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


# ──────────────────────────────────────────────
# Conversation serializers
# ──────────────────────────────────────────────


class ConversationListSerializer(serializers.ModelSerializer):
    """Compact conversation representation for the list endpoint."""

    listing = _ListingInlineSerializer(read_only=True)
    other_participant = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = (
            "id",
            "listing",
            "other_participant",
            "status",
            "last_message",
            "unread_count",
            "last_message_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_other_participant(self, obj: Conversation) -> dict | None:
        request = self.context.get("request")
        if not request:
            return None
        other = obj.participants.exclude(pk=request.user.pk).first()
        if other is None:
            return None
        return _UserInlineSerializer(other).data

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
    """Full conversation detail with participant metadata."""

    buyer = _UserInlineSerializer(read_only=True)
    seller = _UserInlineSerializer(read_only=True)
    conversation_participants = _ParticipantMetaSerializer(many=True, read_only=True)

    class Meta(ConversationListSerializer.Meta):
        fields = ConversationListSerializer.Meta.fields + (
            "buyer",
            "seller",
            "conversation_participants",
            "created_at",
        )
        read_only_fields = fields


# ──────────────────────────────────────────────
# Write serializers
# ──────────────────────────────────────────────


class StartConversationSerializer(serializers.Serializer):
    """Validate input for starting a new conversation about a listing."""

    listing_id = serializers.IntegerField()
    initial_message = serializers.CharField(max_length=2000, allow_blank=False)


class SendMessageSerializer(serializers.Serializer):
    """Validate input for sending a message in an existing conversation."""

    content = serializers.CharField(max_length=2000, allow_blank=False)
    message_type = serializers.ChoiceField(
        choices=["text", "image"],
        default="text",
        required=False,
    )


class ReportMessageSerializer(serializers.Serializer):
    """Validate input for reporting a message."""

    reason = serializers.ChoiceField(
        choices=["spam", "harassment", "fraud", "inappropriate", "other"],
    )
    details = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")
