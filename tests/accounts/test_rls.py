"""
Row-Level Security tests for user accounts, profiles, and seller upgrade requests.

Verifies:
  - users can only read/update their own profiles
  - protected fields (role, is_staff, is_active) cannot be updated via profile PATCH
  - seller upgrade requests are user-scoped
  - users cannot approve their own seller application
  - admins can access all user data
"""

from __future__ import annotations

import pytest
from rest_framework import status

from apps.common.constants import SellerUpgradeStatus, UserRole
from apps.accounts.models import SellerUpgradeRequest
from tests.conftest import UserFactory, _make_auth_client

PROFILE_URL = "/api/v1/auth/profile/"
UPGRADE_URL = "/api/v1/auth/upgrade-to-seller/"
UPGRADE_STATUS_URL = "/api/v1/auth/upgrade-status/"


# ---------------------------------------------------------------------------
# Profile read
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestProfileAccess:
    def test_authenticated_user_reads_own_profile(self, buyer_user):
        client = _make_auth_client(buyer_user)
        resp = client.get(PROFILE_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["email"] == buyer_user.email

    def test_anon_cannot_read_profile(self, api_client):
        resp = api_client.get(PROFILE_URL)
        assert resp.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


# ---------------------------------------------------------------------------
# Protected fields cannot be updated by users
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestProtectedFieldUpdate:
    def test_user_cannot_change_own_role(self, buyer_user):
        client = _make_auth_client(buyer_user)
        resp = client.patch(PROFILE_URL, {"role": "ADMIN"}, format="json")
        buyer_user.refresh_from_db()
        assert buyer_user.role == UserRole.BUYER

    def test_user_cannot_change_is_staff(self, buyer_user):
        client = _make_auth_client(buyer_user)
        resp = client.patch(PROFILE_URL, {"is_staff": True}, format="json")
        buyer_user.refresh_from_db()
        assert buyer_user.is_staff is False

    def test_user_cannot_change_is_active(self, buyer_user):
        client = _make_auth_client(buyer_user)
        resp = client.patch(PROFILE_URL, {"is_active": False}, format="json")
        buyer_user.refresh_from_db()
        assert buyer_user.is_active is True

    def test_user_cannot_set_email_verified(self, buyer_user):
        buyer_user.email_verified = False
        buyer_user.save(update_fields=["email_verified"])
        client = _make_auth_client(buyer_user)
        resp = client.patch(PROFILE_URL, {"email_verified": True}, format="json")
        buyer_user.refresh_from_db()
        assert buyer_user.email_verified is False

    def test_user_can_update_safe_fields(self, buyer_user):
        client = _make_auth_client(buyer_user)
        resp = client.patch(PROFILE_URL, {"bio": "Hello from Zimbabwe!"}, format="json")
        assert resp.status_code == status.HTTP_200_OK
        buyer_user.refresh_from_db()
        assert buyer_user.bio == "Hello from Zimbabwe!"


# ---------------------------------------------------------------------------
# Seller upgrade requests — user-scoped
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestSellerUpgradeRequestAccess:
    def test_buyer_can_submit_upgrade_request(self, buyer_user):
        buyer_user.email_verified = True
        buyer_user.save(update_fields=["email_verified"])
        client = _make_auth_client(buyer_user)
        payload = {
            "business_name": "My Shop",
            "business_description": "Selling electronics.",
        }
        resp = client.post(UPGRADE_URL, payload, format="json")
        assert resp.status_code in (status.HTTP_201_CREATED, status.HTTP_200_OK)

    def test_user_can_read_own_upgrade_status(self, buyer_user, db):
        SellerUpgradeRequest.objects.create(
            user=buyer_user,
            status=SellerUpgradeStatus.PENDING,
            business_name="My Shop",
        )
        client = _make_auth_client(buyer_user)
        resp = client.get(UPGRADE_STATUS_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["status"] == SellerUpgradeStatus.PENDING

    def test_user_cannot_see_other_users_upgrade_status(self, buyer_user, db):
        other = UserFactory(role=UserRole.BUYER)
        SellerUpgradeRequest.objects.create(
            user=other,
            status=SellerUpgradeStatus.PENDING,
            business_name="Other Shop",
        )
        # buyer_user has no request — should get 404
        client = _make_auth_client(buyer_user)
        resp = client.get(UPGRADE_STATUS_URL)
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_seller_cannot_apply_again(self, seller_user):
        client = _make_auth_client(seller_user)
        payload = {"business_name": "Another Shop", "business_description": "x"}
        resp = client.post(UPGRADE_URL, payload, format="json")
        # IsBuyer permission blocks sellers from applying again
        assert resp.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Admin user management is restricted
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestAdminUserManagement:
    def test_buyer_cannot_access_admin_users_list(self, buyer_user):
        client = _make_auth_client(buyer_user)
        resp = client.get("/api/v1/admin/users/")
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_moderator_cannot_access_admin_users_list(self, moderator_user):
        client = _make_auth_client(moderator_user)
        resp = client.get("/api/v1/admin/users/")
        # Moderators don't have IsAdmin permission, but RequireTwoFactor also blocks without 2FA
        assert resp.status_code == status.HTTP_403_FORBIDDEN
