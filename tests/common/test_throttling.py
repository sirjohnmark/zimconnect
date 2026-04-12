"""
Tests for rate-limiting / throttle classes.

Use low rate values and fresh APIClient per test to trigger throttles.
"""

import pytest
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APIClient

from apps.common.throttling import LoginRateThrottle, RegisterRateThrottle

LOGIN_URL = "/api/v1/auth/login/"
REGISTER_URL = "/api/v1/auth/register/"


@pytest.fixture(autouse=True)
def _clear_throttle_cache():
    """Clear the default cache before each throttle test so rates reset."""
    cache.clear()
    yield
    cache.clear()


@pytest.mark.django_db
class TestLoginThrottle:
    def test_login_rate_limit(self, mocker):
        mocker.patch.object(LoginRateThrottle, "rate", "2/hour")
        mocker.patch.object(LoginRateThrottle, "THROTTLE_RATES", {"login": "2/hour"})
        client = APIClient()
        payload = {"email": "nobody@test.com", "password": "wrong"}

        for _ in range(2):
            resp = client.post(LOGIN_URL, payload, format="json")
            assert resp.status_code != status.HTTP_429_TOO_MANY_REQUESTS

        resp = client.post(LOGIN_URL, payload, format="json")
        assert resp.status_code == status.HTTP_429_TOO_MANY_REQUESTS


@pytest.mark.django_db
class TestRegisterThrottle:
    def test_register_rate_limit(self, mocker):
        mocker.patch.object(RegisterRateThrottle, "rate", "2/hour")
        mocker.patch.object(RegisterRateThrottle, "THROTTLE_RATES", {"register": "2/hour"})
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
