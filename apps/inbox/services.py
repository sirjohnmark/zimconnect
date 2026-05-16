"""
Business-logic service layer for inbox messaging.

All mutations go through here — views never touch the ORM directly.
"""

from __future__ import annotations

import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db import transaction
from django.utils import timezone

from apps.common.constants import ListingStatus
from apps.common.exceptions import NotFoundError, PermissionDeniedError, ServiceError
from apps.common.sanitizers import sanitize_plain

from .models import (
    Conversation,
    ConversationParticipant,
    ConversationStatus,
    Message,
    MessageStatus,
    MessageType,
    ParticipantRole,
)

logger = logging.getLogger(__name__)


# ── Conversation creation ────────────────────────────────────────────


@transaction.atomic
def get_or_create_conversation(sender, listing) -> tuple[Conversation, bool]:
    """
    Find or create a conversation between *sender* (buyer) and the listing seller.

    Validates:
    - sender is not the listing owner (no self-messaging)
    - listing is ACTIVE (cannot message about inactive listings)

    Returns ``(conversation, created)`` — ``created`` is False if reused.
    """
    from apps.listings.models import Listing

    if listing.owner_id == sender.pk:
        raise ServiceError("You cannot start a conversation about your own listing.")

    if listing.status != ListingStatus.ACTIVE:
        raise ServiceError("You can only message sellers about active listings.")

    if listing.is_deleted:
        raise ServiceError("This listing no longer exists.")

    recipient = listing.owner

    # Reuse an existing conversation for the same (buyer, seller, listing) triplet
    existing = (
        Conversation.objects
        .filter(participants=sender)
        .filter(participants=recipient)
        .filter(listing=listing)
        .first()
    )
    if existing is not None:
        return existing, False

    conversation = Conversation.objects.create(
        listing=listing,
        buyer=sender,
        seller=recipient,
        created_by=sender,
        status=ConversationStatus.ACTIVE,
    )
    conversation.participants.add(sender, recipient)

    # Create per-user participant metadata
    ConversationParticipant.objects.create(
        conversation=conversation,
        user=sender,
        role=ParticipantRole.BUYER,
    )
    ConversationParticipant.objects.create(
        conversation=conversation,
        user=recipient,
        role=ParticipantRole.SELLER,
    )

    logger.info(
        "conversation_created id=%d buyer=%d seller=%d listing=%d",
        conversation.pk, sender.pk, recipient.pk, listing.pk,
    )
    return conversation, True


def _ensure_participant_metadata(conversation: Conversation, user) -> None:
    """Create ConversationParticipant if it does not exist (back-fills legacy conversations)."""
    from apps.common.constants import UserRole

    role = ParticipantRole.BUYER
    if conversation.seller_id == user.pk:
        role = ParticipantRole.SELLER
    elif user.role in ("ADMIN", "MODERATOR"):
        role = ParticipantRole.ADMIN

    ConversationParticipant.objects.get_or_create(
        conversation=conversation,
        user=user,
        defaults={"role": role},
    )


# ── Send message ─────────────────────────────────────────────────────


@transaction.atomic
def send_message(
    conversation: Conversation,
    sender,
    content: str,
    message_type: str = MessageType.TEXT,
) -> Message:
    """
    Send a message in *conversation*.

    - Validates sender is a participant and conversation is not blocked/closed.
    - Sanitizes content.
    - Sets recipient to the other participant.
    - Bumps conversation.updated_at and last_message_at.
    - Fires async notification task.
    - Broadcasts to WebSocket group.
    """
    if not conversation.participants.filter(pk=sender.pk).exists():
        raise PermissionDeniedError("You are not a participant in this conversation.")

    if conversation.status in (ConversationStatus.BLOCKED, ConversationStatus.CLOSED):
        raise ServiceError("This conversation is no longer active.")

    content = sanitize_plain(content)
    if not content:
        raise ServiceError("Message content cannot be empty.")

    recipient = conversation.participants.exclude(pk=sender.pk).first()

    now = timezone.now()
    message = Message.objects.create(
        conversation=conversation,
        sender=sender,
        recipient=recipient,
        content=content,
        message_type=message_type,
        status=MessageStatus.SENT,
    )

    Conversation.objects.filter(pk=conversation.pk).update(
        updated_at=now,
        last_message_at=now,
    )

    logger.info(
        "message_sent conversation=%d sender=%d message=%d",
        conversation.pk, sender.pk, message.pk,
    )

    # Async notification (non-blocking — failure does not roll back the message)
    try:
        from apps.inbox.tasks import send_new_message_notification
        send_new_message_notification.delay(message.pk)
    except Exception:
        logger.exception("Failed to queue notification for message=%d", message.pk)

    # Broadcast to WebSocket channel group
    _broadcast_new_message(conversation.pk, message)

    return message


# ── Delivered / read ─────────────────────────────────────────────────


@transaction.atomic
def mark_message_delivered(message: Message, user) -> Message:
    """
    Mark a single message as delivered. Only the recipient can do this.
    """
    if message.recipient_id and message.recipient_id != user.pk:
        raise PermissionDeniedError("Only the recipient can mark a message as delivered.")
    if message.sender_id == user.pk:
        raise ServiceError("You cannot mark your own message as delivered.")

    if message.status != MessageStatus.SENT:
        return message  # Already delivered or read — idempotent

    now = timezone.now()
    Message.objects.filter(pk=message.pk).update(
        status=MessageStatus.DELIVERED,
        delivered_at=now,
    )
    message.status = MessageStatus.DELIVERED
    message.delivered_at = now

    _broadcast_status_update(message.conversation_id, message.pk, MessageStatus.DELIVERED)
    return message


@transaction.atomic
def mark_conversation_delivered(conversation: Conversation, user) -> int:
    """
    Mark all SENT messages in *conversation* (not sent by *user*) as delivered.

    Returns the count of updated messages.
    """
    now = timezone.now()
    updated = Message.objects.filter(
        conversation=conversation,
        status=MessageStatus.SENT,
        recipient=user,
    ).update(
        status=MessageStatus.DELIVERED,
        delivered_at=now,
    )
    if updated:
        _broadcast_batch_status(conversation.pk, MessageStatus.DELIVERED, user.pk)
    return updated


@transaction.atomic
def mark_message_read(message: Message, user) -> Message:
    """Mark a single message as read. Only the recipient (non-sender) can do this."""
    if message.sender_id == user.pk:
        raise ServiceError("You cannot mark your own message as read.")
    if not message.conversation.participants.filter(pk=user.pk).exists():
        raise PermissionDeniedError("You are not a participant in this conversation.")

    now = timezone.now()
    Message.objects.filter(pk=message.pk).update(
        status=MessageStatus.READ,
        read_at=now,
    )
    message.status = MessageStatus.READ
    message.read_at = now

    _broadcast_status_update(message.conversation_id, message.pk, MessageStatus.READ)
    return message


@transaction.atomic
def mark_conversation_read(conversation: Conversation, user) -> int:
    """
    Mark all unread messages in *conversation* (not sent by *user*) as read.

    Updates ConversationParticipant.last_read_at. Returns count marked.
    """
    now = timezone.now()
    last_message = (
        Message.objects
        .filter(conversation=conversation)
        .exclude(sender=user)
        .order_by("-created_at")
        .first()
    )

    count = Message.objects.filter(
        conversation=conversation,
        recipient=user,
    ).exclude(
        status=MessageStatus.READ,
    ).exclude(
        sender=user,
    ).update(
        status=MessageStatus.READ,
        read_at=now,
    )

    if count:
        ConversationParticipant.objects.filter(
            conversation=conversation,
            user=user,
        ).update(
            last_read_message=last_message,
            last_read_at=now,
        )
        _broadcast_batch_status(conversation.pk, MessageStatus.READ, user.pk)

    return count


# ── Conversation management ──────────────────────────────────────────


@transaction.atomic
def archive_conversation(conversation: Conversation, user) -> Conversation:
    """Archive a conversation for *user*. If both participants archive, mark the conversation closed."""
    _ensure_participant_metadata(conversation, user)
    now = timezone.now()
    ConversationParticipant.objects.filter(
        conversation=conversation,
        user=user,
    ).update(archived_at=now)

    # If all participants have archived, close the conversation
    total = conversation.participants.count()
    archived = ConversationParticipant.objects.filter(
        conversation=conversation,
        archived_at__isnull=False,
    ).count()
    if archived >= total:
        Conversation.objects.filter(pk=conversation.pk).update(status=ConversationStatus.ARCHIVED)
        conversation.status = ConversationStatus.ARCHIVED

    return conversation


@transaction.atomic
def block_conversation(conversation: Conversation, user) -> Conversation:
    """Block a conversation. Once blocked, neither participant can send messages."""
    if not conversation.participants.filter(pk=user.pk).exists():
        raise PermissionDeniedError("You are not a participant in this conversation.")

    Conversation.objects.filter(pk=conversation.pk).update(status=ConversationStatus.BLOCKED)
    conversation.status = ConversationStatus.BLOCKED
    logger.info("conversation_blocked id=%d by user=%d", conversation.pk, user.pk)
    return conversation


# ── Unread count ─────────────────────────────────────────────────────


def get_unread_count(user) -> int:
    """Total unread messages across all conversations for *user*."""
    return Message.objects.filter(
        conversation__participants=user,
        recipient=user,
    ).exclude(
        status=MessageStatus.READ,
    ).exclude(
        sender=user,
    ).count()


# ── Typing indicator ─────────────────────────────────────────────────


def broadcast_typing(conversation_id: int, user, is_typing: bool) -> None:
    """Broadcast a typing indicator to all other participants in the conversation."""
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    try:
        async_to_sync(channel_layer.group_send)(
            f"chat_{conversation_id}",
            {
                "type": "typing_indicator",
                "user_id": user.pk,
                "username": user.username,
                "is_typing": is_typing,
            },
        )
    except Exception:
        logger.exception("Failed to broadcast typing indicator conv=%d", conversation_id)


# ── Internal broadcast helpers ───────────────────────────────────────


def _broadcast_new_message(conversation_id: int, message: Message) -> None:
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    try:
        async_to_sync(channel_layer.group_send)(
            f"chat_{conversation_id}",
            {
                "type": "chat_message",
                "message": _serialise_message(message),
            },
        )
    except Exception:
        logger.exception("Failed to broadcast message conv=%d msg=%d", conversation_id, message.pk)


def _broadcast_status_update(conversation_id: int, message_id: int, new_status: str) -> None:
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    try:
        async_to_sync(channel_layer.group_send)(
            f"chat_{conversation_id}",
            {
                "type": "message_status",
                "message_id": message_id,
                "status": new_status,
            },
        )
    except Exception:
        logger.exception("Failed to broadcast status conv=%d msg=%d", conversation_id, message_id)


def _broadcast_batch_status(conversation_id: int, new_status: str, reader_id: int) -> None:
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    try:
        async_to_sync(channel_layer.group_send)(
            f"chat_{conversation_id}",
            {
                "type": "batch_status",
                "status": new_status,
                "reader_id": reader_id,
            },
        )
    except Exception:
        logger.exception("Failed to broadcast batch status conv=%d", conversation_id)


def _serialise_message(message: Message) -> dict:
    sender = message.sender
    return {
        "id": message.pk,
        "sender": {
            "id": sender.pk,
            "username": sender.username,
            "profile_picture": sender.profile_picture.url if sender.profile_picture else "",
        },
        "recipient_id": message.recipient_id,
        "content": message.content,
        "message_type": message.message_type,
        "status": message.status,
        "delivered_at": message.delivered_at.isoformat() if message.delivered_at else None,
        "read_at": message.read_at.isoformat() if message.read_at else None,
        "created_at": message.created_at.isoformat(),
    }
