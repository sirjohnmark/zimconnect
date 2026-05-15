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
from django.db import models, transaction
from django.utils import timezone
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.common.constants import SellerUpgradeStatus, UserRole
from apps.common.exceptions import ConflictError, NotFoundError, PermissionDeniedError, ServiceError, UnprocessableError
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
    role: str = UserRole.BUYER,
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
        role=UserRole.BUYER,
        **kwargs,
    )

    logger.info("user_registered email=%s role=%s user_id=%d", email, user.role, user.pk)
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


# ──────────────────────────────────────────────
# Password reset
# ──────────────────────────────────────────────

PASSWORD_RESET_EXPIRY_MINUTES = 60


def _generate_reset_token() -> str:
    """Return a cryptographically secure URL-safe token (43 chars)."""
    return secrets.token_urlsafe(32)


@transaction.atomic
def initiate_password_reset(email: str) -> None:
    """
    Generate a reset token, store its SHA-256 hash, and email the raw token.

    Always returns silently regardless of whether the email is registered
    to prevent email-enumeration attacks.
    """
    email = email.lower().strip()

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        logger.info("password_reset_requested: unknown email=%s", email)
        return

    if not user.is_active:
        logger.info("password_reset_requested: inactive user email=%s", email)
        return

    token = _generate_reset_token()
    user.password_reset_token = _hash_otp(token)
    user.password_reset_expires_at = timezone.now() + timezone.timedelta(minutes=PASSWORD_RESET_EXPIRY_MINUTES)
    user.save(update_fields=["password_reset_token", "password_reset_expires_at", "updated_at"])

    from apps.accounts.tasks import send_password_reset_email

    try:
        send_password_reset_email.delay(user.pk, token)
    except Exception:
        logger.exception("initiate_password_reset: failed to queue email for user %d", user.pk)

    logger.info("password_reset_initiated: email=%s user_id=%d", email, user.pk)


# ──────────────────────────────────────────────
# Seller upgrade requests
# ──────────────────────────────────────────────


@transaction.atomic
def create_seller_upgrade_request(user, business_name: str, business_description: str):
    """
    Submit a seller upgrade request for a BUYER.

    - Only BUYER accounts may apply.
    - Only one PENDING request is allowed at a time.
    - Returns the created SellerUpgradeRequest instance.
    """
    from apps.accounts.models import SellerUpgradeRequest

    if getattr(user, "role", None) != UserRole.BUYER:
        raise PermissionDeniedError("Only buyers can request a seller upgrade.")

    if not (user.email_verified or user.phone_verified):
        raise ServiceError("Please verify your email or phone number before applying to become a seller.")

    if SellerUpgradeRequest.objects.filter(user=user, status=SellerUpgradeStatus.PENDING).exists():
        raise ConflictError("You already have a pending seller upgrade request.")

    upgrade_request = SellerUpgradeRequest.objects.create(
        user=user,
        status=SellerUpgradeStatus.PENDING,
        business_name=sanitize_plain(business_name),
        business_description=sanitize_plain(business_description) if business_description else "",
    )
    logger.info("seller_upgrade_requested user_id=%d request_id=%d", user.pk, upgrade_request.pk)
    return upgrade_request


def get_seller_profile_by_username(username: str):
    """
    Return a SellerProfile for the given username, annotated with active_listings_count.

    Raises NotFoundError if the user or their profile is not found.
    """
    from django.db.models import Count

    from apps.accounts.models import SellerProfile
    from apps.common.constants import ListingStatus

    try:
        return (
            SellerProfile.objects
            .select_related("user")
            .annotate(
                active_listings_count=Count(
                    "user__listings",
                    filter=models.Q(user__listings__status=ListingStatus.ACTIVE),
                )
            )
            .get(user__username=username)
        )
    except SellerProfile.DoesNotExist:
        raise NotFoundError(f"Seller '{username}' not found.")


def get_seller_profile_for_user(user):
    """
    Return the SellerProfile for the authenticated seller, annotated with active_listings_count.

    Raises NotFoundError if the profile does not exist (e.g., pending approval).
    """
    from django.db.models import Count

    from apps.accounts.models import SellerProfile
    from apps.common.constants import ListingStatus

    try:
        return (
            SellerProfile.objects
            .select_related("user")
            .annotate(
                active_listings_count=Count(
                    "user__listings",
                    filter=models.Q(user__listings__status=ListingStatus.ACTIVE),
                )
            )
            .get(user=user)
        )
    except SellerProfile.DoesNotExist:
        raise NotFoundError("Seller profile not found.")


@transaction.atomic
def update_seller_profile(user, **kwargs):
    """
    Update editable fields on the seller's own SellerProfile.

    Sanitizes text fields and returns the refreshed, annotated instance.
    Raises NotFoundError if the seller profile does not exist.
    """
    from apps.accounts.models import SellerProfile

    try:
        profile = SellerProfile.objects.get(user=user)
    except SellerProfile.DoesNotExist:
        raise NotFoundError("Seller profile not found.")

    text_fields = ("shop_name", "shop_description")
    for field in text_fields:
        if field in kwargs and kwargs[field]:
            kwargs[field] = sanitize_plain(kwargs[field])

    for field, value in kwargs.items():
        setattr(profile, field, value)

    profile.full_clean()
    profile.save(update_fields=[*kwargs.keys(), "updated_at"])

    return get_seller_profile_for_user(user)


def get_latest_seller_upgrade_request(user):
    """
    Return the user's most recent seller upgrade request, or None.
    """
    from apps.accounts.models import SellerUpgradeRequest

    return (
        SellerUpgradeRequest.objects
        .filter(user=user)
        .order_by("-requested_at")
        .first()
    )


@transaction.atomic
def confirm_password_reset(token: str, new_password: str) -> None:
    """
    Validate the reset token and update the user's password.

    Raises ServiceError on invalid token, UnprocessableError on expiry.
    """
    token_hash = _hash_otp(token)

    try:
        user = User.objects.get(password_reset_token=token_hash)
    except User.DoesNotExist:
        raise ServiceError("Invalid or expired password reset token.")

    if user.password_reset_expires_at and user.password_reset_expires_at < timezone.now():
        user.password_reset_token = ""
        user.password_reset_expires_at = None
        user.save(update_fields=["password_reset_token", "password_reset_expires_at", "updated_at"])
        raise UnprocessableError("Password reset token has expired. Please request a new one.")

    user.set_password(new_password)
    user.password_reset_token = ""
    user.password_reset_expires_at = None
    user.save(update_fields=["password", "password_reset_token", "password_reset_expires_at", "updated_at"])

    logger.info("password_reset_confirmed: user_id=%d", user.pk)
