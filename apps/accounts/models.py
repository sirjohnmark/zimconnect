"""
Custom User model for TRADLINKAPI.

Uses email as the login identifier instead of username.
"""

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

from apps.common.constants import SellerUpgradeStatus, UserRole, ZimbabweCity
from apps.common.models import AllObjectsManager, SoftDeleteModel, SoftDeleteQuerySet
from apps.common.validators import ImageSizeValidator, ZimbabwePhoneValidator


class UserManager(BaseUserManager):
    """Manager for the custom User model — email-based authentication."""

    def get_queryset(self) -> SoftDeleteQuerySet:
        return SoftDeleteQuerySet(self.model, using=self._db).filter(is_deleted=False)

    def create_user(self, email: str, username: str, password: str | None = None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address.")
        if not username:
            raise ValueError("Users must have a username.")

        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, username: str, password: str | None = None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("role", UserRole.ADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, username, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, SoftDeleteModel):
    """
    Custom user model — email is the unique identifier for authentication.

    Extends AbstractBaseUser + PermissionsMixin for full Django auth compat.
    """

    email = models.EmailField(
        max_length=255,
        unique=True,
        db_index=True,
        error_messages={"unique": "A user with this email already exists."},
    )
    username = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        error_messages={"unique": "A user with this username already exists."},
    )
    first_name = models.CharField(max_length=100, blank=True, default="")
    last_name = models.CharField(max_length=100, blank=True, default="")
    phone = models.CharField(
        max_length=15,
        blank=True,
        default="",
        validators=[ZimbabwePhoneValidator()],
    )
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.BUYER,
        db_index=True,
    )
    profile_picture = models.ImageField(
        upload_to="profile_pictures/%Y/%m/",
        blank=True,
        default="",
        validators=[ImageSizeValidator(max_mb=5)],
    )
    bio = models.TextField(max_length=500, blank=True, default="")
    location = models.CharField(
        max_length=30,
        choices=ZimbabweCity.choices,
        blank=True,
        default="",
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    # Phone OTP verification
    phone_verified = models.BooleanField(default=False)
    phone_otp = models.CharField(max_length=128, blank=True, default="")
    phone_otp_expires_at = models.DateTimeField(null=True, blank=True)

    # Email OTP verification
    email_verified = models.BooleanField(default=False)
    email_otp = models.CharField(max_length=128, blank=True, default="")
    email_otp_expires_at = models.DateTimeField(null=True, blank=True)

    # Password reset
    password_reset_token = models.CharField(max_length=128, blank=True, default="")
    password_reset_expires_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()
    all_objects = AllObjectsManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        db_table = "users"
        ordering = ["-created_at"]
        verbose_name = "user"
        verbose_name_plural = "users"

    def __str__(self) -> str:
        return self.email


class SellerUpgradeRequest(models.Model):
    """
    Tracks a buyer's request to be upgraded to SELLER role.

    Only one PENDING request per user is allowed at a time (enforced in the
    service layer). Past APPROVED or REJECTED requests are retained for audit.
    """

    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="seller_upgrade_requests",
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=SellerUpgradeStatus.choices,
        default=SellerUpgradeStatus.PENDING,
        db_index=True,
    )
    business_name = models.CharField(max_length=150)
    business_description = models.TextField(max_length=1000, blank=True, default="")
    rejection_reason = models.TextField(max_length=1000, blank=True, default="")
    requested_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="seller_requests_reviewed",
    )

    class Meta:
        db_table = "seller_upgrade_requests"
        ordering = ["-requested_at"]
        verbose_name = "seller upgrade request"
        verbose_name_plural = "seller upgrade requests"
        indexes = [
            models.Index(fields=["user", "status"], name="sur_user_status_idx"),
        ]

    def __str__(self) -> str:
        return f"SellerUpgradeRequest(user={self.user_id}, status={self.status})"


class SellerProfile(models.Model):
    """
    Extended public profile for a SELLER user.

    Auto-created when an admin approves a SellerUpgradeRequest.
    One profile per seller — OneToOneField enforces this at the DB level.
    """

    user = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="seller_profile",
        db_index=True,
    )
    shop_name = models.CharField(max_length=150)
    shop_description = models.TextField(max_length=2000, blank=True, default="")
    response_time_hours = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="Typical response time in hours. Set by the seller.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "seller_profiles"
        verbose_name = "seller profile"
        verbose_name_plural = "seller profiles"

    def __str__(self) -> str:
        return f"SellerProfile({self.shop_name})"
