"""
DRF serializers for the accounts app.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.common.constants import UserRole

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
    phone = serializers.CharField(max_length=15, required=False, default="")

    def validate_email(self, value: str) -> str:
        email = value.lower().strip()
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return email

    def validate_username(self, value: str) -> str:
        username = value.strip()
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError("A user with this username already exists.")
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
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


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
