"""
Tests for the TOTP two-factor authentication flow.

Covers:
 - enabling 2FA (setup + confirm)
 - login without 2FA (unchanged flow)
 - login with 2FA required (challenge issued)
 - successful 2FA challenge verification
 - invalid 2FA challenge verification
 - backup code usage (single-use)
 - disabling 2FA
 - admin users blocked without 2FA
"""

from __future__ import annotations

from unittest.mock import patch

import pyotp
import pytest
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import BackupCode, TwoFactorDevice
from apps.accounts import services

User = get_user_model()

# ──────────────────────────────────────────────
# Fixtures
# ──────────────────────────────────────────────


@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def buyer(db):
    return User.objects.create_user(
        email="buyer@test.com",
        username="buyer_test",
        password="strongpass1!",
        role="BUYER",
    )


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        email="admin@test.com",
        username="admin_test",
        password="strongpass1!",
        role="ADMIN",
        is_staff=True,
    )


@pytest.fixture
def buyer_with_2fa(buyer):
    """A buyer whose 2FA is fully enabled with a known secret."""
    secret = pyotp.random_base32()
    encrypted = services._encrypt_totp_secret(secret)
    device = TwoFactorDevice.objects.create(
        user=buyer,
        encrypted_secret=encrypted,
        is_enabled=True,
    )
    from django.utils import timezone
    device.enabled_at = timezone.now()
    device.save(update_fields=["enabled_at"])
    services._create_backup_codes(buyer)
    buyer._totp_secret = secret  # attach plaintext for assertions
    return buyer


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────


def auth_header(client, user):
    """Login and return the bearer access token via the login endpoint."""
    url = reverse("accounts:login")
    resp = client.post(url, {"email": user.email, "password": "strongpass1!"}, format="json")
    if resp.status_code == 200 and "tokens" in resp.data:
        return f"Bearer {resp.data['tokens']['access']}"
    return None  # 2FA required — caller handles


def login_response(client, user):
    url = reverse("accounts:login")
    return client.post(url, {"email": user.email, "password": "strongpass1!"}, format="json")


# ──────────────────────────────────────────────
# Login without 2FA
# ──────────────────────────────────────────────


@pytest.mark.django_db
def test_login_without_2fa_returns_tokens(client, buyer):
    resp = login_response(client, buyer)
    assert resp.status_code == 200
    assert "tokens" in resp.data
    assert "access" in resp.data["tokens"]
    assert "user" in resp.data
    assert resp.data["user"]["totp_enabled"] is False


# ──────────────────────────────────────────────
# 2FA setup flow
# ──────────────────────────────────────────────


@pytest.mark.django_db
def test_setup_2fa_returns_secret_and_qr(client, buyer):
    token = auth_header(client, buyer)
    client.credentials(HTTP_AUTHORIZATION=token)
    resp = client.post(reverse("accounts:2fa-setup"), format="json")
    assert resp.status_code == 200
    data = resp.data
    assert "secret" in data
    assert "uri" in data
    assert data["qr_code"].startswith("data:image/png;base64,")
    assert "otpauth://totp/" in data["uri"]


@pytest.mark.django_db
def test_confirm_2fa_with_valid_code_enables_it(client, buyer):
    token = auth_header(client, buyer)
    client.credentials(HTTP_AUTHORIZATION=token)

    setup_resp = client.post(reverse("accounts:2fa-setup"), format="json")
    secret = setup_resp.data["secret"]
    code = pyotp.TOTP(secret).now()

    confirm_resp = client.post(reverse("accounts:2fa-confirm"), {"code": code}, format="json")
    assert confirm_resp.status_code == 200
    assert "backup_codes" in confirm_resp.data
    assert len(confirm_resp.data["backup_codes"]) == 10

    buyer.refresh_from_db()
    assert TwoFactorDevice.objects.get(user=buyer).is_enabled is True


@pytest.mark.django_db
def test_confirm_2fa_with_invalid_code_rejected(client, buyer):
    token = auth_header(client, buyer)
    client.credentials(HTTP_AUTHORIZATION=token)
    client.post(reverse("accounts:2fa-setup"), format="json")  # start setup

    resp = client.post(reverse("accounts:2fa-confirm"), {"code": "000000"}, format="json")
    assert resp.status_code == 400


# ──────────────────────────────────────────────
# Login with 2FA
# ──────────────────────────────────────────────


@pytest.mark.django_db
def test_login_with_2fa_returns_challenge(client, buyer_with_2fa):
    resp = login_response(client, buyer_with_2fa)
    assert resp.status_code == 200
    assert resp.data.get("requires_2fa") is True
    assert "challenge_token" in resp.data
    assert "tokens" not in resp.data


@pytest.mark.django_db
def test_verify_challenge_with_valid_totp_returns_tokens(client, buyer_with_2fa):
    login_resp = login_response(client, buyer_with_2fa)
    token = login_resp.data["challenge_token"]
    code = pyotp.TOTP(buyer_with_2fa._totp_secret).now()

    verify_resp = client.post(
        reverse("accounts:2fa-verify"),
        {"challenge_token": token, "code": code},
        format="json",
    )
    assert verify_resp.status_code == 200
    assert "tokens" in verify_resp.data
    assert "access" in verify_resp.data["tokens"]
    assert "user" in verify_resp.data


@pytest.mark.django_db
def test_verify_challenge_with_invalid_code_rejected(client, buyer_with_2fa):
    login_resp = login_response(client, buyer_with_2fa)
    token = login_resp.data["challenge_token"]

    resp = client.post(
        reverse("accounts:2fa-verify"),
        {"challenge_token": token, "code": "000000"},
        format="json",
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_challenge_token_expires_after_ttl(client, buyer_with_2fa):
    login_resp = login_response(client, buyer_with_2fa)
    token = login_resp.data["challenge_token"]

    # Manually expire by deleting from cache
    cache.delete(services._challenge_key(token))

    code = pyotp.TOTP(buyer_with_2fa._totp_secret).now()
    resp = client.post(
        reverse("accounts:2fa-verify"),
        {"challenge_token": token, "code": code},
        format="json",
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_challenge_locked_after_max_attempts(client, buyer_with_2fa):
    login_resp = login_response(client, buyer_with_2fa)
    token = login_resp.data["challenge_token"]

    for _ in range(services.TOTP_CHALLENGE_MAX_ATTEMPTS):
        client.post(
            reverse("accounts:2fa-verify"),
            {"challenge_token": token, "code": "000000"},
            format="json",
        )

    # Next attempt should also fail (token consumed)
    code = pyotp.TOTP(buyer_with_2fa._totp_secret).now()
    resp = client.post(
        reverse("accounts:2fa-verify"),
        {"challenge_token": token, "code": code},
        format="json",
    )
    assert resp.status_code == 400


# ──────────────────────────────────────────────
# Backup code usage
# ──────────────────────────────────────────────


@pytest.mark.django_db
def test_verify_challenge_with_backup_code(client, buyer_with_2fa):
    # Get a plaintext backup code from the DB via regeneration
    plain_codes = services._create_backup_codes(buyer_with_2fa)

    login_resp = login_response(client, buyer_with_2fa)
    token = login_resp.data["challenge_token"]

    resp = client.post(
        reverse("accounts:2fa-verify"),
        {"challenge_token": token, "code": plain_codes[0]},
        format="json",
    )
    assert resp.status_code == 200
    assert "tokens" in resp.data


@pytest.mark.django_db
def test_backup_code_cannot_be_reused(client, buyer_with_2fa):
    plain_codes = services._create_backup_codes(buyer_with_2fa)
    first_code = plain_codes[0]

    # First use — succeeds
    login_resp = login_response(client, buyer_with_2fa)
    token = login_resp.data["challenge_token"]
    resp1 = client.post(
        reverse("accounts:2fa-verify"),
        {"challenge_token": token, "code": first_code},
        format="json",
    )
    assert resp1.status_code == 200

    # Second login — new challenge
    login_resp2 = login_response(client, buyer_with_2fa)
    token2 = login_resp2.data["challenge_token"]
    resp2 = client.post(
        reverse("accounts:2fa-verify"),
        {"challenge_token": token2, "code": first_code},
        format="json",
    )
    assert resp2.status_code == 400


# ──────────────────────────────────────────────
# Disable 2FA
# ──────────────────────────────────────────────


@pytest.mark.django_db
def test_disable_2fa_with_valid_credentials(client, buyer_with_2fa):
    # Get access token via 2FA flow
    login_resp = login_response(client, buyer_with_2fa)
    token_2fa = login_resp.data["challenge_token"]
    code = pyotp.TOTP(buyer_with_2fa._totp_secret).now()
    verify_resp = client.post(
        reverse("accounts:2fa-verify"),
        {"challenge_token": token_2fa, "code": code},
        format="json",
    )
    access = verify_resp.data["tokens"]["access"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

    import pyotp as _pyotp
    current_code = _pyotp.TOTP(buyer_with_2fa._totp_secret).now()
    resp = client.post(
        reverse("accounts:2fa-disable"),
        {"password": "strongpass1!", "code": current_code},
        format="json",
    )
    assert resp.status_code == 200
    assert not TwoFactorDevice.objects.get(user=buyer_with_2fa).is_enabled
    assert not BackupCode.objects.filter(user=buyer_with_2fa).exists()


@pytest.mark.django_db
def test_disable_2fa_wrong_password_rejected(client, buyer_with_2fa):
    login_resp = login_response(client, buyer_with_2fa)
    token_2fa = login_resp.data["challenge_token"]
    code = pyotp.TOTP(buyer_with_2fa._totp_secret).now()
    verify_resp = client.post(
        reverse("accounts:2fa-verify"),
        {"challenge_token": token_2fa, "code": code},
        format="json",
    )
    access = verify_resp.data["tokens"]["access"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

    resp = client.post(
        reverse("accounts:2fa-disable"),
        {"password": "wrongpassword", "code": pyotp.TOTP(buyer_with_2fa._totp_secret).now()},
        format="json",
    )
    assert resp.status_code == 400


# ──────────────────────────────────────────────
# Admin enforcement
# ──────────────────────────────────────────────


@pytest.mark.django_db
def test_admin_without_2fa_blocked_from_admin_panel(client, admin_user):
    token = auth_header(client, admin_user)
    # auth_header returns None when 2FA is required; admin has no 2FA yet so
    # login returns tokens normally (no device exists)
    assert token is not None
    client.credentials(HTTP_AUTHORIZATION=token)

    # Try an admin endpoint — should be blocked by RequireTwoFactor permission
    url = reverse("adminpanel:dashboard")
    resp = client.get(url)
    assert resp.status_code == 403


@pytest.mark.django_db
def test_admin_with_2fa_can_access_admin_panel(client, admin_user):
    # Enable 2FA for admin
    secret = pyotp.random_base32()
    TwoFactorDevice.objects.create(
        user=admin_user,
        encrypted_secret=services._encrypt_totp_secret(secret),
        is_enabled=True,
    )

    login_resp = login_response(client, admin_user)
    token_2fa = login_resp.data["challenge_token"]
    code = pyotp.TOTP(secret).now()
    verify_resp = client.post(
        reverse("accounts:2fa-verify"),
        {"challenge_token": token_2fa, "code": code},
        format="json",
    )
    access = verify_resp.data["tokens"]["access"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

    url = reverse("adminpanel:dashboard")
    resp = client.get(url)
    assert resp.status_code == 200
