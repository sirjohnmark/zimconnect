"""
Business-logic service layer for accounts.

All mutations go through here — views never touch the ORM directly.
"""

from __future__ import annotations

import hashlib
import logging
import secrets

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.common.exceptions import ServiceError, UnprocessableError
from apps.common.sanitizers import sanitize_plain

User = get_user_model()

logger = logging.getLogger(__name__)

OTP_EXPIRY_MINUTES = 10
EMAIL_OTP_EXPIRY_MINUTES = 30
OTP_RESEND_COOLDOWN_SECONDS = 60


@transaction.atomic
def create_user(
    email: str,
    username: str,
    password: str,
    role: str,
    **kwargs,
) -> User:
    """
    Create and return a new user with sanitised text fields.

    Raises ValueError (caught by DRF) on missing required fields.
    """
    email = email.lower().strip()
    username = sanitize_plain(username)

    optional_text_fields = ("first_name", "last_name", "bio")
    for field in optional_text_fields:
        if field in kwargs and kwargs[field]:
            kwargs[field] = sanitize_plain(kwargs[field])

    user = User.objects.create_user(
        email=email,
        username=username,
        password=password,
        role=role,
        **kwargs,
    )

    # Fire welcome email in the background
    from apps.accounts.tasks import send_welcome_email

    send_welcome_email.delay(user.pk)

    logger.info("user_registered email=%s role=%s user_id=%d", email, role, user.pk)
    return user


def authenticate_user(email: str, password: str) -> tuple[User, dict]:
    """
    Authenticate by email + password. Return (user, tokens_dict).

    Raises ServiceError on invalid credentials or inactive account.
    """
    email = email.lower().strip()

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        logger.warning("auth_failed email=%s reason=unknown_email", email)
        raise ServiceError("Invalid email or password.")

    if not user.check_password(password):
        logger.warning("auth_failed email=%s reason=bad_password user_id=%d", email, user.pk)
        raise ServiceError("Invalid email or password.")

    if not user.is_active:
        logger.warning("auth_failed email=%s reason=inactive user_id=%d", email, user.pk)
        raise ServiceError("This account has been deactivated.")

    tokens = _generate_tokens(user)
    logger.info("user_authenticated email=%s user_id=%d", email, user.pk)
    return user, tokens


def refresh_tokens(refresh_token: str) -> dict:
    """
    Rotate a refresh token and return a new pair.

    Raises ServiceError if the token is invalid or blacklisted.
    """
    try:
        token = RefreshToken(refresh_token)
    except TokenError:
        raise ServiceError("Invalid or expired refresh token.")

    return {
        "access": str(token.access_token),
        "refresh": str(token),
    }


def blacklist_token(refresh_token: str) -> None:
    """
    Blacklist a refresh token (logout).

    Silently succeeds if the token is already blacklisted.
    """
    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
    except TokenError:
        raise ServiceError("Invalid or expired refresh token.")


@transaction.atomic
def update_user_profile(user: User, **kwargs) -> User:
    """
    Update editable profile fields on *user* and return the refreshed instance.
    """
    text_fields = ("first_name", "last_name", "bio")
    for field in text_fields:
        if field in kwargs and kwargs[field]:
            kwargs[field] = sanitize_plain(kwargs[field])

    for field, value in kwargs.items():
        setattr(user, field, value)

    user.full_clean()
    user.save(update_fields=[*kwargs.keys(), "updated_at"])
    user.refresh_from_db()
    return user


# ──────────────────────────────────────────────
# Internal helpers
# ──────────────────────────────────────────────


def _generate_tokens(user: User) -> dict:
    """Issue a fresh JWT pair for *user*."""
    token = RefreshToken.for_user(user)
    return {
        "access": str(token.access_token),
        "refresh": str(token),
    }


def _hash_otp(otp: str) -> str:
    """Return SHA-256 hex digest of the OTP string."""
    return hashlib.sha256(otp.encode()).hexdigest()


# ──────────────────────────────────────────────
# OTP — phone verification
# ──────────────────────────────────────────────


def generate_otp() -> str:
    """Return a cryptographically secure random 6-digit string."""
    return f"{secrets.randbelow(1_000_000):06d}"


def _send_sms(phone: str, message: str) -> None:
    """
    Send an SMS via Africa's Talking.

    In dev/test: if AT_API_KEY is empty, logs the message to console instead.
    """
    api_key = getattr(settings, "AT_API_KEY", "")
    if not api_key:
        logger.warning("AT_API_KEY not set — logging OTP SMS instead of sending.")
        logger.info("SMS to %s: %s", phone, message)
        return

    import africastalking

    africastalking.initialize(
        username=settings.AT_USERNAME,
        api_key=api_key,
    )
    sms = africastalking.SMS

    sender = getattr(settings, "AT_SENDER_ID", "") or None
    sms.send(message, [phone], sender_id=sender)


@transaction.atomic
def send_phone_otp(user) -> None:
    """
    Generate OTP, store its SHA-256 hash on the user, set expiry, and send SMS.
    """
    if not user.phone:
        raise ServiceError("No phone number on file. Update your profile first.")

    otp = generate_otp()
    user.phone_otp = _hash_otp(otp)
    user.phone_otp_expires_at = timezone.now() + timezone.timedelta(minutes=OTP_EXPIRY_MINUTES)
    user.save(update_fields=["phone_otp", "phone_otp_expires_at", "updated_at"])

    message = f"Your Sanganai verification code is: {otp}. Valid for 10 minutes."
    _send_sms(user.phone, message)


def verify_phone_otp(user, otp_input: str) -> bool:
    """
    Verify the supplied OTP against the stored hash.

    On success: sets phone_verified=True, clears OTP fields.
    Raises UnprocessableError if expired, ServiceError if invalid.
    """
    if not user.phone_otp:
        raise ServiceError("No OTP has been requested. Send one first.")

    if user.phone_otp_expires_at and user.phone_otp_expires_at < timezone.now():
        user.phone_otp = ""
        user.phone_otp_expires_at = None
        user.save(update_fields=["phone_otp", "phone_otp_expires_at", "updated_at"])
        raise UnprocessableError("OTP has expired. Please request a new one.")

    if _hash_otp(otp_input) != user.phone_otp:
        raise ServiceError("Invalid OTP code.")

    user.phone_verified = True
    user.phone_otp = ""
    user.phone_otp_expires_at = None
    user.save(update_fields=["phone_verified", "phone_otp", "phone_otp_expires_at", "updated_at"])
    return True


def resend_otp(user) -> None:
    """
    Resend OTP with a 60-second cooldown to prevent spam.
    """
    if user.phone_otp_expires_at:
        cooldown_boundary = user.phone_otp_expires_at - timezone.timedelta(
            minutes=OTP_EXPIRY_MINUTES,
        ) + timezone.timedelta(seconds=OTP_RESEND_COOLDOWN_SECONDS)
        if timezone.now() < cooldown_boundary:
            raise ServiceError("Please wait 60 seconds before requesting a new OTP.")

    send_phone_otp(user)


# ──────────────────────────────────────────────
# OTP — email verification
# ──────────────────────────────────────────────


def _send_email(user, otp: str) -> None:
    """
    Send a verification email using Django's send_mail.

    In dev/test: if EMAIL_HOST is not configured, the console email backend
    handles the fallback (prints to stdout).
    """
    from django.core.mail import send_mail
    from django.template.loader import render_to_string

    context = {"username": user.username, "otp": otp, "expiry_minutes": EMAIL_OTP_EXPIRY_MINUTES}
    html_body = render_to_string("accounts/email/otp_verification.html", context)
    text_body = render_to_string("accounts/email/otp_verification.txt", context)

    send_mail(
        subject="Sanganai — Email Verification Code",
        message=text_body,
        from_email=None,  # uses DEFAULT_FROM_EMAIL
        recipient_list=[user.email],
        html_message=html_body,
        fail_silently=False,
    )


@transaction.atomic
def send_email_otp(user) -> None:
    """
    Generate OTP, store its SHA-256 hash on the user, set expiry, and send email.
    """
    otp = generate_otp()
    user.email_otp = _hash_otp(otp)
    user.email_otp_expires_at = timezone.now() + timezone.timedelta(minutes=EMAIL_OTP_EXPIRY_MINUTES)
    user.save(update_fields=["email_otp", "email_otp_expires_at", "updated_at"])

    _send_email(user, otp)


def verify_email_otp(user, otp_input: str) -> bool:
    """
    Verify the supplied OTP against the stored hash.

    On success: sets email_verified=True, clears OTP fields.
    Raises UnprocessableError if expired, ServiceError if invalid.
    """
    if not user.email_otp:
        raise ServiceError("No email OTP has been requested. Send one first.")

    if user.email_otp_expires_at and user.email_otp_expires_at < timezone.now():
        user.email_otp = ""
        user.email_otp_expires_at = None
        user.save(update_fields=["email_otp", "email_otp_expires_at", "updated_at"])
        raise UnprocessableError("OTP has expired. Please request a new one.")

    if _hash_otp(otp_input) != user.email_otp:
        raise ServiceError("Invalid OTP code.")

    user.email_verified = True
    user.email_otp = ""
    user.email_otp_expires_at = None
    user.save(update_fields=["email_verified", "email_otp", "email_otp_expires_at", "updated_at"])
    return True


def resend_email_otp(user) -> None:
    """
    Resend email OTP with a 60-second cooldown to prevent spam.
    """
    if user.email_otp_expires_at:
        cooldown_boundary = user.email_otp_expires_at - timezone.timedelta(
            minutes=EMAIL_OTP_EXPIRY_MINUTES,
        ) + timezone.timedelta(seconds=OTP_RESEND_COOLDOWN_SECONDS)
        if timezone.now() < cooldown_boundary:
            raise ServiceError("Please wait 60 seconds before requesting a new OTP.")

    send_email_otp(user)
