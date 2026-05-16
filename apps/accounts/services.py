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

    # Check 2FA
    from apps.accounts.models import TwoFactorDevice

    try:
        device = TwoFactorDevice.objects.get(user=user, is_enabled=True)
        if device.is_enabled:
            challenge_token = create_2fa_challenge(user)
            logger.info("user_authenticated_2fa_required email=%s user_id=%d", email, user.pk)
            return user, {"requires_2fa": True, "challenge_token": challenge_token}
    except TwoFactorDevice.DoesNotExist:
        pass

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


# ──────────────────────────────────────────────
# Two-Factor Authentication (TOTP)
# ──────────────────────────────────────────────

TOTP_CHALLENGE_TTL = 300           # 5 minutes
TOTP_CHALLENGE_MAX_ATTEMPTS = 5
TOTP_BACKUP_CODE_COUNT = 10


def _get_fernet():
    from cryptography.fernet import Fernet

    key = getattr(settings, "TOTP_ENCRYPTION_KEY", "")
    if not key:
        raise ServiceError("Two-factor authentication is not configured on this server.")
    return Fernet(key.encode() if isinstance(key, str) else key)


def _encrypt_totp_secret(secret: str) -> str:
    return _get_fernet().encrypt(secret.encode()).decode()


def _decrypt_totp_secret(encrypted: str) -> str:
    return _get_fernet().decrypt(encrypted.encode()).decode()


def _hash_backup_code(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


def _generate_backup_code() -> str:
    """Return a cryptographically secure 12-character hex recovery code."""
    return secrets.token_hex(6)


def _challenge_key(token: str) -> str:
    return f"2fa_challenge:{token}"


def _challenge_attempts_key(token: str) -> str:
    return f"2fa_attempts:{token}"


def _generate_qr_code_data_uri(uri: str) -> str:
    """Return a data:image/png;base64,... URI for the given otpauth URI."""
    import base64
    import io

    import qrcode

    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=8, border=4)
    qr.add_data(uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return "data:image/png;base64," + base64.b64encode(buf.read()).decode()


def get_2fa_status(user) -> dict:
    """Return whether 2FA is enabled and related metadata."""
    from apps.accounts.models import TwoFactorDevice

    try:
        device = TwoFactorDevice.objects.get(user=user)
        backup_remaining = user.backup_codes.filter(is_used=False).count()
        return {
            "is_enabled": device.is_enabled,
            "enabled_at": device.enabled_at,
            "backup_codes_remaining": backup_remaining if device.is_enabled else 0,
        }
    except TwoFactorDevice.DoesNotExist:
        return {"is_enabled": False, "enabled_at": None, "backup_codes_remaining": 0}


@transaction.atomic
def start_totp_setup(user) -> dict:
    """
    Begin TOTP setup for a user.

    Generates a new secret, stores it encrypted as `temp_encrypted_secret`,
    and returns the QR code data URI + manual key for display.
    The secret is NOT yet active — confirm_totp_setup() activates it.
    """
    import pyotp

    from apps.accounts.models import TwoFactorDevice

    secret = pyotp.random_base32()
    issuer = getattr(settings, "TOTP_ISSUER", "Sanganai")
    uri = pyotp.TOTP(secret).provisioning_uri(name=user.email, issuer_name=issuer)
    qr_code = _generate_qr_code_data_uri(uri)

    device, _ = TwoFactorDevice.objects.get_or_create(user=user)
    device.temp_encrypted_secret = _encrypt_totp_secret(secret)
    device.save(update_fields=["temp_encrypted_secret", "updated_at"])

    logger.info("totp_setup_started user_id=%d", user.pk)
    return {"secret": secret, "uri": uri, "qr_code": qr_code}


@transaction.atomic
def confirm_totp_setup(user, code: str) -> list[str]:
    """
    Verify the TOTP code from the user's authenticator app to complete setup.

    On success: enables 2FA, moves temp secret to active secret, generates
    and returns 10 plaintext backup codes (shown once, hashed before storage).
    Raises ServiceError if no setup was started or the code is invalid.
    """
    import pyotp

    from apps.accounts.models import BackupCode, TwoFactorDevice

    try:
        device = TwoFactorDevice.objects.select_for_update().get(user=user)
    except TwoFactorDevice.DoesNotExist:
        raise ServiceError("No 2FA setup in progress. Please start setup first.")

    if not device.temp_encrypted_secret:
        raise ServiceError("No 2FA setup in progress. Please start setup first.")

    secret = _decrypt_totp_secret(device.temp_encrypted_secret)
    totp = pyotp.TOTP(secret)

    if not totp.verify(code, valid_window=1):
        raise ServiceError("Invalid verification code. Please check your authenticator app and try again.")

    device.encrypted_secret = device.temp_encrypted_secret
    device.temp_encrypted_secret = ""
    device.is_enabled = True
    device.enabled_at = timezone.now()
    device.save(update_fields=["encrypted_secret", "temp_encrypted_secret", "is_enabled", "enabled_at", "updated_at"])

    plaintext_codes = _create_backup_codes(user)
    logger.info("totp_enabled user_id=%d", user.pk)
    return plaintext_codes


def _create_backup_codes(user) -> list[str]:
    """Delete existing backup codes for user and create fresh ones. Returns plaintext codes."""
    from apps.accounts.models import BackupCode

    user.backup_codes.all().delete()
    codes = [_generate_backup_code() for _ in range(TOTP_BACKUP_CODE_COUNT)]
    BackupCode.objects.bulk_create([
        BackupCode(user=user, code_hash=_hash_backup_code(c))
        for c in codes
    ])
    return codes


def verify_totp_code(user, code: str) -> bool:
    """
    Verify a TOTP code against the user's active secret.

    Returns True on success, raises ServiceError on failure.
    Does NOT handle challenge tokens — use verify_2fa_challenge() for login flow.
    """
    import pyotp

    from apps.accounts.models import TwoFactorDevice

    try:
        device = TwoFactorDevice.objects.get(user=user, is_enabled=True)
    except TwoFactorDevice.DoesNotExist:
        raise ServiceError("Two-factor authentication is not enabled on this account.")

    secret = _decrypt_totp_secret(device.encrypted_secret)
    if not pyotp.TOTP(secret).verify(code, valid_window=1):
        raise ServiceError("Invalid verification code.")
    return True


def _try_backup_code(user, code: str) -> bool:
    """
    Attempt to consume a backup code. Returns True on success, False if not found.
    Uses select_for_update to prevent double-use under concurrent requests.
    """
    from apps.accounts.models import BackupCode

    code_hash = _hash_backup_code(code.strip().lower())
    try:
        bc = BackupCode.objects.select_for_update().get(user=user, code_hash=code_hash, is_used=False)
    except BackupCode.DoesNotExist:
        return False
    bc.is_used = True
    bc.used_at = timezone.now()
    bc.save(update_fields=["is_used", "used_at"])
    logger.info("backup_code_used user_id=%d", user.pk)
    return True


def create_2fa_challenge(user) -> str:
    """
    Store a short-lived challenge token in Redis and return it.

    The token maps to user.pk with a TTL of TOTP_CHALLENGE_TTL seconds.
    """
    from django.core.cache import cache

    token = secrets.token_urlsafe(32)
    cache.set(_challenge_key(token), user.pk, TOTP_CHALLENGE_TTL)
    logger.info("2fa_challenge_created user_id=%d", user.pk)
    return token


@transaction.atomic
def verify_2fa_challenge(token: str, code: str) -> tuple:
    """
    Validate challenge_token + code (TOTP or backup).

    Returns (user, tokens_dict) on success.
    Raises ServiceError on invalid/expired token, wrong code, or too many attempts.
    """
    from django.core.cache import cache

    user_id = cache.get(_challenge_key(token))
    if user_id is None:
        logger.warning("2fa_challenge_missing token_prefix=%s", token[:8])
        raise ServiceError("This verification session has expired. Please log in again.")

    attempts_key = _challenge_attempts_key(token)
    attempts = cache.get(attempts_key, 0)

    if attempts >= TOTP_CHALLENGE_MAX_ATTEMPTS:
        cache.delete(_challenge_key(token))
        logger.warning("2fa_challenge_locked user_id=%s", user_id)
        raise ServiceError("Too many failed attempts. Please log in again.")

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        cache.delete(_challenge_key(token))
        raise ServiceError("Invalid verification session. Please log in again.")

    # Try TOTP code
    try:
        import pyotp
        from apps.accounts.models import TwoFactorDevice

        device = TwoFactorDevice.objects.get(user=user, is_enabled=True)
        secret = _decrypt_totp_secret(device.encrypted_secret)
        if pyotp.TOTP(secret).verify(code, valid_window=1):
            cache.delete(_challenge_key(token))
            cache.delete(attempts_key)
            tokens = _generate_tokens(user)
            logger.info("2fa_verified user_id=%d method=totp", user.pk)
            return user, tokens
    except Exception:  # noqa: BLE001
        pass

    # Try backup code
    if _try_backup_code(user, code):
        cache.delete(_challenge_key(token))
        cache.delete(attempts_key)
        tokens = _generate_tokens(user)
        return user, tokens

    # Both failed
    cache.set(attempts_key, attempts + 1, TOTP_CHALLENGE_TTL)
    remaining = TOTP_CHALLENGE_MAX_ATTEMPTS - (attempts + 1)
    logger.warning("2fa_failed user_id=%d attempts=%d", user.pk, attempts + 1)
    raise ServiceError(
        f"Invalid code. {remaining} attempt{'s' if remaining != 1 else ''} remaining."
        if remaining > 0
        else "Invalid code. No more attempts — please log in again."
    )


@transaction.atomic
def disable_totp(user, password: str, code: str) -> None:
    """
    Disable 2FA after verifying the user's password and a valid TOTP or backup code.
    """
    from apps.accounts.models import TwoFactorDevice

    if not user.check_password(password):
        raise ServiceError("Incorrect password.")

    try:
        device = TwoFactorDevice.objects.get(user=user, is_enabled=True)
    except TwoFactorDevice.DoesNotExist:
        raise ServiceError("Two-factor authentication is not enabled on this account.")

    import pyotp

    secret = _decrypt_totp_secret(device.encrypted_secret)
    code_valid = pyotp.TOTP(secret).verify(code, valid_window=1) or _try_backup_code(user, code)

    if not code_valid:
        raise ServiceError("Invalid verification code. Please enter a valid authenticator code or backup code.")

    device.is_enabled = False
    device.encrypted_secret = ""
    device.temp_encrypted_secret = ""
    device.enabled_at = None
    device.save(update_fields=["is_enabled", "encrypted_secret", "temp_encrypted_secret", "enabled_at", "updated_at"])
    user.backup_codes.all().delete()

    logger.info("totp_disabled user_id=%d", user.pk)


@transaction.atomic
def regenerate_backup_codes(user, password: str, code: str) -> list[str]:
    """
    Regenerate backup codes after verifying the user's password and a valid TOTP code.

    Returns the new plaintext codes (shown once).
    """
    from apps.accounts.models import TwoFactorDevice

    if not user.check_password(password):
        raise ServiceError("Incorrect password.")

    try:
        device = TwoFactorDevice.objects.get(user=user, is_enabled=True)
    except TwoFactorDevice.DoesNotExist:
        raise ServiceError("Two-factor authentication is not enabled on this account.")

    import pyotp

    secret = _decrypt_totp_secret(device.encrypted_secret)
    if not pyotp.TOTP(secret).verify(code, valid_window=1):
        raise ServiceError("Invalid authenticator code.")

    codes = _create_backup_codes(user)
    logger.info("backup_codes_regenerated user_id=%d", user.pk)
    return codes
