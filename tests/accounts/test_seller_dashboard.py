"""
Tests for buyer/seller dashboard separation and seller applications.
"""

import pytest
from rest_framework import status

from apps.accounts.models import SellerProfile, SellerUpgradeRequest
from apps.common.constants import SellerUpgradeStatus, UserRole
from tests.conftest import ListingFactory

BUYER_DASHBOARD_URL = "/api/v1/buyers/dashboard/"
SELLER_APPLY_URL = "/api/v1/sellers/apply/"
SELLER_APPLICATION_STATUS_URL = "/api/v1/sellers/application-status/"
SELLER_DASHBOARD_URL = "/api/v1/sellers/dashboard/"
SELLER_LISTINGS_URL = "/api/v1/sellers/listings/"


def _approve_request_url(request_id):
    return f"/api/v1/admin/seller-requests/{request_id}/approve/"


@pytest.mark.django_db
class TestBuyerSellerDashboards:
    def test_buyer_dashboard_is_default_for_new_accounts(self, buyer_client, buyer_user):
        resp = buyer_client.get(BUYER_DASHBOARD_URL)

        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["user"]["id"] == buyer_user.pk
        assert resp.data["user"]["role"] == UserRole.BUYER
        assert resp.data["default_dashboard"] == "buyer"
        assert resp.data["can_apply_to_sell"] is True

    def test_buyer_can_apply_to_become_seller(self, buyer_client, buyer_user):
        resp = buyer_client.post(
            SELLER_APPLY_URL,
            {
                "business_name": "Baby Wear Store",
                "business_description": "Children's clothes and accessories.",
            },
            format="json",
        )

        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["status"] == SellerUpgradeStatus.PENDING
        assert SellerUpgradeRequest.objects.filter(user=buyer_user).exists()

        dashboard = buyer_client.get(BUYER_DASHBOARD_URL)
        assert dashboard.data["can_apply_to_sell"] is False
        assert dashboard.data["seller_application"]["status"] == SellerUpgradeStatus.PENDING

    def test_pending_application_blocks_duplicate_apply(self, buyer_client):
        payload = {
            "business_name": "Baby Wear Store",
            "business_description": "Children's clothes and accessories.",
        }

        first = buyer_client.post(SELLER_APPLY_URL, payload, format="json")
        second = buyer_client.post(SELLER_APPLY_URL, payload, format="json")

        assert first.status_code == status.HTTP_201_CREATED
        assert second.status_code == status.HTTP_409_CONFLICT

    def test_application_status_endpoint(self, buyer_client):
        buyer_client.post(
            SELLER_APPLY_URL,
            {"business_name": "Baby Wear Store"},
            format="json",
        )

        resp = buyer_client.get(SELLER_APPLICATION_STATUS_URL)

        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["status"] == SellerUpgradeStatus.PENDING

    def test_admin_approval_promotes_buyer_and_creates_seller_profile(
        self, admin_client, buyer_client, buyer_user
    ):
        apply_resp = buyer_client.post(
            SELLER_APPLY_URL,
            {
                "business_name": "Baby Wear Store",
                "business_description": "Children's clothes and accessories.",
            },
            format="json",
        )

        resp = admin_client.post(_approve_request_url(apply_resp.data["id"]))

        assert resp.status_code == status.HTTP_200_OK
        buyer_user.refresh_from_db()
        assert buyer_user.role == UserRole.SELLER
        profile = SellerProfile.objects.get(user=buyer_user)
        assert profile.shop_name == "Baby Wear Store"

    def test_approved_seller_gets_seller_dashboard(
        self, seller_client, seller_user, sample_category
    ):
        SellerProfile.objects.create(
            user=seller_user,
            shop_name="Seller Shop",
            shop_description="Quality marketplace products.",
        )
        ListingFactory.create_batch(2, owner=seller_user, category=sample_category)

        resp = seller_client.get(SELLER_DASHBOARD_URL)

        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["user"]["role"] == UserRole.SELLER
        assert resp.data["seller_profile"]["shop_name"] == "Seller Shop"
        assert resp.data["listing_stats"]["total"] == 2
        assert len(resp.data["recent_listings"]) == 2

    def test_buyer_cannot_access_seller_dashboard(self, buyer_client):
        resp = buyer_client.get(SELLER_DASHBOARD_URL)

        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_seller_listings_endpoint_is_seller_only(self, buyer_client, seller_client):
        buyer_resp = buyer_client.get(SELLER_LISTINGS_URL)
        seller_resp = seller_client.get(SELLER_LISTINGS_URL)

        assert buyer_resp.status_code == status.HTTP_403_FORBIDDEN
        assert seller_resp.status_code == status.HTTP_200_OK
