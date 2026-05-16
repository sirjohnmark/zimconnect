"""
Tests for the WebSocket ChatConsumer (Django Channels).
"""

from __future__ import annotations

import pytest
from channels.db import database_sync_to_async
from channels.testing import WebsocketCommunicator
from rest_framework_simplejwt.tokens import RefreshToken

from apps.common.channel_auth import JWTAuthMiddleware
from apps.inbox.models import Conversation, Message
from apps.inbox.routing import websocket_urlpatterns
from channels.routing import URLRouter
from tests.conftest import ConversationFactory, MessageFactory, UserFactory


def _build_app():
    """Return a Channels ASGI app with JWT middleware + routing."""
    return JWTAuthMiddleware(URLRouter(websocket_urlpatterns))


@database_sync_to_async
def _token_for(user) -> str:
    return str(RefreshToken.for_user(user).access_token)


@pytest.mark.django_db(transaction=True)
@pytest.mark.asyncio(loop_scope="class")
class TestChatConsumerConnect:
    async def test_connect_authenticated_participant(self, buyer_user, seller_user):
        """Authenticated participant should connect and receive history."""
        conv = await database_sync_to_async(ConversationFactory)(
            participants=[buyer_user, seller_user],
        )
        token = await _token_for(buyer_user)
        communicator = WebsocketCommunicator(
            _build_app(),
            f"/ws/chat/{conv.pk}/?token={token}",
        )
        connected, _ = await communicator.connect()
        assert connected is True

        # First message should be history
        resp = await communicator.receive_json_from(timeout=5)
        assert resp["type"] == "history"
        assert isinstance(resp["messages"], list)

        await communicator.disconnect()

    async def test_connect_unauthenticated_rejected(self):
        """Connection without token should be closed with 4001."""
        communicator = WebsocketCommunicator(
            _build_app(),
            "/ws/chat/999/",
        )
        connected, code = await communicator.connect()
        assert connected is False

    async def test_connect_non_participant_rejected(self, buyer_user, seller_user):
        """User who is not a participant should be rejected with 4003."""
        outsider = await database_sync_to_async(UserFactory)()
        conv = await database_sync_to_async(ConversationFactory)(
            participants=[buyer_user, seller_user],
        )
        token = await _token_for(outsider)
        communicator = WebsocketCommunicator(
            _build_app(),
            f"/ws/chat/{conv.pk}/?token={token}",
        )
        connected, code = await communicator.connect()
        assert connected is False

    async def test_connect_invalid_token_rejected(self):
        """Invalid JWT should result in rejection."""
        communicator = WebsocketCommunicator(
            _build_app(),
            "/ws/chat/1/?token=invalidtoken123",
        )
        connected, _ = await communicator.connect()
        assert connected is False


@pytest.mark.django_db(transaction=True)
@pytest.mark.asyncio(loop_scope="class")
class TestChatConsumerMessaging:
    async def test_send_and_receive_message(self, buyer_user, seller_user):
        """Sending a message should broadcast to the group."""
        conv = await database_sync_to_async(ConversationFactory)(
            participants=[buyer_user, seller_user],
        )

        # Connect buyer
        buyer_token = await _token_for(buyer_user)
        buyer_comm = WebsocketCommunicator(
            _build_app(),
            f"/ws/chat/{conv.pk}/?token={buyer_token}",
        )
        connected, _ = await buyer_comm.connect()
        assert connected
        await buyer_comm.receive_json_from(timeout=5)  # consume history

        # Connect seller
        seller_token = await _token_for(seller_user)
        seller_comm = WebsocketCommunicator(
            _build_app(),
            f"/ws/chat/{conv.pk}/?token={seller_token}",
        )
        connected, _ = await seller_comm.connect()
        assert connected
        await seller_comm.receive_json_from(timeout=5)  # consume history

        # Buyer sends a message
        await buyer_comm.send_json_to({"type": "message", "content": "Hello seller!"})

        # Both should receive the chat_message
        buyer_resp = await buyer_comm.receive_json_from(timeout=5)
        assert buyer_resp["type"] == "chat_message"
        assert buyer_resp["message"]["content"] == "Hello seller!"
        assert buyer_resp["message"]["sender"]["username"] == buyer_user.username

        seller_resp = await seller_comm.receive_json_from(timeout=5)
        assert seller_resp["type"] == "chat_message"
        assert seller_resp["message"]["content"] == "Hello seller!"

        # Verify persisted in DB
        count = await database_sync_to_async(
            Message.objects.filter(conversation=conv).count
        )()
        assert count == 1

        await buyer_comm.disconnect()
        await seller_comm.disconnect()

    async def test_send_empty_message_error(self, buyer_user, seller_user):
        """Empty message should return an error."""
        conv = await database_sync_to_async(ConversationFactory)(
            participants=[buyer_user, seller_user],
        )
        token = await _token_for(buyer_user)
        comm = WebsocketCommunicator(
            _build_app(),
            f"/ws/chat/{conv.pk}/?token={token}",
        )
        connected, _ = await comm.connect()
        assert connected
        await comm.receive_json_from(timeout=5)  # history

        await comm.send_json_to({"type": "message", "content": ""})
        resp = await comm.receive_json_from(timeout=5)
        assert resp["type"] == "error"

        await comm.disconnect()

    async def test_mark_read(self, buyer_user, seller_user):
        """mark_read event should broadcast a message_status event with status=read."""
        conv = await database_sync_to_async(ConversationFactory)(
            participants=[buyer_user, seller_user],
        )

        # Create a message from seller that buyer will mark as read
        msg = await database_sync_to_async(MessageFactory)(
            conversation=conv,
            sender=seller_user,
            recipient=buyer_user,
            content="Hey buyer!",
        )

        token = await _token_for(buyer_user)
        comm = WebsocketCommunicator(
            _build_app(),
            f"/ws/chat/{conv.pk}/?token={token}",
        )
        connected, _ = await comm.connect()
        assert connected
        await comm.receive_json_from(timeout=5)  # history

        await comm.send_json_to({"type": "mark_read", "message_id": msg.pk})

        resp = await comm.receive_json_from(timeout=5)
        assert resp["type"] == "message_status"
        assert resp["message_id"] == msg.pk
        assert resp["status"] == "read"

        # Verify DB updated
        await database_sync_to_async(msg.refresh_from_db)()
        assert msg.is_read is True

        await comm.disconnect()

    async def test_unknown_type_returns_error(self, buyer_user, seller_user):
        """Unknown message type should return an error."""
        conv = await database_sync_to_async(ConversationFactory)(
            participants=[buyer_user, seller_user],
        )
        token = await _token_for(buyer_user)
        comm = WebsocketCommunicator(
            _build_app(),
            f"/ws/chat/{conv.pk}/?token={token}",
        )
        connected, _ = await comm.connect()
        assert connected
        await comm.receive_json_from(timeout=5)  # history

        await comm.send_json_to({"type": "unknown_action"})
        resp = await comm.receive_json_from(timeout=5)
        assert resp["type"] == "error"
        assert "Unknown type" in resp["message"]

        await comm.disconnect()

    async def test_history_contains_recent_messages(self, buyer_user, seller_user):
        """History should contain the last 20 messages on connect."""
        conv = await database_sync_to_async(ConversationFactory)(
            participants=[buyer_user, seller_user],
        )

        # Create 25 messages
        for i in range(25):
            await database_sync_to_async(MessageFactory)(
                conversation=conv,
                sender=seller_user,
                content=f"Message {i}",
            )

        token = await _token_for(buyer_user)
        comm = WebsocketCommunicator(
            _build_app(),
            f"/ws/chat/{conv.pk}/?token={token}",
        )
        connected, _ = await comm.connect()
        assert connected

        resp = await comm.receive_json_from(timeout=5)
        assert resp["type"] == "history"
        assert len(resp["messages"]) == 20
        # Should be oldest-first within the history window
        assert resp["messages"][0]["content"] == "Message 5"
        assert resp["messages"][-1]["content"] == "Message 24"

        await comm.disconnect()
