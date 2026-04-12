"""
Tests for the inbox messaging app — conversations, messages, read status.
"""

import pytest
from rest_framework import status

from apps.common.constants import ListingStatus
from tests.conftest import ConversationFactory, ListingFactory, MessageFactory, UserFactory

INBOX_URL = "/api/v1/inbox/"
UNREAD_URL = "/api/v1/inbox/unread-count/"


def _detail_url(conversation_id):
    return f"/api/v1/inbox/{conversation_id}/"


def _messages_url(conversation_id):
    return f"/api/v1/inbox/{conversation_id}/messages/"


def _mark_read_url(message_id):
    return f"/api/v1/inbox/messages/{message_id}/mark-read/"


@pytest.mark.django_db
class TestStartConversation:
    def test_start_conversation(self, buyer_client, seller_user, sample_listing):
        resp = buyer_client.post(
            INBOX_URL,
            {
                "recipient_id": seller_user.pk,
                "listing_id": sample_listing.pk,
                "initial_message": "Is this still available?",
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert "id" in resp.data

    def test_start_conversation_without_listing(self, buyer_client, seller_user):
        resp = buyer_client.post(
            INBOX_URL,
            {
                "recipient_id": seller_user.pk,
                "initial_message": "Hey!",
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED

    def test_cannot_message_self(self, buyer_client, buyer_user):
        resp = buyer_client.post(
            INBOX_URL,
            {
                "recipient_id": buyer_user.pk,
                "initial_message": "Talking to myself.",
            },
            format="json",
        )
        assert resp.status_code in (
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_409_CONFLICT,
        )

    def test_start_conversation_recipient_not_found(self, buyer_client):
        resp = buyer_client.post(
            INBOX_URL,
            {
                "recipient_id": 99999,
                "initial_message": "Hi",
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_unauthenticated_cannot_start_conversation(self, api_client, seller_user):
        resp = api_client.post(
            INBOX_URL,
            {
                "recipient_id": seller_user.pk,
                "initial_message": "Hi",
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestConversationList:
    def test_list_conversations(self, buyer_client, sample_conversation):
        resp = buyer_client.get(INBOX_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert "results" in resp.data

    def test_unauthenticated_cannot_list(self, api_client):
        resp = api_client.get(INBOX_URL)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestConversationMessages:
    def test_get_conversation_messages(
        self, buyer_client, sample_conversation, sample_message
    ):
        resp = buyer_client.get(_detail_url(sample_conversation.pk))
        assert resp.status_code == status.HTTP_200_OK
        assert "results" in resp.data

    def test_send_message(self, buyer_client, sample_conversation):
        resp = buyer_client.post(
            _messages_url(sample_conversation.pk),
            {"content": "Following up!"},
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["content"] == "Following up!"

    def test_send_empty_message(self, buyer_client, sample_conversation):
        resp = buyer_client.post(
            _messages_url(sample_conversation.pk),
            {"content": ""},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestMarkRead:
    def test_mark_message_read(
        self, seller_client, sample_conversation, sample_message
    ):
        """Recipient (seller) marks the buyer's message as read."""
        resp = seller_client.post(_mark_read_url(sample_message.pk))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["is_read"] is True

    def test_cannot_mark_own_message_read(
        self, buyer_client, sample_message
    ):
        """Sender cannot mark their own message as read."""
        resp = buyer_client.post(_mark_read_url(sample_message.pk))
        assert resp.status_code in (
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_409_CONFLICT,
        )

    def test_mark_nonexistent_message(self, buyer_client):
        resp = buyer_client.post(_mark_read_url(99999))
        assert resp.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestUnreadCount:
    def test_unread_count(self, seller_client, sample_message):
        """Seller should have 1 unread message from the buyer."""
        resp = seller_client.get(UNREAD_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["unread_count"] >= 1

    def test_unread_count_unauthenticated(self, api_client):
        resp = api_client.get(UNREAD_URL)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED
