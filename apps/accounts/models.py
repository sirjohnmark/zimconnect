"""
Custom User model for TRADLINKAPI.

Uses email as the login identifier instead of username.
"""

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

from apps.common.constants import UserRole, ZimbabweCity
from apps.common.validators import ImageSizeValidator, ZimbabwePhoneValidator


class UserManager(BaseUserManager):
    """Manager for the custom User model — email-based authentication."""

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


class User(AbstractBaseUser, PermissionsMixin):
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

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        db_table = "users"
        ordering = ["-created_at"]
        verbose_name = "user"
        verbose_name_plural = "users"

    def __str__(self) -> str:
        return self.email
