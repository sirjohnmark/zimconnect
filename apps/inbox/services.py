"""
Business-logic service layer for inbox messaging.

All mutations go through here — views never touch the ORM directly.
"""

from __future__ import annotations

import logging

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from apps.common.exceptions import NotFoundError, PermissionDeniedError, ServiceError
from apps.common.sanitizers import sanitize_plain

from .models import Conversation, Message

User = get_user_model()

logger = logging.getLogger(__name__)


@transaction.atomic
def get_or_create_conversation(sender, recipient, listing=None) -> tuple[Conversation, bool]:
    """
    Return an existing conversation between sender and recipient
    (optionally scoped to a listing), or create a new one.

    Raises ServiceError if sender == recipient.
    """
    if sender.pk == recipient.pk:
        raise ServiceError("You cannot start a conversation with yourself.")

    # Look for an existing conversation with both participants
    qs = Conversation.objects.filter(participants=sender).filter(participants=recipient)
    if listing is not None:
        qs = qs.filter(listing=listing)
    else:
        qs = qs.filter(listing__isnull=True)

    existing = qs.first()
    if existing is not None:
        return existing, False

    conversation = Conversation.objects.create(listing=listing)
    conversation.participants.add(sender, recipient)
    logger.info(
        "conversation_created id=%d sender=%d recipient=%d listing=%s",
        conversation.pk, sender.pk, recipient.pk,
        listing.pk if listing else "none",
    )
    return conversation, True


@transaction.atomic
def send_message(conversation: Conversation, sender, content: str) -> Message:
    """
    Send a message in *conversation*.

    Verifies sender is a participant, sanitizes content,
    and bumps conversation.updated_at.
    """
    if not conversation.participants.filter(pk=sender.pk).exists():
        raise PermissionDeniedError("You are not a participant in this conversation.")

    content = sanitize_plain(content)
    if not content:
        raise ServiceError("Message content cannot be empty.")

    message = Message.objects.create(
        conversation=conversation,
        sender=sender,
        content=content,
    )

    # Bump updated_at so the conversation floats to the top
    Conversation.objects.filter(pk=conversation.pk).update(updated_at=timezone.now())

    logger.info(
        "message_sent conversation=%d sender=%d",
        conversation.pk, sender.pk,
    )
    return message


def mark_message_read(message: Message, user) -> Message:
    """
    Mark a single message as read. Only the recipient (non-sender) can do this.
    """
    if message.sender_id == user.pk:
        raise ServiceError("You cannot mark your own message as read.")

    if not message.conversation.participants.filter(pk=user.pk).exists():
        raise PermissionDeniedError("You are not a participant in this conversation.")

    message.is_read = True
    message.save(update_fields=["is_read"])
    return message


def mark_conversation_read(conversation: Conversation, user) -> int:
    """
    Mark all unread messages in *conversation* as read for *user*.

    Only marks messages *not* sent by the user. Returns count marked.
    """
    return conversation.messages.filter(
        is_read=False,
    ).exclude(
        sender=user,
    ).update(is_read=True)


def get_unread_count(user) -> int:
    """Total unread messages across all conversations for *user*."""
    return Message.objects.filter(
        conversation__participants=user,
        is_read=False,
    ).exclude(
        sender=user,
    ).count()
