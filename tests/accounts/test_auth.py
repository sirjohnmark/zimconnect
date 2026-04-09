"""
Tests for the accounts app — registration, login, logout, profile, token refresh.
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework import status

from tests.conftest import UserFactory

User = get_user_model()

REGISTER_URL = "/api/auth/register/"
LOGIN_URL = "/api/auth/login/"
LOGOUT_URL = "/api/auth/logout/"
REFRESH_URL = "/api/auth/token/refresh/"
PROFILE_URL = "/api/auth/profile/"


# ──────────────────────────────────────────────
# Registration
# ──────────────────────────────────────────────


@pytest.mark.django_db
class TestRegistration:
    def test_register_buyer(self, api_client, mocker):
        mocker.patch("apps.accounts.services.send_welcome_email")
        mocker.patch("apps.accounts.views.send_otp_task")
        mocker.patch("apps.accounts.views.send_email_otp_task")
        data = {
            "email": "buyer@test.com",
            "username": "newbuyer",
            "password": "StrongPass1!",
            "confirm_password": "StrongPass1!",
            "phone": "+263771234567",
            "role": "BUYER",
        }
        resp = api_client.post(REGISTER_URL, data, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["email"] == "buyer@test.com"
        assert resp.data["role"] == "BUYER"

    def test_register_seller(self, api_client, mocker):
        mocker.patch("apps.accounts.services.send_welcome_email")
        mocker.patch("apps.accounts.views.send_otp_task")
        mocker.patch("apps.accounts.views.send_email_otp_task")
        data = {
            "email": "seller@test.com",
            "username": "newseller",
            "password": "StrongPass1!",
            "confirm_password": "StrongPass1!",
            "phone": "+263771234568",
            "role": "SELLER",
        }
        resp = api_client.post(REGISTER_URL, data, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["role"] == "SELLER"

    def test_register_cannot_be_admin(self, api_client, mocker):
        mocker.patch("apps.accounts.services.send_welcome_email")
        mocker.patch("apps.accounts.views.send_email_otp_task")
        data = {
            "email": "admin@test.com",
            "username": "newadmin",
            "password": "StrongPass1!",
            "confirm_password": "StrongPass1!",
            "phone": "+263771234569",
            "role": "ADMIN",
        }
        resp = api_client.post(REGISTER_URL, data, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_duplicate_email(self, api_client, buyer_user, mocker):
        mocker.patch("apps.accounts.services.send_welcome_email")
        mocker.patch("apps.accounts.views.send_email_otp_task")
        data = {
            "email": buyer_user.email,
            "username": "unique_user",
            "password": "StrongPass1!",
            "confirm_password": "StrongPass1!",
            "phone": "+263771234570",
            "role": "BUYER",
        }
        resp = api_client.post(REGISTER_URL, data, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_invalid_zimbabwe_phone(self, api_client, mocker):
        mocker.patch("apps.accounts.services.send_welcome_email")
        mocker.patch("apps.accounts.views.send_email_otp_task")
        data = {
            "email": "badphone@test.com",
            "username": "badphone",
            "password": "StrongPass1!",
            "confirm_password": "StrongPass1!",
            "phone": "+1234567890",  # not a Zimbabwe number
            "role": "BUYER",
        }
        resp = api_client.post(REGISTER_URL, data, format="json")
        # Should fail validation on Zimbabwe phone
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# ──────────────────────────────────────────────
# Login
# ──────────────────────────────────────────────


@pytest.mark.django_db
class TestLogin:
    def test_login_success(self, api_client, buyer_user):
        resp = api_client.post(
            LOGIN_URL,
            {"email": buyer_user.email, "password": "TestPass123!"},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert "tokens" in resp.data
        assert "access" in resp.data["tokens"]
        assert "refresh" in resp.data["tokens"]
        assert resp.data["user"]["email"] == buyer_user.email

    def test_login_wrong_password(self, api_client, buyer_user):
        resp = api_client.post(
            LOGIN_URL,
            {"email": buyer_user.email, "password": "WrongPass999!"},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert resp.data["error"]["code"] == "service_error"

    def test_login_inactive_user(self, api_client, db):
        inactive = UserFactory(is_active=False)
        resp = api_client.post(
            LOGIN_URL,
            {"email": inactive.email, "password": "TestPass123!"},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# ──────────────────────────────────────────────
# Logout
# ──────────────────────────────────────────────


@pytest.mark.django_db
class TestLogout:
    def test_logout_blacklists_token(self, buyer_client, buyer_user):
        from rest_framework_simplejwt.tokens import RefreshToken

        token = RefreshToken.for_user(buyer_user)
        resp = buyer_client.post(
            LOGOUT_URL,
            {"refresh": str(token)},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK

        # Trying to use the same refresh token should fail
        resp2 = buyer_client.post(
            REFRESH_URL,
            {"refresh": str(token)},
            format="json",
        )
        assert resp2.status_code == status.HTTP_400_BAD_REQUEST


# ──────────────────────────────────────────────
# Token Refresh
# ──────────────────────────────────────────────


@pytest.mark.django_db
class TestTokenRefresh:
    def test_token_refresh(self, api_client, buyer_user):
        from rest_framework_simplejwt.tokens import RefreshToken

        token = RefreshToken.for_user(buyer_user)
        resp = api_client.post(
            REFRESH_URL,
            {"refresh": str(token)},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert "access" in resp.data


# ──────────────────────────────────────────────
# Profile
# ──────────────────────────────────────────────


@pytest.mark.django_db
class TestProfile:
    def test_profile_get(self, buyer_client, buyer_user):
        resp = buyer_client.get(PROFILE_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["email"] == buyer_user.email

    def test_profile_update(self, buyer_client, buyer_user):
        resp = buyer_client.patch(
            PROFILE_URL,
            {"first_name": "Updated", "bio": "New bio"},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["first_name"] == "Updated"
        assert resp.data["bio"] == "New bio"

    def test_profile_unauthorized(self, api_client):
        resp = api_client.get(PROFILE_URL)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED
