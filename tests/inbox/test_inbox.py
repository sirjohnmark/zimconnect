"""
Comprehensive feature tests for the inbox messaging system.

Covers:
  - Starting conversations (reuse, validation)
  - Sending messages
  - Listing conversations
  - Retrieving messages (pagination, ordering)
  - Mark delivered / read (single and batch)
  - Unread count
  - Archiving conversations
  - Message reporting
  - Status lifecycle
"""

from __future__ import annotations

import pytest
from rest_framework import status

from apps.common.constants import ListingStatus, UserRole
from apps.inbox.models import (
    Conversation,
    ConversationParticipant,
    ConversationStatus,
    Message,
    MessageStatus,
)
from tests.conftest import (
    ConversationFactory,
    ListingFactory,
    MessageFactory,
    UserFactory,
    _make_auth_client,
)

INBOX_LIST_URL = "/api/v1/inbox/"
INBOX_START_URL = "/api/v1/inbox/start/"
UNREAD_COUNT_URL = "/api/v1/inbox/unread-count/"


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


def _archive_url(pk):
    return f"/api/v1/inbox/{pk}/archive/"


def _mark_read_url(message_pk):
    return f"/api/v1/inbox/messages/{message_pk}/mark-read/"


def _mark_delivered_url(message_pk):
    return f"/api/v1/inbox/messages/{message_pk}/delivered/"


def _report_url(message_pk):
    return f"/api/v1/inbox/messages/{message_pk}/report/"


# ---------------------------------------------------------------------------
# Starting a conversation
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestStartConversation:
    def test_buyer_starts_conversation_with_seller(self, buyer_user, sample_listing, db):
        client = _make_auth_client(buyer_user)
        payload = {"listing_id": sample_listing.pk, "initial_message": "Is this available?"}
        resp = client.post(INBOX_START_URL, payload, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert Conversation.objects.count() == 1
        assert Message.objects.count() == 1

    def test_start_conversation_creates_participant_records(self, buyer_user, sample_listing, db):
        client = _make_auth_client(buyer_user)
        payload = {"listing_id": sample_listing.pk, "initial_message": "Hi"}
        client.post(INBOX_START_URL, payload, format="json")
        assert ConversationParticipant.objects.filter(user=buyer_user).exists()
        assert ConversationParticipant.objects.filter(user=sample_listing.owner).exists()

    def test_reuses_existing_conversation(self, buyer_user, sample_listing, db):
        client = _make_auth_client(buyer_user)
        payload = {"listing_id": sample_listing.pk, "initial_message": "First message"}
        resp1 = client.post(INBOX_START_URL, payload, format="json")
        resp2 = client.post(INBOX_START_URL, payload, format="json")
        assert resp1.status_code == status.HTTP_201_CREATED
        assert resp2.status_code == status.HTTP_201_CREATED
        assert resp1.data["id"] == resp2.data["id"]
        assert Conversation.objects.count() == 1
        assert Message.objects.count() == 2

    def test_listing_not_found_returns_404(self, buyer_user, db):
        client = _make_auth_client(buyer_user)
        payload = {"listing_id": 99999, "initial_message": "Hi"}
        resp = client.post(INBOX_START_URL, payload, format="json")
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_empty_message_rejected(self, buyer_user, sample_listing, db):
        client = _make_auth_client(buyer_user)
        payload = {"listing_id": sample_listing.pk, "initial_message": ""}
        resp = client.post(INBOX_START_URL, payload, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_message_too_long_rejected(self, buyer_user, sample_listing, db):
        client = _make_auth_client(buyer_user)
        payload = {"listing_id": sample_listing.pk, "initial_message": "x" * 2001}
        resp = client.post(INBOX_START_URL, payload, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_response_includes_listing_buyer_seller(self, buyer_user, sample_listing, db):
        client = _make_auth_client(buyer_user)
        payload = {"listing_id": sample_listing.pk, "initial_message": "Hi"}
        resp = client.post(INBOX_START_URL, payload, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        data = resp.data
        assert data["buyer"]["id"] == buyer_user.pk
        assert data["seller"]["id"] == sample_listing.owner.pk
        assert data["listing"]["id"] == sample_listing.pk

    def test_unauthenticated_cannot_start_conversation(self, api_client, sample_listing, db):
        payload = {"listing_id": sample_listing.pk, "initial_message": "Hi"}
        resp = api_client.post(INBOX_START_URL, payload, format="json")
        assert resp.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


# ---------------------------------------------------------------------------
# Sending messages
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestSendMessage:
    def test_send_message_creates_message_with_sent_status(self, buyer_user, seller_user, db):
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        client = _make_auth_client(buyer_user)
        resp = client.post(_send_url(conv.pk), {"content": "Hello!"}, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["status"] == MessageStatus.SENT
        assert resp.data["content"] == "Hello!"

    def test_send_sets_recipient(self, buyer_user, seller_user, db):
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        client = _make_auth_client(buyer_user)
        client.post(_send_url(conv.pk), {"content": "Hello!"}, format="json")
        msg = Message.objects.get(conversation=conv)
        assert msg.recipient_id == seller_user.pk

    def test_send_updates_conversation_last_message_at(self, buyer_user, seller_user, db):
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        assert conv.last_message_at is None
        client = _make_auth_client(buyer_user)
        client.post(_send_url(conv.pk), {"content": "Hello!"}, format="json")
        conv.refresh_from_db()
        assert conv.last_message_at is not None

    def test_send_empty_content_rejected(self, buyer_user, seller_user, db):
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        client = _make_auth_client(buyer_user)
        resp = client.post(_send_url(conv.pk), {"content": "  "}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_html_is_stripped_from_content(self, buyer_user, seller_user, db):
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        client = _make_auth_client(buyer_user)
        resp = client.post(
            _send_url(conv.pk),
            {"content": "<script>alert(1)</script>Hello"},
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert "<script>" not in resp.data["content"]
        assert "Hello" in resp.data["content"]


# ---------------------------------------------------------------------------
# Listing conversations
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestConversationList:
    def test_returns_only_user_conversations(self, buyer_user, seller_user, db):
        outsider = UserFactory()
        mine = ConversationFactory(participants=[buyer_user, seller_user])
        theirs = ConversationFactory(participants=[outsider, seller_user])
        client = _make_auth_client(buyer_user)
        resp = client.get(INBOX_LIST_URL)
        ids = {c["id"] for c in resp.data["results"]}
        assert mine.pk in ids
        assert theirs.pk not in ids

    def test_list_includes_unread_count(self, buyer_user, seller_user, db):
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        MessageFactory(conversation=conv, sender=seller_user, recipient=buyer_user)
        client = _make_auth_client(buyer_user)
        resp = client.get(INBOX_LIST_URL)
        entry = next(c for c in resp.data["results"] if c["id"] == conv.pk)
        assert entry["unread_count"] == 1

    def test_list_is_paginated(self, buyer_user, db):
        sellers = [UserFactory(role=UserRole.SELLER) for _ in range(25)]
        for s in sellers:
            ConversationFactory(participants=[buyer_user, s])
        client = _make_auth_client(buyer_user)
        resp = client.get(INBOX_LIST_URL)
        assert "results" in resp.data
        assert "count" in resp.data
        assert resp.data["count"] == 25


# ---------------------------------------------------------------------------
# Getting messages
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestGetMessages:
    def test_returns_paginated_messages(self, buyer_user, seller_user, db):
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        for i in range(5):
            MessageFactory(conversation=conv, sender=buyer_user, content=f"msg {i}")
        client = _make_auth_client(buyer_user)
        resp = client.get(_messages_url(conv.pk))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] == 5

    def test_messages_include_sender_info(self, buyer_user, seller_user, db):
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        MessageFactory(conversation=conv, sender=buyer_user)
        client = _make_auth_client(seller_user)
        resp = client.get(_messages_url(conv.pk))
        first = resp.data["results"][0]
        assert first["sender"]["id"] == buyer_user.pk
        assert first["sender"]["username"] == buyer_user.username


# ---------------------------------------------------------------------------
# Unread count
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestUnreadCount:
    def test_zero_when_no_messages(self, buyer_user, db):
        client = _make_auth_client(buyer_user)
        resp = client.get(UNREAD_COUNT_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["unread_count"] == 0

    def test_counts_unread_messages_to_user(self, buyer_user, seller_user, db):
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        MessageFactory(conversation=conv, sender=seller_user, recipient=buyer_user)
        MessageFactory(conversation=conv, sender=seller_user, recipient=buyer_user)
        client = _make_auth_client(buyer_user)
        resp = client.get(UNREAD_COUNT_URL)
        assert resp.data["unread_count"] == 2

    def test_does_not_count_own_messages(self, buyer_user, seller_user, db):
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        MessageFactory(conversation=conv, sender=buyer_user, recipient=seller_user)
        client = _make_auth_client(buyer_user)
        resp = client.get(UNREAD_COUNT_URL)
        assert resp.data["unread_count"] == 0

    def test_decreases_after_mark_read(self, buyer_user, seller_user, db):
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        MessageFactory(conversation=conv, sender=seller_user, recipient=buyer_user)
        client = _make_auth_client(buyer_user)
        resp = client.get(UNREAD_COUNT_URL)
        assert resp.data["unread_count"] == 1
        client.post(_read_url(conv.pk))
        resp = client.get(UNREAD_COUNT_URL)
        assert resp.data["unread_count"] == 0


# ---------------------------------------------------------------------------
# Mark delivered
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestMarkDelivered:
    def test_batch_mark_delivered(self, buyer_user, seller_user, db):
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        m1 = MessageFactory(
            conversation=conv, sender=buyer_user, recipient=seller_user, status=MessageStatus.SENT,
        )
        m2 = MessageFactory(
            conversation=conv, sender=buyer_user, recipient=seller_user, status=MessageStatus.SENT,
        )
        client = _make_auth_client(seller_user)
        resp = client.post(_delivered_url(conv.pk))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["marked"] == 2
        m1.refresh_from_db()
        m2.refresh_from_db()
        assert m1.status == MessageStatus.DELIVERED
        assert m2.status == MessageStatus.DELIVERED

    def test_single_mark_delivered(self, buyer_user, seller_user, db):
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        msg = MessageFactory(
            conversation=conv, sender=buyer_user, recipient=seller_user, status=MessageStatus.SENT,
        )
        client = _make_auth_client(seller_user)
        resp = client.patch(_mark_delivered_url(msg.pk))
        assert resp.status_code == status.HTTP_200_OK
        msg.refresh_from_db()
        assert msg.status == MessageStatus.DELIVERED
        assert msg.delivered_at is not None

    def test_mark_delivered_is_idempotent(self, buyer_user, seller_user, db):
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        msg = MessageFactory(
            conversation=conv, sender=buyer_user, recipient=seller_user,
            status=MessageStatus.DELIVERED,
        )
        client = _make_auth_client(seller_user)
        resp = client.patch(_mark_delivered_url(msg.pk))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["status"] == MessageStatus.DELIVERED


# ---------------------------------------------------------------------------
# Mark read
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestMarkRead:
    def test_batch_mark_conversation_read(self, buyer_user, seller_user, db):
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        m1 = MessageFactory(conversation=conv, sender=seller_user, recipient=buyer_user)
        m2 = MessageFactory(conversation=conv, sender=seller_user, recipient=buyer_user)
        client = _make_auth_client(buyer_user)
        resp = client.post(_read_url(conv.pk))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["marked"] == 2
        m1.refresh_from_db()
        m2.refresh_from_db()
        assert m1.status == MessageStatus.READ
        assert m2.status == MessageStatus.READ
        assert m1.read_at is not None

    def test_mark_read_updates_participant_last_read_at(self, buyer_user, seller_user, db):
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        MessageFactory(conversation=conv, sender=seller_user, recipient=buyer_user)
        client = _make_auth_client(buyer_user)
        client.post(_read_url(conv.pk))
        participant = ConversationParticipant.objects.get(conversation=conv, user=buyer_user)
        assert participant.last_read_at is not None

    def test_single_mark_read(self, buyer_user, seller_user, db):
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        msg = MessageFactory(conversation=conv, sender=seller_user, recipient=buyer_user)
        client = _make_auth_client(buyer_user)
        resp = client.post(_mark_read_url(msg.pk))
        assert resp.status_code == status.HTTP_200_OK
        msg.refresh_from_db()
        assert msg.status == MessageStatus.READ


# ---------------------------------------------------------------------------
# Message status lifecycle
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestMessageStatusLifecycle:
    def test_new_message_has_sent_status(self, buyer_user, seller_user, db):
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        client = _make_auth_client(buyer_user)
        resp = client.post(_send_url(conv.pk), {"content": "Hi"}, format="json")
        assert resp.data["status"] == MessageStatus.SENT

    def test_status_advances_sent_delivered_read(self, buyer_user, seller_user, db):
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        buyer_client = _make_auth_client(buyer_user)
        resp = buyer_client.post(_send_url(conv.pk), {"content": "Hi"}, format="json")
        msg_id = resp.data["id"]
        msg = Message.objects.get(pk=msg_id)
        assert msg.status == MessageStatus.SENT

        seller_client = _make_auth_client(seller_user)
        seller_client.patch(_mark_delivered_url(msg_id))
        msg.refresh_from_db()
        assert msg.status == MessageStatus.DELIVERED
        assert msg.delivered_at is not None

        seller_client.post(_mark_read_url(msg_id))
        msg.refresh_from_db()
        assert msg.status == MessageStatus.READ
        assert msg.read_at is not None


# ---------------------------------------------------------------------------
# Archiving
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestArchiveConversation:
    def test_archive_sets_participant_archived_at(self, buyer_user, seller_user, db):
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        client = _make_auth_client(buyer_user)
        resp = client.post(_archive_url(conv.pk))
        assert resp.status_code == status.HTTP_200_OK
        participant = ConversationParticipant.objects.get(conversation=conv, user=buyer_user)
        assert participant.archived_at is not None

    def test_both_archive_closes_conversation(self, buyer_user, seller_user, db):
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        _make_auth_client(buyer_user).post(_archive_url(conv.pk))
        _make_auth_client(seller_user).post(_archive_url(conv.pk))
        conv.refresh_from_db()
        assert conv.status == ConversationStatus.ARCHIVED


# ---------------------------------------------------------------------------
# Message reporting
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestReportMessage:
    def test_participant_can_report_message(self, buyer_user, seller_user, db):
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        msg = MessageFactory(conversation=conv, sender=seller_user)
        client = _make_auth_client(buyer_user)
        resp = client.post(_report_url(msg.pk), {"reason": "spam"}, format="json")
        assert resp.status_code == status.HTTP_200_OK

    def test_non_participant_cannot_report_message(self, buyer_user, seller_user, db):
        outsider = UserFactory()
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        msg = MessageFactory(conversation=conv, sender=buyer_user)
        client = _make_auth_client(outsider)
        resp = client.post(_report_url(msg.pk), {"reason": "spam"}, format="json")
        assert resp.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)

    def test_invalid_reason_rejected(self, buyer_user, seller_user, db):
        conv = ConversationFactory(participants=[buyer_user, seller_user])
        msg = MessageFactory(conversation=conv, sender=seller_user)
        client = _make_auth_client(buyer_user)
        resp = client.post(_report_url(msg.pk), {"reason": "invalid_reason"}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
