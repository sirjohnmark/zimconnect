"""
WebSocket consumer for real-time chat messaging.

Protocol
--------
Connect:  ``ws://host/ws/chat/{conversation_id}/?token=<JWT>``
          → authenticates via JWT, validates participant, sends last 20 messages.

Client → Server messages (JSON):
    {"type": "message",        "content": "Hello!"}
    {"type": "mark_read",      "message_id": 42}
    {"type": "mark_delivered", "message_id": 42}
    {"type": "typing_start"}
    {"type": "typing_stop"}

Server → Client messages (JSON):
    {"type": "chat_message",    "message": {...}}
    {"type": "message_status",  "message_id": 42, "status": "delivered"|"read"}
    {"type": "batch_status",    "status": "read"|"delivered", "reader_id": 5}
    {"type": "typing",          "user_id": 5, "username": "alice", "is_typing": true}
    {"type": "history",         "messages": [...]}
    {"type": "error",           "message": "..."}

Close codes: 4001 = unauthenticated, 4003 = not a participant.
"""

from __future__ import annotations

import logging

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth.models import AnonymousUser

from apps.inbox import services as inbox_services
from apps.inbox.models import Conversation, Message

logger = logging.getLogger(__name__)

HISTORY_LIMIT = 20


class ChatConsumer(AsyncJsonWebsocketConsumer):
    """Async WebSocket consumer for per-conversation real-time chat."""

    # ── Lifecycle ──────────────────────────────────────────────────────

    async def connect(self):
        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        self.group_name = f"chat_{self.conversation_id}"
        self.user = self.scope.get("user", AnonymousUser())

        if self.user.is_anonymous:
            await self.close(code=4001)
            return

        if not await self._is_participant():
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        history = await self._get_history()
        await self.send_json({"type": "history", "messages": history})

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # ── Client → Server ────────────────────────────────────────────────

    async def receive_json(self, content, **kwargs):
        msg_type = content.get("type")

        if msg_type == "message":
            await self._handle_message(content)
        elif msg_type == "mark_read":
            await self._handle_mark_read(content)
        elif msg_type == "mark_delivered":
            await self._handle_mark_delivered(content)
        elif msg_type in ("typing_start", "typing_stop"):
            await self._handle_typing(msg_type == "typing_start")
        else:
            await self.send_json({"type": "error", "message": f"Unknown type: {msg_type}"})

    # ── Group broadcast handlers (Server → Client) ─────────────────────

    async def chat_message(self, event):
        await self.send_json({"type": "chat_message", "message": event["message"]})

    async def message_status(self, event):
        await self.send_json({
            "type": "message_status",
            "message_id": event["message_id"],
            "status": event["status"],
        })

    async def batch_status(self, event):
        await self.send_json({
            "type": "batch_status",
            "status": event["status"],
            "reader_id": event["reader_id"],
        })

    async def typing_indicator(self, event):
        # Only forward typing events from OTHER users to this socket
        if event.get("user_id") != self.user.pk:
            await self.send_json({
                "type": "typing",
                "user_id": event["user_id"],
                "username": event["username"],
                "is_typing": event["is_typing"],
            })

    async def messages_read(self, event):
        """Legacy handler — kept for backward compat with old clients."""
        await self.send_json({
            "type": "messages_read",
            "message_id": event.get("message_id"),
            "reader": event.get("reader"),
        })

    # ── Internal handlers ──────────────────────────────────────────────

    async def _handle_message(self, content):
        text = (content.get("content") or "").strip()
        if not text:
            await self.send_json({"type": "error", "message": "Message content cannot be empty."})
            return
        if len(text) > 2000:
            await self.send_json({"type": "error", "message": "Message too long (max 2000 chars)."})
            return

        try:
            await self._send_message(text)
        except Exception as exc:
            logger.exception("WS send_message failed conv=%s", self.conversation_id)
            await self.send_json({"type": "error", "message": str(exc)})

    async def _handle_mark_read(self, content):
        message_id = content.get("message_id")
        if not isinstance(message_id, int):
            await self.send_json({"type": "error", "message": "message_id must be an integer."})
            return
        try:
            await self._mark_read(message_id)
        except Exception as exc:
            await self.send_json({"type": "error", "message": str(exc)})

    async def _handle_mark_delivered(self, content):
        message_id = content.get("message_id")
        if not isinstance(message_id, int):
            await self.send_json({"type": "error", "message": "message_id must be an integer."})
            return
        try:
            await self._mark_delivered(message_id)
        except Exception as exc:
            await self.send_json({"type": "error", "message": str(exc)})

    async def _handle_typing(self, is_typing: bool):
        await self.channel_layer.group_send(self.group_name, {
            "type": "typing_indicator",
            "user_id": self.user.pk,
            "username": self.user.username,
            "is_typing": is_typing,
        })

    # ── DB helpers ─────────────────────────────────────────────────────

    @database_sync_to_async
    def _is_participant(self) -> bool:
        return Conversation.objects.filter(
            pk=self.conversation_id,
            participants=self.user,
        ).exists()

    @database_sync_to_async
    def _get_history(self) -> list[dict]:
        messages = (
            Message.objects
            .filter(conversation_id=self.conversation_id)
            .select_related("sender")
            .order_by("-created_at")[:HISTORY_LIMIT]
        )
        return [inbox_services._serialise_message(m) for m in reversed(list(messages))]

    @database_sync_to_async
    def _send_message(self, text: str) -> Message:
        conversation = Conversation.objects.get(pk=self.conversation_id)
        return inbox_services.send_message(conversation, self.user, text)

    @database_sync_to_async
    def _mark_read(self, message_id: int) -> None:
        try:
            message = Message.objects.select_related("conversation").get(pk=message_id)
        except Message.DoesNotExist:
            raise ValueError("Message not found.")
        inbox_services.mark_message_read(message, self.user)

    @database_sync_to_async
    def _mark_delivered(self, message_id: int) -> None:
        try:
            message = Message.objects.select_related("conversation").get(pk=message_id)
        except Message.DoesNotExist:
            raise ValueError("Message not found.")
        inbox_services.mark_message_delivered(message, self.user)
