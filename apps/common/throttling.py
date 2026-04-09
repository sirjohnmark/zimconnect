"""
Custom throttle classes for sensitive endpoints.
"""

from rest_framework.throttling import AnonRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """10 login attempts per hour per IP."""

    scope = "login"
    rate = "10/hour"


class RegisterRateThrottle(AnonRateThrottle):
    """5 registration attempts per hour per IP."""

    scope = "register"
    rate = "5/hour"


class MessageRateThrottle(AnonRateThrottle):
    """60 messages per hour per IP."""

    scope = "message"
    rate = "60/hour"
