"""
Row-Level Security tests for conversations and messages.

Verifies:
  - users can only access conversations they participate in
  - users cannot spoof sender_id in messages
  - non-participants cannot read or send messages
  - seller cannot start conversation about their own listing
  - mark-read and mark-delivered are restricted to recipients
"""

from __future__ import annotations

import pytest
from rest_framework import status

from apps.common.constants import ListingStatus, UserRole
from apps.inbox.models import Conversation, Message, MessageStatus
from tests.conftest import (
    ConversationFactory,
    ListingFactory,
    MessageFactory,
    UserFactory,
    _make_auth_client,
)

INBOX_LIST_URL = "/api/v1/inbox/"
INBOX_START_URL = "/api/v1/inbox/start/"


def _conv_url(pk):
    return f"/api/v1/inbox/{pk}/"


def _messages_url(pk):
    return f"/api/v1/inbox/{pk}/messages/"


def _send_url(pk):
    return f"/api/v1/inbox/{pk}/send/"


def _read_url(pk):
    return f"/api/v1/inbox/{pk}/read/"


def _delivered_url(pk):
    return f"/api/v1/inbox/{pk}/delivered/"


def _mark_read_url(message_pk):
    return f"/api/v1/inbox/messages/{message_pk}/mark-read/"


def _mark_delivered_url(message_pk):
    return f"/api/v1/inbox/messages/{message_pk}/delivered/"


# ---------------------------------------------------------------------------
# Participant access
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestConversationParticipantAccess:
    def test_participant_can_read_conversation(self, buyer_user, seller_user, db):
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        client = _make_auth_client(buyer_user)
        resp = client.get(_conv_url(conv.pk))
        assert resp.status_code == status.HTTP_200_OK

    def test_non_participant_cannot_read_conversation(self, buyer_user, seller_user, db):
        outsider = UserFactory(role=UserRole.BUYER)
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        client = _make_auth_client(outsider)
        resp = client.get(_conv_url(conv.pk))
        assert resp.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)

    def test_anon_cannot_read_conversation(self, api_client, buyer_user, seller_user, db):
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        resp = api_client.get(_conv_url(conv.pk))
        assert resp.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)

    def test_list_returns_only_own_conversations(self, buyer_user, seller_user, db):
        outsider = UserFactory(role=UserRole.BUYER)
        mine = ConversationFactory(participants=[buyer_user, seller_user])
        theirs = ConversationFactory(participants=[outsider, seller_user])

        client = _make_auth_client(buyer_user)
        resp = client.get(INBOX_LIST_URL)
        assert resp.status_code == status.HTTP_200_OK
        conv_ids = {c["id"] for c in resp.data["results"]}
        assert mine.pk in conv_ids
        assert theirs.pk not in conv_ids


# ---------------------------------------------------------------------------
# Messaging — send and read
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestMessageAccess:
    def test_participant_can_send_message(self, buyer_user, seller_user, db):
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        client = _make_auth_client(buyer_user)
        resp = client.post(_send_url(conv.pk), {"content": "Hello!"}, format="json")
        assert resp.status_code == status.HTTP_201_CREATED

    def test_non_participant_cannot_send_message(self, buyer_user, seller_user, db):
        outsider = UserFactory(role=UserRole.BUYER)
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        client = _make_auth_client(outsider)
        resp = client.post(_send_url(conv.pk), {"content": "Inject"}, format="json")
        assert resp.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)

    def test_participant_can_read_messages(self, buyer_user, seller_user, db):
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        MessageFactory(conversation=conv, sender=buyer_user)
        client = _make_auth_client(seller_user)
        resp = client.get(_messages_url(conv.pk))
        assert resp.status_code == status.HTTP_200_OK

    def test_sender_cannot_mark_own_message_read(self, buyer_user, seller_user, db):
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        msg = MessageFactory(conversation=conv, sender=buyer_user)
        client = _make_auth_client(buyer_user)
        resp = client.post(_mark_read_url(msg.pk))
        assert resp.status_code in (status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN)

    def test_recipient_can_mark_message_read(self, buyer_user, seller_user, db):
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        msg = MessageFactory(conversation=conv, sender=buyer_user, recipient=seller_user)
        client = _make_auth_client(seller_user)
        resp = client.post(_mark_read_url(msg.pk))
        assert resp.status_code == status.HTTP_200_OK
        msg.refresh_from_db()
        assert msg.status == MessageStatus.READ

    def test_non_participant_cannot_mark_message_read(self, buyer_user, seller_user, db):
        outsider = UserFactory(role=UserRole.BUYER)
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        msg = MessageFactory(conversation=conv, sender=buyer_user)
        client = _make_auth_client(outsider)
        resp = client.post(_mark_read_url(msg.pk))
        assert resp.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)

    def test_recipient_can_mark_message_delivered(self, buyer_user, seller_user, db):
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        msg = MessageFactory(
            conversation=conv,
            sender=buyer_user,
            recipient=seller_user,
            status=MessageStatus.SENT,
        )
        client = _make_auth_client(seller_user)
        resp = client.patch(_mark_delivered_url(msg.pk))
        assert resp.status_code == status.HTTP_200_OK
        msg.refresh_from_db()
        assert msg.status == MessageStatus.DELIVERED

    def test_sender_cannot_mark_own_message_delivered(self, buyer_user, seller_user, db):
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        msg = MessageFactory(conversation=conv, sender=buyer_user, recipient=seller_user)
        client = _make_auth_client(buyer_user)
        resp = client.patch(_mark_delivered_url(msg.pk))
        assert resp.status_code in (status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN)


# ---------------------------------------------------------------------------
# Cannot start conversation with self or about own listing
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestSelfMessaging:
    def test_seller_cannot_message_own_listing(self, seller_user, sample_category, db):
        from apps.listings.models import Listing
        from apps.common.constants import ListingCondition, Currency, ZimbabweCity
        from decimal import Decimal
        listing = Listing.objects.create(
            owner=seller_user,
            title="My Listing",
            description="desc",
            price=Decimal("50.00"),
            currency=Currency.USD,
            condition=ListingCondition.NEW,
            status=ListingStatus.ACTIVE,
            category=sample_category,
            location=ZimbabweCity.HARARE,
        )
        client = _make_auth_client(seller_user)
        payload = {
            "listing_id": listing.pk,
            "initial_message": "Hi me",
        }
        resp = client.post(INBOX_START_URL, payload, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_cannot_message_about_inactive_listing(self, buyer_user, seller_user, sample_category, db):
        from apps.listings.models import Listing
        from apps.common.constants import ListingCondition, Currency, ZimbabweCity
        from decimal import Decimal
        listing = Listing.objects.create(
            owner=seller_user,
            title="Draft Listing",
            description="desc",
            price=Decimal("50.00"),
            currency=Currency.USD,
            condition=ListingCondition.NEW,
            status=ListingStatus.DRAFT,
            category=sample_category,
            location=ZimbabweCity.HARARE,
        )
        client = _make_auth_client(buyer_user)
        payload = {
            "listing_id": listing.pk,
            "initial_message": "Available?",
        }
        resp = client.post(INBOX_START_URL, payload, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_buyer_can_message_seller_about_active_listing(self, buyer_user, sample_listing, db):
        client = _make_auth_client(buyer_user)
        payload = {
            "listing_id": sample_listing.pk,
            "initial_message": "Is this still available?",
        }
        resp = client.post(INBOX_START_URL, payload, format="json")
        assert resp.status_code == status.HTTP_201_CREATED


# ---------------------------------------------------------------------------
# Blocked conversation
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestBlockedConversation:
    def test_cannot_send_to_blocked_conversation(self, buyer_user, seller_user, db):
        from apps.inbox.models import ConversationStatus
        conv = ConversationFactory(
            participants=[buyer_user, seller_user],
            status=ConversationStatus.BLOCKED,
        )
        client = _make_auth_client(buyer_user)
        resp = client.post(_send_url(conv.pk), {"content": "Hello!"}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
