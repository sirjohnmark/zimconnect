"""
Read-only query selectors for inbox.

Views call selectors for reads and services for writes.
"""

from __future__ import annotations

from django.db.models import Max, QuerySet

from apps.common.exceptions import NotFoundError, PermissionDeniedError

from .models import Conversation, Message


def get_user_conversations(user) -> QuerySet:
    """
    Return conversations for *user*, annotated with last_message_at,
    with participants and last message prefetched, ordered by most recent activity.
    """
    return (
        Conversation.objects
        .filter(participants=user)
        .annotate(last_message_at=Max("messages__created_at"))
        .select_related("listing")
        .prefetch_related("participants", "messages")
        .order_by("-updated_at")
    )


def get_conversation_by_id(conversation_id: int, user) -> Conversation:
    """
    Return a conversation by ID. Raises NotFoundError if it doesn't exist,
    PermissionDeniedError if the user isn't a participant.
    """
    try:
        conversation = (
            Conversation.objects
            .select_related("listing")
            .prefetch_related("participants")
            .get(pk=conversation_id)
        )
    except Conversation.DoesNotExist:
        raise NotFoundError(f"Conversation with id {conversation_id} not found.")

    if not conversation.participants.filter(pk=user.pk).exists():
        raise PermissionDeniedError("You are not a participant in this conversation.")

    return conversation


def get_conversation_messages(conversation: Conversation) -> QuerySet:
    """Return messages in a conversation ordered by oldest first."""
    return (
        conversation.messages
        .select_related("sender")
        .order_by("created_at")
    )
