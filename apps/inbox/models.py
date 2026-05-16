"""
Conversation, ConversationParticipant, and Message models for the inbox messaging system.
"""

from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils import timezone


class ConversationStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    ARCHIVED = "archived", "Archived"
    BLOCKED = "blocked", "Blocked"
    CLOSED = "closed", "Closed"


class MessageType(models.TextChoices):
    TEXT = "text", "Text"
    IMAGE = "image", "Image"
    SYSTEM = "system", "System"


class MessageStatus(models.TextChoices):
    SENT = "sent", "Sent"
    DELIVERED = "delivered", "Delivered"
    READ = "read", "Read"
    FAILED = "failed", "Failed"


class ParticipantRole(models.TextChoices):
    BUYER = "buyer", "Buyer"
    SELLER = "seller", "Seller"
    ADMIN = "admin", "Admin"


class Conversation(models.Model):
    """
    A conversation between a buyer and a seller, optionally linked to a listing.
    """

    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="conversations",
    )
    listing = models.ForeignKey(
        "listings.Listing",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="conversations",
    )
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="buyer_conversations",
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="seller_conversations",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_conversations",
    )
    status = models.CharField(
        max_length=20,
        choices=ConversationStatus.choices,
        default=ConversationStatus.ACTIVE,
        db_index=True,
    )
    last_message_at = models.DateTimeField(null=True, blank=True, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "conversations"
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["-updated_at"], name="idx_conv_updated"),
            models.Index(fields=["listing", "buyer", "seller"], name="idx_conv_listing_buyer_seller"),
            models.Index(fields=["buyer", "status"], name="idx_conv_buyer_status"),
            models.Index(fields=["seller", "status"], name="idx_conv_seller_status"),
        ]

    def __str__(self) -> str:
        return f"Conversation {self.pk}"

    @property
    def last_message(self) -> "Message | None":
        return self.messages.order_by("-created_at").first()

    def unread_count(self, user) -> int:
        return (
            self.messages
            .exclude(sender=user)
            .exclude(status=MessageStatus.READ)
            .count()
        )


class ConversationParticipant(models.Model):
    """
    Per-user metadata for a conversation participant.

    Tracks read state, mute/archive status, and role within the conversation.
    """

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="conversation_participants",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="conversation_participations",
    )
    role = models.CharField(
        max_length=10,
        choices=ParticipantRole.choices,
        default=ParticipantRole.BUYER,
    )
    archived_at = models.DateTimeField(null=True, blank=True)
    muted_at = models.DateTimeField(null=True, blank=True)
    last_read_message = models.ForeignKey(
        "Message",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    last_read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "conversation_participants"
        unique_together = [("conversation", "user")]
        indexes = [
            models.Index(fields=["user", "conversation"], name="idx_cp_user_conv"),
        ]

    def __str__(self) -> str:
        return f"ConversationParticipant(conv={self.conversation_id}, user={self.user_id})"


class Message(models.Model):
    """
    A single message within a conversation.

    Status lifecycle: sent → delivered → read (or failed on error).
    """

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_messages",
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="received_messages",
    )
    content = models.TextField(max_length=2000)
    message_type = models.CharField(
        max_length=10,
        choices=MessageType.choices,
        default=MessageType.TEXT,
    )
    status = models.CharField(
        max_length=10,
        choices=MessageStatus.choices,
        default=MessageStatus.SENT,
        db_index=True,
    )
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "messages"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["conversation", "created_at"], name="idx_msg_conv_created"),
            models.Index(fields=["sender", "status"], name="idx_msg_sender_status"),
            models.Index(fields=["recipient", "status"], name="idx_msg_recipient_status"),
            models.Index(fields=["conversation", "status"], name="idx_msg_conv_status"),
        ]

    def __str__(self) -> str:
        return f"Message {self.pk} from {self.sender_id}"

    @property
    def is_read(self) -> bool:
        return self.status == MessageStatus.READ
