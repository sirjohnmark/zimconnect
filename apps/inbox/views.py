"""
Inbox views — conversations, messages, read/delivered status, archiving.
"""

from django.contrib.auth import get_user_model
from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from rest_framework import serializers as s
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.exceptions import NotFoundError, ServiceError
from apps.common.pagination import StandardResultsSetPagination
from apps.common.throttling import MessageSendThrottle
from apps.inbox import selectors, services
from apps.inbox.serializers import (
    ConversationDetailSerializer,
    ConversationListSerializer,
    MessageSerializer,
    ReportMessageSerializer,
    SendMessageSerializer,
    StartConversationSerializer,
)

User = get_user_model()


# ── Conversation list & start ─────────────────────────────────────────


class ConversationListView(APIView):
    """GET /api/v1/inbox/ — paginated list of the user's conversations."""

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


class StartConversationView(APIView):
    """POST /api/v1/inbox/start/ — start a conversation with a listing's seller."""

    permission_classes = (IsAuthenticated,)

    @extend_schema(
        tags=["Inbox"],
        operation_id="inbox_conversations_start",
        summary="Start a conversation",
        description=(
            "Authenticated buyer starts a conversation with the listing seller. "
            "Reuses an existing conversation if one already exists for the same (buyer, seller, listing)."
        ),
        request=StartConversationSerializer,
        responses={
            201: OpenApiResponse(response=ConversationDetailSerializer, description="Conversation started/reused"),
            400: OpenApiResponse(description="Validation error, self-messaging, or inactive listing"),
            404: OpenApiResponse(description="Listing not found"),
        },
    )
    def post(self, request: Request) -> Response:
        serializer = StartConversationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        from apps.listings.models import Listing
        try:
            listing = Listing.objects.select_related("owner").get(pk=data["listing_id"])
        except Listing.DoesNotExist:
            raise NotFoundError("Listing not found.")

        conversation, created = services.get_or_create_conversation(
            sender=request.user,
            listing=listing,
        )

        services.send_message(
            conversation=conversation,
            sender=request.user,
            content=data["initial_message"],
        )

        conversation = selectors.get_conversation_by_id(conversation.pk, request.user)
        return Response(
            ConversationDetailSerializer(conversation, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


# ── Conversation detail & messages ───────────────────────────────────


class ConversationDetailView(APIView):
    """GET /api/v1/inbox/:id/ — conversation detail (does NOT auto-mark read)."""

    permission_classes = (IsAuthenticated,)

    @extend_schema(
        tags=["Inbox"],
        operation_id="inbox_conversation_detail",
        summary="Get conversation detail",
        description="Retrieve conversation metadata. Use POST /api/v1/inbox/:id/read/ to mark messages as read.",
        responses={200: ConversationDetailSerializer},
    )
    def get(self, request: Request, conversation_id: int) -> Response:
        conversation = selectors.get_conversation_by_id(conversation_id, request.user)
        return Response(
            ConversationDetailSerializer(conversation, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class ConversationMessagesView(APIView):
    """GET /api/v1/inbox/:id/messages/ — paginated messages for a conversation."""

    permission_classes = (IsAuthenticated,)

    @extend_schema(
        tags=["Inbox"],
        operation_id="inbox_conversation_messages",
        summary="Get conversation messages",
        description="Paginated messages for a conversation, oldest first. Use ?ordering=desc for newest first.",
        responses={200: MessageSerializer(many=True)},
    )
    def get(self, request: Request, conversation_id: int) -> Response:
        conversation = selectors.get_conversation_by_id(conversation_id, request.user)
        ordering = request.query_params.get("ordering", "asc")
        messages = selectors.get_conversation_messages(conversation, ordering=ordering)
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(messages, request)
        serializer = MessageSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class ConversationSendMessageView(APIView):
    """POST /api/v1/inbox/:id/messages/ — send a message."""

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
            400: OpenApiResponse(description="Validation error or empty content"),
            403: OpenApiResponse(description="Not a participant or conversation blocked"),
            429: OpenApiResponse(description="Rate limit exceeded"),
        },
    )
    def post(self, request: Request, conversation_id: int) -> Response:
        conversation = selectors.get_conversation_by_id(conversation_id, request.user)

        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        message = services.send_message(
            conversation=conversation,
            sender=request.user,
            content=data["content"],
            message_type=data.get("message_type", "text"),
        )

        return Response(
            MessageSerializer(message).data,
            status=status.HTTP_201_CREATED,
        )


# ── Mark read / delivered ─────────────────────────────────────────────


class MarkConversationReadView(APIView):
    """POST /api/v1/inbox/:id/read/ — mark all messages in a conversation as read."""

    permission_classes = (IsAuthenticated,)

    @extend_schema(
        tags=["Inbox"],
        operation_id="inbox_mark_conversation_read",
        summary="Mark conversation as read",
        description="Mark all messages from the other participant as read. Updates unread count.",
        request=None,
        responses={
            200: inline_serializer("MarkReadResponse", fields={"marked": s.IntegerField()}),
        },
    )
    def post(self, request: Request, conversation_id: int) -> Response:
        conversation = selectors.get_conversation_by_id(conversation_id, request.user)
        count = services.mark_conversation_read(conversation, request.user)
        return Response({"marked": count}, status=status.HTTP_200_OK)


class MarkConversationDeliveredView(APIView):
    """POST /api/v1/inbox/:id/delivered/ — batch mark messages as delivered."""

    permission_classes = (IsAuthenticated,)

    @extend_schema(
        tags=["Inbox"],
        operation_id="inbox_mark_conversation_delivered",
        summary="Mark conversation messages as delivered",
        description="Mark all sent messages addressed to the requesting user as delivered.",
        request=None,
        responses={
            200: inline_serializer("MarkDeliveredResponse", fields={"marked": s.IntegerField()}),
        },
    )
    def post(self, request: Request, conversation_id: int) -> Response:
        conversation = selectors.get_conversation_by_id(conversation_id, request.user)
        count = services.mark_conversation_delivered(conversation, request.user)
        return Response({"marked": count}, status=status.HTTP_200_OK)


class MarkMessageReadView(APIView):
    """POST /api/v1/inbox/messages/:id/mark-read/ — mark a single message as read."""

    permission_classes = (IsAuthenticated,)

    @extend_schema(
        tags=["Inbox"],
        operation_id="inbox_mark_message_read",
        summary="Mark single message as read",
        description="Only the recipient can mark a message as read.",
        request=None,
        responses={
            200: OpenApiResponse(response=MessageSerializer, description="Updated message"),
            400: OpenApiResponse(description="Cannot mark own message as read"),
            403: OpenApiResponse(description="Not a participant"),
            404: OpenApiResponse(description="Message not found"),
        },
    )
    def post(self, request: Request, message_id: int) -> Response:
        message = selectors.get_message_by_id(message_id, request.user)
        updated = services.mark_message_read(message, request.user)
        return Response(MessageSerializer(updated).data, status=status.HTTP_200_OK)


class MarkMessageDeliveredView(APIView):
    """PATCH /api/v1/inbox/messages/:id/delivered/ — mark a single message as delivered."""

    permission_classes = (IsAuthenticated,)

    @extend_schema(
        tags=["Inbox"],
        operation_id="inbox_mark_message_delivered",
        summary="Mark single message as delivered",
        description="Only the recipient can mark a message as delivered.",
        request=None,
        responses={
            200: OpenApiResponse(response=MessageSerializer, description="Updated message"),
            403: OpenApiResponse(description="Not the recipient"),
            404: OpenApiResponse(description="Message not found"),
        },
    )
    def patch(self, request: Request, message_id: int) -> Response:
        message = selectors.get_message_by_id(message_id, request.user)
        updated = services.mark_message_delivered(message, request.user)
        return Response(MessageSerializer(updated).data, status=status.HTTP_200_OK)


# ── Conversation management ───────────────────────────────────────────


class ArchiveConversationView(APIView):
    """POST /api/v1/inbox/:id/archive/ — archive a conversation."""

    permission_classes = (IsAuthenticated,)

    @extend_schema(
        tags=["Inbox"],
        operation_id="inbox_archive_conversation",
        summary="Archive conversation",
        description="Archive this conversation for the requesting user. If all participants archive, the conversation is closed.",
        request=None,
        responses={
            200: OpenApiResponse(response=ConversationDetailSerializer, description="Updated conversation"),
        },
    )
    def post(self, request: Request, conversation_id: int) -> Response:
        conversation = selectors.get_conversation_by_id(conversation_id, request.user)
        conversation = services.archive_conversation(conversation, request.user)
        conversation = selectors.get_conversation_by_id(conversation.pk, request.user)
        return Response(
            ConversationDetailSerializer(conversation, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


# ── Unread count ──────────────────────────────────────────────────────


class UnreadCountView(APIView):
    """GET /api/v1/inbox/unread-count/ — total unread messages for the user."""

    permission_classes = (IsAuthenticated,)

    @extend_schema(
        tags=["Inbox"],
        operation_id="inbox_unread_count",
        summary="Get unread message count",
        description="Total number of unread messages across all conversations.",
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


# ── Message reporting ─────────────────────────────────────────────────


class ReportMessageView(APIView):
    """POST /api/v1/inbox/messages/:id/report/ — report a message."""

    permission_classes = (IsAuthenticated,)

    @extend_schema(
        tags=["Inbox"],
        operation_id="inbox_report_message",
        summary="Report a message",
        description="Report a message for spam, harassment, fraud, or other inappropriate content. Logged for moderation review.",
        request=ReportMessageSerializer,
        responses={
            200: inline_serializer(
                "ReportResponse",
                fields={"detail": s.CharField()},
            ),
            403: OpenApiResponse(description="Not a conversation participant"),
            404: OpenApiResponse(description="Message not found"),
        },
    )
    def post(self, request: Request, message_id: int) -> Response:
        message = selectors.get_message_by_id(message_id, request.user)

        serializer = ReportMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        logger.info(
            "message_reported message=%d reporter=%d reason=%s",
            message.pk, request.user.pk, data["reason"],
        )
        # TODO: persist MessageReport model when moderation features are added
        return Response(
            {"detail": "Message reported. Our team will review it."},
            status=status.HTTP_200_OK,
        )


import logging  # noqa: E402
logger = logging.getLogger(__name__)
