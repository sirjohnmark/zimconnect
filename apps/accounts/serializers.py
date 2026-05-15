"""
DRF serializers for the accounts app.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.common.constants import SellerUpgradeStatus
from apps.common.exceptions import ConflictError

from apps.accounts.models import SellerProfile
from apps.listings.serializers import ListingListSerializer

User = get_user_model()


class UserRegistrationSerializer(serializers.Serializer):
    """Validate registration input. Actual creation is in services.py."""

    email = serializers.EmailField(max_length=255)
    username = serializers.CharField(max_length=50, min_length=3)
    password = serializers.CharField(min_length=8, max_length=128, write_only=True)
    confirm_password = serializers.CharField(min_length=8, max_length=128, write_only=True)
    first_name = serializers.CharField(max_length=100, required=False, default="")
    last_name = serializers.CharField(max_length=100, required=False, default="")
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


# ──────────────────────────────────────────────
# Seller upgrade
# ──────────────────────────────────────────────


# ──────────────────────────────────────────────
# Seller profile
# ──────────────────────────────────────────────


class _SellerUserInlineSerializer(serializers.Serializer):
    """Minimal user info embedded in public seller profile responses."""

    username = serializers.CharField(read_only=True)
    profile_picture = serializers.ImageField(read_only=True)
    location = serializers.CharField(read_only=True)
    member_since = serializers.DateTimeField(source="created_at", read_only=True)


class SellerProfilePublicSerializer(serializers.ModelSerializer):
    """Public storefront view — includes user info and active listing count."""

    user = _SellerUserInlineSerializer(read_only=True)
    active_listings_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = SellerProfile
        fields = (
            "id",
            "user",
            "shop_name",
            "shop_description",
            "response_time_hours",
            "active_listings_count",
            "created_at",
        )
        read_only_fields = fields


class SellerProfileMeSerializer(serializers.ModelSerializer):
    """Full seller profile for the authenticated seller's own view."""

    user = _SellerUserInlineSerializer(read_only=True)
    active_listings_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = SellerProfile
        fields = (
            "id",
            "user",
            "shop_name",
            "shop_description",
            "response_time_hours",
            "active_listings_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class SellerProfileUpdateSerializer(serializers.ModelSerializer):
    """Fields the seller can update on their own profile."""

    class Meta:
        model = SellerProfile
        fields = ("shop_name", "shop_description", "response_time_hours")

    def validate_shop_name(self, value: str) -> str:
        if value:
            value = value.strip()
            if len(value) < 2:
                raise serializers.ValidationError("Shop name must be at least 2 characters.")
        return value

    def validate_response_time_hours(self, value: int | None) -> int | None:
        if value is not None and value < 1:
            raise serializers.ValidationError("Response time must be at least 1 hour.")
        return value


class SellerUpgradeRequestSerializer(serializers.Serializer):
    """Input for a buyer submitting a seller upgrade request."""

    business_name = serializers.CharField(min_length=2, max_length=150)
    business_description = serializers.CharField(
        max_length=1000,
        required=False,
        allow_blank=True,
        default="",
    )


class SellerUpgradeStatusSerializer(serializers.Serializer):
    """Read-only representation of a user's upgrade request status."""

    id = serializers.IntegerField(read_only=True)
    status = serializers.ChoiceField(choices=SellerUpgradeStatus.choices, read_only=True)
    business_name = serializers.CharField(read_only=True)
    business_description = serializers.CharField(read_only=True)
    rejection_reason = serializers.CharField(read_only=True)
    requested_at = serializers.DateTimeField(read_only=True)
    reviewed_at = serializers.DateTimeField(read_only=True, allow_null=True)


class BuyerDashboardSerializer(serializers.Serializer):
    """Dashboard summary for authenticated buyer accounts."""

    user = UserProfileSerializer(read_only=True)
    default_dashboard = serializers.CharField(read_only=True)
    can_apply_to_sell = serializers.BooleanField(read_only=True)
    seller_application = SellerUpgradeStatusSerializer(read_only=True, allow_null=True)
    saved_listings_count = serializers.IntegerField(read_only=True)
    conversations_count = serializers.IntegerField(read_only=True)


class SellerListingStatsSerializer(serializers.Serializer):
    """Counts for the authenticated seller's own listings."""

    total = serializers.IntegerField(read_only=True)
    draft = serializers.IntegerField(read_only=True)
    active = serializers.IntegerField(read_only=True)
    sold = serializers.IntegerField(read_only=True)
    rejected = serializers.IntegerField(read_only=True)


class SellerDashboardSerializer(serializers.Serializer):
    """Dashboard summary for approved seller accounts."""

    user = UserProfileSerializer(read_only=True)
    seller_profile = SellerProfileMeSerializer(read_only=True)
    listing_stats = SellerListingStatsSerializer(read_only=True)
    recent_listings = ListingListSerializer(many=True, read_only=True)
