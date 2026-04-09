"""
Tests for the listings app — CRUD, filters, publishing, views count.
"""

import pytest
from rest_framework import status

from apps.common.constants import ListingCondition, ListingStatus, ZimbabweCity
from tests.conftest import CategoryFactory, ListingFactory, UserFactory

LIST_URL = "/api/listings/"
MY_LISTINGS_URL = "/api/listings/my-listings/"


def _detail_url(listing_id):
    return f"/api/listings/{listing_id}/"


def _publish_url(listing_id):
    return f"/api/listings/{listing_id}/publish/"


# ──────────────────────────────────────────────
# Public listing list + filters
# ──────────────────────────────────────────────


@pytest.mark.django_db
class TestListingList:
    def test_list_active_listings_public(self, api_client, sample_listing):
        resp = api_client.get(LIST_URL)
        assert resp.status_code == status.HTTP_200_OK
        slugs = [l["title"] for l in resp.data["results"]]
        assert sample_listing.title in slugs

    def test_draft_not_in_public_list(self, api_client, draft_listing):
        resp = api_client.get(LIST_URL)
        titles = [l["title"] for l in resp.data["results"]]
        assert draft_listing.title not in titles

    def test_filter_by_category(self, api_client, sample_listing):
        resp = api_client.get(LIST_URL, {"category": sample_listing.category.pk})
        assert resp.status_code == status.HTTP_200_OK

    def test_filter_by_location(self, api_client, sample_listing):
        resp = api_client.get(LIST_URL, {"location": ZimbabweCity.HARARE})
        assert resp.status_code == status.HTTP_200_OK

    def test_filter_by_price_range(self, api_client, sample_listing):
        resp = api_client.get(LIST_URL, {"min_price": "50", "max_price": "200"})
        assert resp.status_code == status.HTTP_200_OK

    def test_filter_by_condition(self, api_client, sample_listing):
        resp = api_client.get(LIST_URL, {"condition": ListingCondition.NEW})
        assert resp.status_code == status.HTTP_200_OK

    def test_search_listings(self, api_client, sample_listing):
        resp = api_client.get(LIST_URL, {"search": "iPhone"})
        assert resp.status_code == status.HTTP_200_OK


# ──────────────────────────────────────────────
# Create
# ──────────────────────────────────────────────


@pytest.mark.django_db
class TestListingCreate:
    def _payload(self, category_id):
        return {
            "title": "Samsung Galaxy S24",
            "description": "Brand new Samsung Galaxy S24 for sale.",
            "price": "800.00",
            "currency": "USD",
            "condition": "NEW",
            "category_id": category_id,
            "location": "HARARE",
        }

    def test_create_listing_as_seller(self, seller_client, sample_category, mocker):
        mocker.patch("apps.listings.services.process_listing_images")
        resp = seller_client.post(
            LIST_URL, self._payload(sample_category.pk), format="json"
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["title"] == "Samsung Galaxy S24"
        assert resp.data["status"] == ListingStatus.DRAFT

    def test_create_listing_as_buyer_forbidden(self, buyer_client, sample_category):
        resp = buyer_client.post(
            LIST_URL, self._payload(sample_category.pk), format="json"
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_create_listing_unauthenticated(self, api_client, sample_category):
        resp = api_client.post(
            LIST_URL, self._payload(sample_category.pk), format="json"
        )
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


# ──────────────────────────────────────────────
# Detail / Update / Delete
# ──────────────────────────────────────────────


@pytest.mark.django_db
class TestListingDetail:
    def test_get_listing_detail(self, api_client, sample_listing, mocker):
        mocker.patch("apps.listings.views.increment_view_count")
        resp = api_client.get(_detail_url(sample_listing.pk))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["id"] == sample_listing.pk

    def test_update_own_listing(self, seller_client, sample_listing):
        resp = seller_client.patch(
            _detail_url(sample_listing.pk),
            {"title": "Updated Title"},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["title"] == "Updated Title"

    def test_update_other_listing_forbidden(self, buyer_client, sample_listing):
        resp = buyer_client.patch(
            _detail_url(sample_listing.pk),
            {"title": "Hacked Title"},
            format="json",
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_delete_own_listing(self, seller_client, sample_listing):
        resp = seller_client.delete(_detail_url(sample_listing.pk))
        assert resp.status_code == status.HTTP_204_NO_CONTENT

    def test_delete_admin_can_delete_any(self, admin_client, sample_listing):
        resp = admin_client.delete(_detail_url(sample_listing.pk))
        assert resp.status_code == status.HTTP_204_NO_CONTENT


# ──────────────────────────────────────────────
# Publish + My listings
# ──────────────────────────────────────────────


@pytest.mark.django_db
class TestListingPublish:
    def test_publish_listing(self, seller_client, draft_listing):
        resp = seller_client.post(_publish_url(draft_listing.pk))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["status"] == ListingStatus.ACTIVE

    def test_publish_already_active_fails(self, seller_client, sample_listing):
        resp = seller_client.post(_publish_url(sample_listing.pk))
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_my_listings(self, seller_client, sample_listing, draft_listing):
        resp = seller_client.get(MY_LISTINGS_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data["results"]) >= 2

    def test_increment_views_count(self, api_client, sample_listing, mocker):
        mock_incr = mocker.patch("apps.listings.views.increment_view_count")
        api_client.get(_detail_url(sample_listing.pk))
        mock_incr.assert_called_once_with(sample_listing.pk)
