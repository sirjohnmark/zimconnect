"""
Row-Level Security tests for listings, listing images, and saved listings.

Verifies that:
  - anonymous users can only see ACTIVE listings
  - sellers cannot read / modify other sellers' listings
  - sellers cannot self-approve listings
  - buyers cannot read another buyer's saved listings
  - admins and moderators can access moderation data
  - protected fields (status, rejection_reason) cannot be updated by owners
"""

from __future__ import annotations

import pytest
from django.urls import reverse
from rest_framework import status

from apps.common.constants import ListingStatus, UserRole
from apps.listings.models import Listing, SavedListing
from tests.conftest import (
    CategoryFactory,
    ListingFactory,
    UserFactory,
    _make_auth_client,
)

LIST_URL = "/api/v1/listings/"
MY_LISTINGS_URL = "/api/v1/listings/my/"
SAVED_URL = "/api/v1/buyers/saved/"


def _detail_url(pk):
    return f"/api/v1/listings/{pk}/"


def _publish_url(pk):
    return f"/api/v1/listings/{pk}/publish/"


# ---------------------------------------------------------------------------
# Anonymous / public listing visibility
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPublicListingVisibility:
    """Anonymous users must only see ACTIVE listings."""

    def test_active_listing_visible_to_anon(self, api_client, sample_listing):
        resp = api_client.get(_detail_url(sample_listing.pk))
        assert resp.status_code == status.HTTP_200_OK

    def test_draft_listing_hidden_from_anon(self, api_client, seller_user, sample_category, db):
        draft = ListingFactory(owner=seller_user, category=sample_category, status=ListingStatus.DRAFT)
        resp = api_client.get(_detail_url(draft.pk))
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_rejected_listing_hidden_from_anon(self, api_client, seller_user, sample_category, db):
        rejected = ListingFactory(
            owner=seller_user, category=sample_category, status=ListingStatus.REJECTED
        )
        resp = api_client.get(_detail_url(rejected.pk))
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_sold_listing_hidden_from_anon(self, api_client, seller_user, sample_category, db):
        sold = ListingFactory(owner=seller_user, category=sample_category, status=ListingStatus.SOLD)
        resp = api_client.get(_detail_url(sold.pk))
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_archived_listing_hidden_from_anon(self, api_client, seller_user, sample_category, db):
        archived = ListingFactory(
            owner=seller_user, category=sample_category, status=ListingStatus.ARCHIVED
        )
        resp = api_client.get(_detail_url(archived.pk))
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_list_only_returns_active_to_anon(self, api_client, seller_user, sample_category, db):
        active = ListingFactory(owner=seller_user, category=sample_category, status=ListingStatus.ACTIVE)
        draft = ListingFactory(owner=seller_user, category=sample_category, status=ListingStatus.DRAFT)
        resp = api_client.get(LIST_URL)
        assert resp.status_code == status.HTTP_200_OK
        pks = {r["id"] for r in resp.data["results"]}
        assert active.pk in pks
        assert draft.pk not in pks

    def test_anon_cannot_create_listing(self, api_client, sample_category):
        payload = {
            "title": "Hack attempt",
            "description": "x",
            "price": "1.00",
            "currency": "USD",
            "condition": "NEW",
            "category_id": sample_category.pk,
            "location": "HARARE",
        }
        resp = api_client.post(LIST_URL, payload, format="json")
        assert resp.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


# ---------------------------------------------------------------------------
# Owner visibility — sellers see their own listings in any status
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestOwnerListingVisibility:
    def test_owner_sees_own_draft(self, seller_user, sample_category, db):
        draft = ListingFactory(owner=seller_user, category=sample_category, status=ListingStatus.DRAFT)
        client = _make_auth_client(seller_user)
        resp = client.get(_detail_url(draft.pk))
        assert resp.status_code == status.HTTP_200_OK

    def test_owner_sees_own_rejected(self, seller_user, sample_category, db):
        rejected = ListingFactory(
            owner=seller_user, category=sample_category, status=ListingStatus.REJECTED
        )
        client = _make_auth_client(seller_user)
        resp = client.get(_detail_url(rejected.pk))
        assert resp.status_code == status.HTTP_200_OK

    def test_my_listings_scoped_to_owner(self, seller_user, sample_category, db):
        other_seller = UserFactory(role=UserRole.SELLER)
        mine = ListingFactory(owner=seller_user, category=sample_category)
        ListingFactory(owner=other_seller, category=sample_category)
        client = _make_auth_client(seller_user)
        resp = client.get(MY_LISTINGS_URL)
        pks = {r["id"] for r in resp.data["results"]}
        assert mine.pk in pks
        assert all(Listing.all_objects.get(pk=p).owner_id == seller_user.pk for p in pks)


# ---------------------------------------------------------------------------
# Cross-seller isolation — one seller cannot access another's private data
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestCrossSellerIsolation:
    def test_seller_cannot_see_other_draft(self, sample_category, db):
        owner = UserFactory(role=UserRole.SELLER)
        attacker = UserFactory(role=UserRole.SELLER)
        draft = ListingFactory(owner=owner, category=sample_category, status=ListingStatus.DRAFT)
        client = _make_auth_client(attacker)
        resp = client.get(_detail_url(draft.pk))
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_seller_cannot_update_other_listing(self, seller_user, sample_listing, db):
        attacker = UserFactory(role=UserRole.SELLER)
        client = _make_auth_client(attacker)
        resp = client.patch(_detail_url(sample_listing.pk), {"title": "Hacked"}, format="json")
        assert resp.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)

    def test_seller_cannot_delete_other_listing(self, seller_user, sample_listing, db):
        attacker = UserFactory(role=UserRole.SELLER)
        client = _make_auth_client(attacker)
        resp = client.delete(_detail_url(sample_listing.pk))
        assert resp.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)

    def test_seller_cannot_publish_other_listing(self, sample_category, db):
        owner = UserFactory(role=UserRole.SELLER)
        attacker = UserFactory(role=UserRole.SELLER)
        draft = ListingFactory(owner=owner, category=sample_category, status=ListingStatus.DRAFT)
        client = _make_auth_client(attacker)
        resp = client.post(_publish_url(draft.pk))
        assert resp.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)


# ---------------------------------------------------------------------------
# Sellers cannot self-approve listings
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestSellerCannotSelfApprove:
    def test_seller_cannot_set_status_to_active(self, seller_user, sample_category, db):
        draft = ListingFactory(owner=seller_user, category=sample_category, status=ListingStatus.DRAFT)
        client = _make_auth_client(seller_user)
        resp = client.patch(_detail_url(draft.pk), {"status": "ACTIVE"}, format="json")
        # Should either ignore the field or reject; the listing must not become ACTIVE.
        draft.refresh_from_db()
        assert draft.status != ListingStatus.ACTIVE

    def test_seller_cannot_set_rejection_reason(self, seller_user, sample_category, db):
        listing = ListingFactory(owner=seller_user, category=sample_category)
        client = _make_auth_client(seller_user)
        resp = client.patch(
            _detail_url(listing.pk), {"rejection_reason": "self-approved"}, format="json"
        )
        listing.refresh_from_db()
        assert listing.rejection_reason != "self-approved"

    def test_seller_cannot_set_featured(self, seller_user, sample_listing, db):
        client = _make_auth_client(seller_user)
        resp = client.patch(
            _detail_url(sample_listing.pk), {"is_featured": True}, format="json"
        )
        sample_listing.refresh_from_db()
        # is_featured is only settable by admin
        assert not sample_listing.is_featured


# ---------------------------------------------------------------------------
# Admin / Moderator can access all listings
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestAdminListingAccess:
    def test_moderator_sees_draft_via_detail(self, seller_user, sample_category, db, moderator_user):
        draft = ListingFactory(owner=seller_user, category=sample_category, status=ListingStatus.DRAFT)
        client = _make_auth_client(moderator_user)
        resp = client.get(_detail_url(draft.pk))
        assert resp.status_code == status.HTTP_200_OK

    def test_admin_can_delete_any_listing(self, admin_user, sample_listing, db):
        client = _make_auth_client(admin_user)
        resp = client.delete(_detail_url(sample_listing.pk))
        assert resp.status_code == status.HTTP_204_NO_CONTENT


# ---------------------------------------------------------------------------
# Saved listings — buyers can only access their own
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestSavedListingIsolation:
    def test_buyer_can_save_active_listing(self, buyer_user, sample_listing, db):
        client = _make_auth_client(buyer_user)
        resp = client.post(SAVED_URL, {"listing_id": sample_listing.pk}, format="json")
        assert resp.status_code in (status.HTTP_200_OK, status.HTTP_201_CREATED)

    def test_buyer_can_view_own_saved(self, buyer_user, sample_listing, db):
        SavedListing.objects.create(buyer=buyer_user, listing=sample_listing)
        client = _make_auth_client(buyer_user)
        resp = client.get(SAVED_URL)
        assert resp.status_code == status.HTTP_200_OK
        pks = {r["listing"]["id"] for r in resp.data["results"]}
        assert sample_listing.pk in pks

    def test_buyer_cannot_see_other_buyers_saved(self, buyer_user, sample_listing, db):
        other_buyer = UserFactory(role=UserRole.BUYER)
        SavedListing.objects.create(buyer=other_buyer, listing=sample_listing)
        client = _make_auth_client(buyer_user)
        resp = client.get(SAVED_URL)
        assert resp.status_code == status.HTTP_200_OK
        # buyer_user's saved list should be empty — they saved nothing
        assert len(resp.data["results"]) == 0
