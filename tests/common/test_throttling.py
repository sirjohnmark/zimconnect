"""
Tests for rate-limiting / throttle classes.

Override throttle rates to very small values so we can trigger them
within a single test without hundreds of requests.
"""

import pytest
from rest_framework import status
from rest_framework.test import APIClient

LOGIN_URL = "/api/auth/login/"
REGISTER_URL = "/api/auth/register/"


@pytest.fixture(autouse=True)
def _tight_throttle_rates(settings):
    """Override DRF throttle rates for the entire module."""
    settings.REST_FRAMEWORK = {
        **getattr(settings, "REST_FRAMEWORK", {}),
        "DEFAULT_THROTTLE_RATES": {
            "anon": "100/hour",
            "user": "100/hour",
            "login": "2/hour",
            "register": "2/hour",
            "listing_create": "100/day",
            "image_upload": "100/day",
            "message": "100/hour",
            "password_reset": "100/hour",
            "otp_send": "100/hour",
            "otp_verify": "100/hour",
            "email_otp_send": "100/hour",
            "email_otp_verify": "100/hour",
        },
    }


@pytest.mark.django_db
class TestLoginThrottle:
    def test_login_rate_limit(self):
        client = APIClient()
        payload = {"email": "nobody@test.com", "password": "wrong"}
        # First 2 requests should go through (may be 401)
        for _ in range(2):
            resp = client.post(LOGIN_URL, payload, format="json")
            assert resp.status_code != status.HTTP_429_TOO_MANY_REQUESTS

        # Third request should be throttled
        resp = client.post(LOGIN_URL, payload, format="json")
        assert resp.status_code == status.HTTP_429_TOO_MANY_REQUESTS


@pytest.mark.django_db
class TestRegisterThrottle:
    def test_register_rate_limit(self):
        client = APIClient()
        for i in range(2):
            resp = client.post(
                REGISTER_URL,
                {
                    "email": f"throttle{i}@test.com",
                    "username": f"throttle{i}",
                    "password": "StrongP@ss1!",
                    "password_confirm": "StrongP@ss1!",
                    "first_name": "T",
                    "last_name": "U",
                    "phone": f"+263771200{i:03d}",
                },
                format="json",
            )
            assert resp.status_code != status.HTTP_429_TOO_MANY_REQUESTS

        resp = client.post(
            REGISTER_URL,
            {
                "email": "throttle99@test.com",
                "username": "throttle99",
                "password": "StrongP@ss1!",
                "password_confirm": "StrongP@ss1!",
                "first_name": "T",
                "last_name": "U",
                "phone": "+2637712999999",
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_429_TOO_MANY_REQUESTS
