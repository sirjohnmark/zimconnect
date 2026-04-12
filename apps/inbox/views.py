"""
Inbox views â€” conversations, messages, read status.
"""

from django.contrib.auth import get_user_model
from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from rest_framework import serializers as s
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.exceptions import NotFoundError
from apps.common.pagination import StandardResultsSetPagination
from apps.common.throttling import MessageSendThrottle
from apps.inbox import selectors, services
from apps.inbox.models import Message
from apps.inbox.serializers import (
    ConversationDetailSerializer,
    ConversationListSerializer,
    MessageSerializer,
    SendMessageSerializer,
    StartConversationSerializer,
)

User = get_user_model()


class ConversationListCreateView(APIView):
    """
    GET  /api/v1/inbox/ â€” list user's conversations.
    POST /api/v1/inbox/ â€” start a new conversation (or reuse existing).
    """

    permission_classes = (IsAuthenticated,)

    @extend_schema(
        tags=["Inbox"],
        operation_id="inbox_conversations_list",
        summary="List my conversations",
        description="Paginated list of the authenticated user's conversations, ordered by most recent activity.",
        responses={200: ConversationListSerializer(many=True)},
    )
    def get(self, request: Request) -> Response:
        qs = selectors.get_user_conversations(request.user)
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = ConversationListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)

    @extend_schema(
        tags=["Inbox"],
        operation_id="inbox_conversations_start",
        summary="Start a conversation",
        description="Start a new conversation with a user (optionally about a listing). Reuses existing conversation if one already exists between the same participants for the same listing.",
        request=StartConversationSerializer,
        responses={
            201: OpenApiResponse(response=ConversationDetailSerializer, description="Conversation created/reused"),
            400: OpenApiResponse(description="Validation error or self-messaging"),
            404: OpenApiResponse(description="Recipient or listing not found"),
        },
    )
    def post(self, request: Request) -> Response:
        serializer = StartConversationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            recipient = User.objects.get(pk=data["recipient_id"])
        except User.DoesNotExist:
            raise NotFoundError("Recipient user not found.")

        listing = None
        if listing_id := data.get("listing_id"):
            from apps.listings.models import Listing

            try:
                listing = Listing.objects.get(pk=listing_id)
            except Listing.DoesNotExist:
                raise NotFoundError("Listing not found.")

        conversation, _created = services.get_or_create_conversation(
            sender=request.user,
            recipient=recipient,
            listing=listing,
        )

        services.send_message(
            conversation=conversation,
            sender=request.user,
            content=data["initial_message"],
        )

        # Refetch with relations for response
        conversation = selectors.get_conversation_by_id(conversation.pk, request.user)
        return Response(
            ConversationDetailSerializer(conversation, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class ConversationDetailView(APIView):
    """
    GET  /api/v1/inbox/{id}/ â€” conversation messages (marks all read on load).
    POST /api/v1/inbox/{id}/messages/ â€” send a message in this conversation.
    """

    permission_classes = (IsAuthenticated,)

    @extend_schema(
        tags=["Inbox"],
        operation_id="inbox_conversation_messages",
        summary="Get conversation messages",
        description="Retrieve paginated messages for a conversation. Automatically marks all messages as read for the requesting user.",
        responses={200: MessageSerializer(many=True)},
    )
    def get(self, request: Request, conversation_id: int) -> Response:
        conversation = selectors.get_conversation_by_id(conversation_id, request.user)

        # Mark all messages as read for the requesting user
        services.mark_conversation_read(conversation, request.user)

        messages = selectors.get_conversation_messages(conversation)
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(messages, request)
        serializer = MessageSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class ConversationSendMessageView(APIView):
    """POST /api/v1/inbox/{id}/messages/ â€” send a message."""

    permission_classes = (IsAuthenticated,)
    throttle_classes = (MessageSendThrottle,)

    @extend_schema(
        tags=["Inbox"],
        operation_id="inbox_send_message",
        summary="Send a message",
        description="Send a message in an existing conversation. Rate-limited to 60 messages/hour.",
        request=SendMessageSerializer,
        responses={
            201: OpenApiResponse(response=MessageSerializer, description="Message sent"),
            400: OpenApiResponse(description="Validation error"),
            403: OpenApiResponse(description="Not a conversation participant"),
            429: OpenApiResponse(description="Rate limit exceeded"),
        },
    )
    def post(self, request: Request, conversation_id: int) -> Response:
        conversation = selectors.get_conversation_by_id(conversation_id, request.user)

        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = services.send_message(
            conversation=conversation,
            sender=request.user,
            content=serializer.validated_data["content"],
        )

        return Response(
            MessageSerializer(message).data,
            status=status.HTTP_201_CREATED,
        )


class MarkReadView(APIView):
    """POST /api/v1/inbox/messages/{id}/mark-read/ â€” mark a single message as read."""

    permission_classes = (IsAuthenticated,)

    @extend_schema(
        tags=["Inbox"],
        operation_id="inbox_mark_read",
        summary="Mark message as read",
        description="Mark a single message as read. Only the recipient can mark a message as read.",
        request=None,
        responses={
            200: OpenApiResponse(response=MessageSerializer, description="Updated message"),
            403: OpenApiResponse(description="Not the message recipient"),
            404: OpenApiResponse(description="Message not found"),
        },
    )
    def post(self, request: Request, message_id: int) -> Response:
        try:
            message = Message.objects.select_related("conversation").get(pk=message_id)
        except Message.DoesNotExist:
            raise NotFoundError(f"Message with id {message_id} not found.")

        updated = services.mark_message_read(message, request.user)
        return Response(MessageSerializer(updated).data, status=status.HTTP_200_OK)


class UnreadCountView(APIView):
    """GET /api/v1/inbox/unread-count/ â€” total unread messages for the user."""

    permission_classes = (IsAuthenticated,)

    @extend_schema(
        tags=["Inbox"],
        operation_id="inbox_unread_count",
        summary="Get unread message count",
        description="Return the total number of unread messages across all conversations.",
        responses={
            200: inline_serializer(
                "UnreadCountResponse",
                fields={"unread_count": s.IntegerField()},
            ),
        },
    )
    def get(self, request: Request) -> Response:
        count = services.get_unread_count(request.user)
        return Response({"unread_count": count}, status=status.HTTP_200_OK)
