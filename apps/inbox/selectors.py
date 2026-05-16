"""
Read-only query selectors for inbox.

Views call selectors for reads and services for writes.
No N+1 queries — all relations are prefetched or selected in a single pass.
"""

from __future__ import annotations

from django.db.models import QuerySet

from apps.common.exceptions import NotFoundError, PermissionDeniedError

from .models import Conversation, Message


def get_user_conversations(user) -> QuerySet:
    """
    Return conversations for *user*, ordered by most recent activity.

    Prefetches participants and images so list serialisation is N+1-free.
    """
    return (
        Conversation.objects
        .filter(participants=user)
        .select_related("listing", "buyer", "seller")
        .prefetch_related(
            "participants",
            "listing__images",
            "conversation_participants__user",
        )
        .order_by("-updated_at")
    )


def get_conversation_by_id(conversation_id: int, user) -> Conversation:
    """
    Return a conversation by ID.

    Raises NotFoundError if it does not exist.
    Raises PermissionDeniedError if the user is not a participant.
    """
    try:
        conversation = (
            Conversation.objects
            .select_related("listing", "buyer", "seller")
            .prefetch_related(
                "participants",
                "listing__images",
                "conversation_participants__user",
            )
            .get(pk=conversation_id)
        )
    except Conversation.DoesNotExist:
        raise NotFoundError(f"Conversation {conversation_id} not found.")

    if not conversation.participants.filter(pk=user.pk).exists():
        raise PermissionDeniedError("You are not a participant in this conversation.")

    return conversation


def get_conversation_messages(conversation: Conversation, ordering: str = "asc") -> QuerySet:
    """
    Return messages in a conversation, selecting related sender and recipient.

    ``ordering`` can be ``"asc"`` (oldest first) or ``"desc"`` (newest first).
    """
    order_field = "created_at" if ordering == "asc" else "-created_at"
    return (
        conversation.messages
        .select_related("sender", "recipient")
        .order_by(order_field)
    )


def get_message_by_id(message_id: int, user) -> Message:
    """
    Return a message by ID for a participant of its conversation.

    Raises NotFoundError if the message does not exist.
    Raises PermissionDeniedError if the user is not in the conversation.
    """
    try:
        message = (
            Message.objects
            .select_related("conversation", "sender", "recipient")
            .get(pk=message_id)
        )
    except Message.DoesNotExist:
        raise NotFoundError(f"Message {message_id} not found.")

    if not message.conversation.participants.filter(pk=user.pk).exists():
        raise PermissionDeniedError("You are not a participant in this conversation.")

    return message
