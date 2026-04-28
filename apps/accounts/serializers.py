"""
DRF serializers for the accounts app.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.common.constants import UserRole
from apps.common.exceptions import ConflictError

User = get_user_model()


class UserRegistrationSerializer(serializers.Serializer):
    """Validate registration input. Actual creation is in services.py."""

    email = serializers.EmailField(max_length=255)
    username = serializers.CharField(max_length=50, min_length=3)
    password = serializers.CharField(min_length=8, max_length=128, write_only=True)
    confirm_password = serializers.CharField(min_length=8, max_length=128, write_only=True)
    first_name = serializers.CharField(max_length=100, required=False, default="")
    last_name = serializers.CharField(max_length=100, required=False, default="")
    role = serializers.ChoiceField(
        choices=[UserRole.BUYER, UserRole.SELLER],
        default=UserRole.BUYER,
    )
    phone = serializers.CharField(max_length=15)

    def validate_email(self, value: str) -> str:
        email = value.lower().strip()
        if User.objects.filter(email=email).exists():
            raise ConflictError("An account with this email already exists.")
        return email

    def validate_username(self, value: str) -> str:
        username = value.strip()
        if User.objects.filter(username=username).exists():
            raise ConflictError("A user with this username already exists.")
        return username

    def validate(self, attrs: dict) -> dict:
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )
        attrs.pop("confirm_password")
        return attrs


class UserLoginSerializer(serializers.Serializer):
    """Validate login credentials."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class UserProfileSerializer(serializers.ModelSerializer):
    """Read-only representation of a user profile."""

    is_verified = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "phone",
            "role",
            "profile_picture",
            "bio",
            "location",
            "phone_verified",
            "email_verified",
            "is_verified",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_is_verified(self, obj) -> bool:
        """True if at least one verification channel (email or phone) is confirmed."""
        return obj.email_verified or obj.phone_verified


class UserUpdateSerializer(serializers.ModelSerializer):
    """Editable fields for profile updates."""

    class Meta:
        model = User
        fields = (
            "first_name",
            "last_name",
            "phone",
            "bio",
            "location",
            "profile_picture",
        )

    def validate_phone(self, value: str) -> str:
        if value:
            from apps.common.validators import ZimbabwePhoneValidator

            ZimbabwePhoneValidator()(value)
        return value


class TokenResponseSerializer(serializers.Serializer):
    """Schema for JWT token pairs returned on login/refresh."""

    access = serializers.CharField()
    refresh = serializers.CharField()


class LoginResponseSerializer(serializers.Serializer):
    """Combined response for login endpoint."""

    tokens = TokenResponseSerializer()
    user = UserProfileSerializer()


class LogoutRequestSerializer(serializers.Serializer):
    """Request body for logout and token refresh."""

    refresh = serializers.CharField(help_text="The refresh token to blacklist or rotate.")


class MessageResponseSerializer(serializers.Serializer):
    """Generic message response."""

    message = serializers.CharField()


class OTPVerifySerializer(serializers.Serializer):
    """Validate OTP input for phone or email verification."""

    otp = serializers.RegexField(
        regex=r"^\d{6}$",
        help_text="6-digit verification code sent via SMS or email.",
    )


class ForgotPasswordSerializer(serializers.Serializer):
    """Request body for initiating a password reset."""

    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    """Request body for confirming a password reset."""

    token = serializers.CharField(
        min_length=10,
        max_length=200,
        help_text="Reset token received via email.",
    )
    new_password = serializers.CharField(min_length=8, max_length=128, write_only=True)
    confirm_password = serializers.CharField(min_length=8, max_length=128, write_only=True)

    def validate(self, attrs: dict) -> dict:
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        attrs.pop("confirm_password")
        return attrs
