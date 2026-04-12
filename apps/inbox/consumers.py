"""
WebSocket consumer for real-time chat messaging.

Protocol
--------
Connect:  ``ws://host/ws/chat/{conversation_id}/?token=<JWT>``
          → authenticates via JWT, validates participant, sends last 20 messages.

Client → Server messages (JSON):
    {"type": "message",   "content": "Hello!"}
    {"type": "mark_read", "message_id": 42}

Server → Client messages (JSON):
    {"type": "chat_message", "message": { ... }}
    {"type": "messages_read", "message_id": 42, "reader": "username"}
    {"type": "history",      "messages": [ ... ]}
    {"type": "error",        "message": "..."}
"""

from __future__ import annotations

import json
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

    # ── Lifecycle ─────────────────────────────

    async def connect(self):
        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        self.group_name = f"chat_{self.conversation_id}"
        self.user = self.scope.get("user", AnonymousUser())

        # Reject unauthenticated connections
        if self.user.is_anonymous:
            await self.close(code=4001)
            return

        # Validate the user is a participant
        is_participant = await self._is_participant()
        if not is_participant:
            await self.close(code=4003)
            return

        # Join the channel group and accept the connection
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Send the last N messages as initial history
        history = await self._get_history()
        await self.send_json({"type": "history", "messages": history})

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # ── Client → Server ──────────────────────

    async def receive_json(self, content, **kwargs):
        msg_type = content.get("type")

        if msg_type == "message":
            await self._handle_message(content)
        elif msg_type == "mark_read":
            await self._handle_mark_read(content)
        else:
            await self.send_json({"type": "error", "message": f"Unknown type: {msg_type}"})

    # ── Group broadcast handlers ─────────────

    async def chat_message(self, event):
        """Receive a chat_message event from the channel layer and forward to WS client."""
        await self.send_json({
            "type": "chat_message",
            "message": event["message"],
        })

    async def messages_read(self, event):
        """Forward a messages_read event to the WS client."""
        await self.send_json({
            "type": "messages_read",
            "message_id": event["message_id"],
            "reader": event["reader"],
        })

    # ── Internal handlers ────────────────────

    async def _handle_message(self, content):
        text = (content.get("content") or "").strip()
        if not text:
            await self.send_json({"type": "error", "message": "Message content cannot be empty."})
            return

        if len(text) > 2000:
            await self.send_json({"type": "error", "message": "Message too long (max 2000 chars)."})
            return

        try:
            message = await self._send_message(text)
        except Exception as exc:
            logger.exception("WS send_message failed conv=%s", self.conversation_id)
            await self.send_json({"type": "error", "message": str(exc)})
            return

        payload = {
            "type": "chat_message",
            "message": _serialise_message(message),
        }
        await self.channel_layer.group_send(self.group_name, payload)

    async def _handle_mark_read(self, content):
        message_id = content.get("message_id")
        if not isinstance(message_id, int):
            await self.send_json({"type": "error", "message": "message_id must be an integer."})
            return

        try:
            await self._mark_read(message_id)
        except Exception as exc:
            await self.send_json({"type": "error", "message": str(exc)})
            return

        await self.channel_layer.group_send(self.group_name, {
            "type": "messages_read",
            "message_id": message_id,
            "reader": self.user.username,
        })

    # ── DB helpers (sync_to_async) ───────────

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
        # Reverse so oldest-first in the payload
        return [_serialise_message(m) for m in reversed(messages)]

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


# ── Serialisation helper ─────────────────────


def _serialise_message(message: Message) -> dict:
    """Convert a Message instance into a JSON-safe dict."""
    sender = message.sender
    profile_picture = ""
    if sender.profile_picture:
        profile_picture = sender.profile_picture.url

    return {
        "id": message.pk,
        "sender": {
            "id": sender.pk,
            "username": sender.username,
            "profile_picture": profile_picture,
        },
        "content": message.content,
        "is_read": message.is_read,
        "created_at": message.created_at.isoformat(),
    }
