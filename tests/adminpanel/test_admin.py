"""
Tests for the admin panel app — dashboard, user management, listing moderation, soft deletes.
"""

import pytest
from rest_framework import status

from apps.accounts.models import SellerProfile
from apps.common.constants import ListingStatus, UserRole
from apps.listings.models import Listing
from tests.conftest import ListingFactory, UserFactory

DASHBOARD_URL = "/api/v1/admin/dashboard/"
USERS_URL = "/api/v1/admin/users/"
MODERATION_URL = "/api/v1/admin/listings/moderation/"
DELETED_LISTINGS_URL = "/api/v1/admin/listings/deleted/"
DELETED_USERS_URL = "/api/v1/admin/users/deleted/"


def _user_detail_url(user_id):
    return f"/api/v1/admin/users/{user_id}/"


def _moderation_detail_url(listing_id):
    return f"/api/v1/admin/listings/moderation/{listing_id}/"


def _approve_url(listing_id):
    return f"/api/v1/admin/listings/moderation/{listing_id}/approve/"


def _reject_url(listing_id):
    return f"/api/v1/admin/listings/moderation/{listing_id}/reject/"


def _restore_url(listing_id):
    return f"/api/v1/admin/listings/{listing_id}/restore/"


# ──────────────────────────────────────────────
# Dashboard
# ──────────────────────────────────────────────


@pytest.mark.django_db
class TestDashboard:
    def test_dashboard_requires_admin(self, buyer_client):
        resp = buyer_client.get(DASHBOARD_URL)
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_dashboard_stats(self, admin_client):
        resp = admin_client.get(DASHBOARD_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert "total_users" in resp.data
        assert "total_listings" in resp.data

    def test_moderator_cannot_access_dashboard(self, moderator_client):
        resp = moderator_client.get(DASHBOARD_URL)
        assert resp.status_code == status.HTTP_403_FORBIDDEN


# ──────────────────────────────────────────────
# User management
# ──────────────────────────────────────────────


@pytest.mark.django_db
class TestAdminUserManagement:
    def test_user_list(self, admin_client):
        UserFactory.create_batch(3)
        resp = admin_client.get(USERS_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert "results" in resp.data

    def test_user_list_filter_by_role(self, admin_client):
        UserFactory.create_batch(2, role=UserRole.SELLER)
        resp = admin_client.get(USERS_URL, {"role": UserRole.SELLER})
        assert resp.status_code == status.HTTP_200_OK
        for user in resp.data["results"]:
            assert user["role"] == UserRole.SELLER

    def test_user_detail(self, admin_client, buyer_user):
        resp = admin_client.get(_user_detail_url(buyer_user.pk))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["email"] == buyer_user.email

    def test_deactivate_user(self, admin_client, buyer_user):
        resp = admin_client.patch(
            _user_detail_url(buyer_user.pk),
            {"is_active": False},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["is_active"] is False

    def test_change_user_role(self, admin_client, buyer_user):
        resp = admin_client.patch(
            _user_detail_url(buyer_user.pk),
            {"role": UserRole.SELLER},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["role"] == UserRole.SELLER
        assert SellerProfile.objects.filter(user=buyer_user).exists()

    def test_cannot_change_own_role(self, admin_client, admin_user):
        resp = admin_client.patch(
            _user_detail_url(admin_user.pk),
            {"role": UserRole.BUYER},
            format="json",
        )
        assert resp.status_code in (
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_409_CONFLICT,
        )

    def test_buyer_cannot_access_user_list(self, buyer_client):
        resp = buyer_client.get(USERS_URL)
        assert resp.status_code == status.HTTP_403_FORBIDDEN


# ──────────────────────────────────────────────
# Listing moderation
# ──────────────────────────────────────────────


@pytest.mark.django_db
class TestListingModeration:
    def test_moderation_queue(self, moderator_client, draft_listing):
        resp = moderator_client.get(MODERATION_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert "results" in resp.data

    def test_moderation_detail(self, moderator_client, draft_listing):
        resp = moderator_client.get(_moderation_detail_url(draft_listing.pk))
        assert resp.status_code == status.HTTP_200_OK

    def test_approve_listing(self, moderator_client, draft_listing):
        resp = moderator_client.post(_approve_url(draft_listing.pk))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["status"] == ListingStatus.ACTIVE

    def test_reject_listing(self, moderator_client, draft_listing):
        resp = moderator_client.post(
            _reject_url(draft_listing.pk),
            {"reason": "Inappropriate content."},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["status"] == ListingStatus.REJECTED

    def test_reject_listing_requires_reason(self, moderator_client, draft_listing):
        resp = moderator_client.post(
            _reject_url(draft_listing.pk),
            {"reason": ""},
            format="json",
        )
        assert resp.status_code in (
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_409_CONFLICT,
        )

    def test_buyer_cannot_access_moderation(self, buyer_client):
        resp = buyer_client.get(MODERATION_URL)
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_access_moderation(self, admin_client, draft_listing):
        """Admin inherits moderator permissions."""
        resp = admin_client.get(MODERATION_URL)
        assert resp.status_code == status.HTTP_200_OK


# ──────────────────────────────────────────────
# Soft-deleted listings
# ──────────────────────────────────────────────


@pytest.mark.django_db
class TestDeletedListings:
    def test_deleted_listings_empty(self, admin_client):
        resp = admin_client.get(DELETED_LISTINGS_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["results"] == []

    def test_deleted_listings_shows_soft_deleted(self, admin_client, sample_listing, admin_user):
        sample_listing.soft_delete(admin_user)
        resp = admin_client.get(DELETED_LISTINGS_URL)
        assert resp.status_code == status.HTTP_200_OK
        ids = [item["id"] for item in resp.data["results"]]
        assert sample_listing.pk in ids

    def test_restore_listing(self, admin_client, sample_listing, admin_user):
        sample_listing.soft_delete(admin_user)
        resp = admin_client.post(_restore_url(sample_listing.pk))
        assert resp.status_code == status.HTTP_200_OK
        listing = Listing.objects.get(pk=sample_listing.pk)
        assert listing.is_deleted is False
        assert listing.status == ListingStatus.DRAFT

    def test_restore_non_deleted_listing_fails(self, admin_client, sample_listing):
        resp = admin_client.post(_restore_url(sample_listing.pk))
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_buyer_cannot_access_deleted_listings(self, buyer_client):
        resp = buyer_client.get(DELETED_LISTINGS_URL)
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_buyer_cannot_restore_listing(self, buyer_client, sample_listing, admin_user):
        sample_listing.soft_delete(admin_user)
        resp = buyer_client.post(_restore_url(sample_listing.pk))
        assert resp.status_code == status.HTTP_403_FORBIDDEN


# ──────────────────────────────────────────────
# Soft-deleted users
# ──────────────────────────────────────────────


@pytest.mark.django_db
class TestDeletedUsers:
    def test_deleted_users_empty(self, admin_client):
        resp = admin_client.get(DELETED_USERS_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["results"] == []

    def test_deleted_users_shows_soft_deleted(self, admin_client, buyer_user, admin_user):
        buyer_user.soft_delete(admin_user)
        resp = admin_client.get(DELETED_USERS_URL)
        assert resp.status_code == status.HTTP_200_OK
        ids = [item["id"] for item in resp.data["results"]]
        assert buyer_user.pk in ids

    def test_buyer_cannot_access_deleted_users(self, buyer_client):
        resp = buyer_client.get(DELETED_USERS_URL)
        assert resp.status_code == status.HTTP_403_FORBIDDEN
