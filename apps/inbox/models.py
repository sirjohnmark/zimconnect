"""
Conversation and Message models for the inbox messaging system.
"""

from __future__ import annotations

from django.conf import settings
from django.db import models


class Conversation(models.Model):
    """
    A conversation between two users, optionally linked to a listing.

    participants is a M2M — always exactly two users per conversation.
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

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "conversations"
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["-updated_at"], name="idx_conv_updated"),
        ]

    def __str__(self) -> str:
        return f"Conversation {self.pk}"

    @property
    def last_message(self) -> "Message | None":
        """Return the most recent message, or None."""
        return self.messages.order_by("-created_at").first()

    def unread_count(self, user) -> int:
        """Count unread messages *not* sent by *user*."""
        return self.messages.filter(is_read=False).exclude(sender=user).count()


class Message(models.Model):
    """
    A single message within a conversation.
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
    content = models.TextField(max_length=2000)
    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "messages"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["conversation", "created_at"], name="idx_msg_conv_created"),
            models.Index(fields=["sender", "is_read"], name="idx_msg_sender_read"),
        ]

    def __str__(self) -> str:
        return f"Message {self.pk} from {self.sender_id}"
