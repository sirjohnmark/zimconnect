"""
Custom throttle classes for sensitive endpoints.

Each class sets its own ``scope`` and ``rate`` so the corresponding
entry in ``DEFAULT_THROTTLE_RATES`` acts as config-level override.
"""

from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


# ── Anonymous (IP-based) throttles ────────────


class LoginRateThrottle(AnonRateThrottle):
    """10 login attempts per hour per IP."""

    scope = "login"
    rate = "10/hour"


class RegisterRateThrottle(AnonRateThrottle):
    """5 registration attempts per hour per IP."""

    scope = "register"
    rate = "5/hour"


class PasswordResetThrottle(AnonRateThrottle):
    """3 password-reset requests per hour per IP."""

    scope = "password_reset"
    rate = "3/hour"


# ── Authenticated (user-based) throttles ──────


class ListingCreateThrottle(UserRateThrottle):
    """20 listing creations per day per user."""

    scope = "listing_create"
    rate = "20/day"


class ImageUploadThrottle(UserRateThrottle):
    """30 image uploads per day per user."""

    scope = "image_upload"
    rate = "30/day"


class MessageSendThrottle(UserRateThrottle):
    """60 messages per hour per user."""

    scope = "message"
    rate = "60/hour"


class OTPSendThrottle(UserRateThrottle):
    """3 OTP send requests per hour per user."""

    scope = "otp_send"
    rate = "3/hour"


class OTPVerifyThrottle(UserRateThrottle):
    """10 OTP verify attempts per hour per user (prevent brute force)."""

    scope = "otp_verify"
    rate = "10/hour"


class EmailOTPSendThrottle(UserRateThrottle):
    """3 email OTP send requests per hour per user."""

    scope = "email_otp_send"
    rate = "3/hour"


class EmailOTPVerifyThrottle(UserRateThrottle):
    """10 email OTP verify attempts per hour per user."""

    scope = "email_otp_verify"
    rate = "10/hour"
