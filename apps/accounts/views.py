import logging

from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts import services
from apps.accounts.serializers import (
    BuyerDashboardSerializer,
    ForgotPasswordSerializer,
    LoginResponseSerializer,
    LogoutRequestSerializer,
    MessageResponseSerializer,
    OTPVerifySerializer,
    ResetPasswordSerializer,
    SellerUpgradeRequestSerializer,
    SellerUpgradeStatusSerializer,
    TokenResponseSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    UserRegistrationSerializer,
    UserUpdateSerializer,
)
from apps.accounts.tasks import send_otp_task, send_welcome_email
from apps.common.permissions import IsBuyer
from apps.common.throttling import (
    EmailOTPSendThrottle,
    EmailOTPVerifyThrottle,
    LoginRateThrottle,
    OTPSendThrottle,
    OTPVerifyThrottle,
    PasswordResetThrottle,
    RegisterRateThrottle,
    SellerUpgradeThrottle,
)

logger = logging.getLogger(__name__)


class RegisterView(APIView):
    """POST /api/v1/auth/register â€” create a new user account."""

    permission_classes = (AllowAny,)
    throttle_classes = (RegisterRateThrottle,)

    @extend_schema(
        tags=["Auth"],
        operation_id="auth_register",
        summary="Register a new user",
        description=(
            "Create a new account. All public registrations are created as BUYER "
            "accounts; users apply separately before they can sell."
        ),
        request=UserRegistrationSerializer,
        responses={
            201: OpenApiResponse(response=UserProfileSerializer, description="User created"),
            400: OpenApiResponse(description="Validation error (missing fields, password mismatch)"),
            409: OpenApiResponse(description="Email or username already in use"),
            429: OpenApiResponse(description="Rate limit exceeded"),
        },
    )
    def post(self, request: Request) -> Response:
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = services.create_user(
            email=data["email"],
            username=data["username"],
            password=data["password"],
            first_name=data.get("first_name", ""),
            last_name=data.get("last_name", ""),
            phone=data["phone"],
        )

        try:
            send_welcome_email.delay(user.pk)
            if user.phone:
                send_otp_task.delay(user.pk)
            # Email OTP is NOT sent here — the verify-email page calls
            # POST /auth/email/send-otp/ (trigger=1) after login, making it
            # the single source of truth. Sending here caused a double-OTP
            # race: registration code A → verify-email overwrites with code B
            # → user enters A → "Incorrect code" even though code is correct.
        except Exception:
            logger.exception("post-registration tasks failed for user %d", user.pk)

        profile = UserProfileSerializer(user).data
        return Response(profile, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """POST /api/v1/auth/login â€” authenticate and return JWT pair + profile."""

    permission_classes = (AllowAny,)
    throttle_classes = (LoginRateThrottle,)

    @extend_schema(
        tags=["Auth"],
        operation_id="auth_login",
        summary="Login",
        description="Authenticate with email + password. Returns JWT pair and user profile. Rate-limited to 10 requests/hour.",
        request=UserLoginSerializer,
        responses={
            200: OpenApiResponse(response=LoginResponseSerializer, description="JWT tokens + user profile"),
            401: OpenApiResponse(description="Invalid credentials"),
            429: OpenApiResponse(description="Rate limit exceeded"),
        },
    )
    def post(self, request: Request) -> Response:
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user, tokens = services.authenticate_user(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )

        return Response(
            {
                "tokens": TokenResponseSerializer(tokens).data,
                "user": UserProfileSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """POST /api/v1/auth/logout â€” blacklist the refresh token."""

    permission_classes = (IsAuthenticated,)

    @extend_schema(
        tags=["Auth"],
        operation_id="auth_logout",
        summary="Logout",
        description="Blacklist the given refresh token. Requires authentication.",
        request=LogoutRequestSerializer,
        responses={
            200: OpenApiResponse(response=MessageResponseSerializer, description="Successfully logged out"),
            400: OpenApiResponse(description="Missing refresh token"),
            401: OpenApiResponse(description="Not authenticated"),
        },
    )
    def post(self, request: Request) -> Response:
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"error": {"code": "missing_token", "message": "Refresh token is required.", "details": {}}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        services.blacklist_token(refresh_token)
        return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)


class TokenRefreshView(APIView):
    """POST /api/v1/auth/token/refresh â€” rotate refresh token."""

    permission_classes = (AllowAny,)

    @extend_schema(
        tags=["Auth"],
        operation_id="auth_token_refresh",
        summary="Refresh JWT tokens",
        description="Rotate a refresh token and receive a new access + refresh pair.",
        request=LogoutRequestSerializer,
        responses={
            200: OpenApiResponse(response=TokenResponseSerializer, description="New token pair"),
            400: OpenApiResponse(description="Missing or invalid refresh token"),
        },
    )
    def post(self, request: Request) -> Response:
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"error": {"code": "missing_token", "message": "Refresh token is required.", "details": {}}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tokens = services.refresh_tokens(refresh_token)
        return Response(TokenResponseSerializer(tokens).data, status=status.HTTP_200_OK)


class UserProfileView(APIView):
    """GET/PATCH /api/v1/auth/profile â€” read or update your own profile."""

    permission_classes = (IsAuthenticated,)

    @extend_schema(
        tags=["Auth"],
        operation_id="auth_profile_read",
        summary="Get my profile",
        description="Return the authenticated user's profile.",
        responses={
            200: OpenApiResponse(response=UserProfileSerializer, description="User profile"),
            401: OpenApiResponse(description="Not authenticated"),
        },
    )
    def get(self, request: Request) -> Response:
        return Response(UserProfileSerializer(request.user).data, status=status.HTTP_200_OK)

    @extend_schema(
        tags=["Auth"],
        operation_id="auth_profile_update",
        summary="Update my profile",
        description="Partially update the authenticated user's profile fields.",
        request=UserUpdateSerializer,
        responses={
            200: OpenApiResponse(response=UserProfileSerializer, description="Updated profile"),
            400: OpenApiResponse(description="Validation error"),
            401: OpenApiResponse(description="Not authenticated"),
        },
    )
    def patch(self, request: Request) -> Response:
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        user = services.update_user_profile(request.user, **serializer.validated_data)
        return Response(UserProfileSerializer(user).data, status=status.HTTP_200_OK)


class BuyerDashboardView(APIView):
    """GET /api/v1/auth/buyer-dashboard/ — dashboard summary for buyer mode."""

    permission_classes = (IsAuthenticated,)

    @extend_schema(
        tags=["Auth"],
        operation_id="auth_buyer_dashboard",
        summary="Buyer dashboard",
        description=(
            "Return the authenticated user's buyer dashboard summary. "
            "Every account can use buyer mode; SELLER users keep buyer capabilities."
        ),
        responses={
            200: OpenApiResponse(response=BuyerDashboardSerializer, description="Buyer dashboard summary"),
            401: OpenApiResponse(description="Not authenticated"),
        },
    )
    def get(self, request: Request) -> Response:
        from apps.common.constants import SellerUpgradeStatus, UserRole
        from apps.inbox.models import Conversation
        from apps.listings.models import SavedListing

        latest_request = services.get_latest_seller_upgrade_request(request.user)
        data = {
            "user": request.user,
            "default_dashboard": "seller" if request.user.role == UserRole.SELLER else "buyer",
            "can_apply_to_sell": (
                request.user.role == UserRole.BUYER
                and (
                    latest_request is None
                    or latest_request.status == SellerUpgradeStatus.REJECTED
                )
            ),
            "seller_application": latest_request,
            "saved_listings_count": SavedListing.objects.filter(buyer=request.user).count(),
            "conversations_count": Conversation.objects.filter(participants=request.user).count(),
        }
        return Response(BuyerDashboardSerializer(data).data, status=status.HTTP_200_OK)


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Phone OTP verification
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

_OTP_FLOW_DESCRIPTION = (
    "### OTP verification flow\n\n"
    "1. **POST /api/v1/auth/phone/send-otp/** â€” sends a 6-digit code via SMS\n"
    "2. **POST /api/v1/auth/phone/verify/** â€” submit the code to verify\n"
    "3. **POST /api/v1/auth/phone/resend/** â€” resend (60 s cooldown)\n\n"
    "OTPs expire after 10 minutes. Stored as SHA-256 hashes â€” never in plaintext."
)


class SendOTPView(APIView):
    """POST /api/v1/auth/phone/send-otp â€” send OTP to user's phone."""

    permission_classes = (IsAuthenticated,)
    throttle_classes = (OTPSendThrottle,)

    @extend_schema(
        tags=["Auth"],
        operation_id="auth_phone_send_otp",
        summary="Send phone OTP",
        description=f"Send a 6-digit OTP via SMS to the authenticated user's phone number. "
        f"Rate-limited to 3 requests/hour.\n\n{_OTP_FLOW_DESCRIPTION}",
        request=None,
        responses={
            200: OpenApiResponse(response=MessageResponseSerializer, description="OTP sent"),
            400: OpenApiResponse(description="No phone number on file"),
            401: OpenApiResponse(description="Not authenticated"),
            429: OpenApiResponse(description="Rate limit exceeded"),
        },
    )
    def post(self, request: Request) -> Response:
        services.send_phone_otp(request.user)
        return Response(
            {"message": "Verification code sent to your phone."},
            status=status.HTTP_200_OK,
        )


class VerifyOTPView(APIView):
    """POST /api/v1/auth/phone/verify â€” verify the OTP code."""

    permission_classes = (IsAuthenticated,)
    throttle_classes = (OTPVerifyThrottle,)

    @extend_schema(
        tags=["Auth"],
        operation_id="auth_phone_verify",
        summary="Verify phone OTP",
        description="Submit the 6-digit code received via SMS. On success, `phone_verified` becomes `true`. "
        "Rate-limited to 10 attempts/hour to prevent brute force.",
        request=OTPVerifySerializer,
        responses={
            200: OpenApiResponse(response=UserProfileSerializer, description="Phone verified â€” updated profile"),
            400: OpenApiResponse(description="Invalid OTP code"),
            401: OpenApiResponse(description="Not authenticated"),
            422: OpenApiResponse(description="OTP expired"),
            429: OpenApiResponse(description="Rate limit exceeded"),
        },
    )
    def post(self, request: Request) -> Response:
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        services.verify_phone_otp(request.user, serializer.validated_data["otp"])
        request.user.refresh_from_db()
        return Response(
            UserProfileSerializer(request.user).data,
            status=status.HTTP_200_OK,
        )


class ResendOTPView(APIView):
    """POST /api/v1/auth/phone/resend â€” resend OTP (60 s cooldown)."""

    permission_classes = (IsAuthenticated,)
    throttle_classes = (OTPSendThrottle,)

    @extend_schema(
        tags=["Auth"],
        operation_id="auth_phone_resend",
        summary="Resend phone OTP",
        description="Resend the OTP code. Enforces a 60-second cooldown between sends. "
        "Rate-limited to 3 requests/hour.",
        request=None,
        responses={
            200: OpenApiResponse(response=MessageResponseSerializer, description="OTP resent"),
            400: OpenApiResponse(description="Cooldown not elapsed or no phone on file"),
            401: OpenApiResponse(description="Not authenticated"),
            429: OpenApiResponse(description="Rate limit exceeded"),
        },
    )
    def post(self, request: Request) -> Response:
        services.resend_otp(request.user)
        return Response(
            {"message": "Verification code resent to your phone."},
            status=status.HTTP_200_OK,
        )


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Email OTP verification
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

_EMAIL_OTP_FLOW_DESCRIPTION = (
    "### Dual-verification flow\n\n"
    "Users can verify via **phone** (SMS) or **email** â€” at least one must be verified "
    "before posting listings. Diaspora users without a Zimbabwean phone can use email.\n\n"
    "1. **POST /api/v1/auth/email/send-otp/** â€” sends a 6-digit code via email\n"
    "2. **POST /api/v1/auth/email/verify/** â€” submit the code to verify\n"
    "3. **POST /api/v1/auth/email/resend/** â€” resend (60 s cooldown)\n\n"
    "Email OTPs expire after 30 minutes. Stored as SHA-256 hashes â€” never in plaintext."
)


class SendEmailOTPView(APIView):
    """POST /api/v1/auth/email/send-otp â€” send OTP to user's email."""

    permission_classes = (IsAuthenticated,)
    throttle_classes = (EmailOTPSendThrottle,)

    @extend_schema(
        tags=["Auth"],
        operation_id="auth_email_send_otp",
        summary="Send email OTP",
        description=f"Send a 6-digit OTP to the authenticated user's email address. "
        f"Rate-limited to 3 requests/hour.\n\n{_EMAIL_OTP_FLOW_DESCRIPTION}",
        request=None,
        responses={
            200: OpenApiResponse(response=MessageResponseSerializer, description="OTP sent"),
            401: OpenApiResponse(description="Not authenticated"),
            429: OpenApiResponse(description="Rate limit exceeded"),
        },
    )
    def post(self, request: Request) -> Response:
        services.send_email_otp(request.user)
        return Response(
            {"message": "Verification code sent to your email."},
            status=status.HTTP_200_OK,
        )


class VerifyEmailOTPView(APIView):
    """POST /api/v1/auth/email/verify â€” verify the email OTP code."""

    permission_classes = (IsAuthenticated,)
    throttle_classes = (EmailOTPVerifyThrottle,)

    @extend_schema(
        tags=["Auth"],
        operation_id="auth_email_verify",
        summary="Verify email OTP",
        description="Submit the 6-digit code received via email. On success, `email_verified` becomes `true`. "
        "Rate-limited to 10 attempts/hour to prevent brute force.",
        request=OTPVerifySerializer,
        responses={
            200: OpenApiResponse(response=UserProfileSerializer, description="Email verified â€” updated profile"),
            400: OpenApiResponse(description="Invalid OTP code"),
            401: OpenApiResponse(description="Not authenticated"),
            422: OpenApiResponse(description="OTP expired"),
            429: OpenApiResponse(description="Rate limit exceeded"),
        },
    )
    def post(self, request: Request) -> Response:
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        services.verify_email_otp(request.user, serializer.validated_data["otp"])
        request.user.refresh_from_db()
        return Response(
            UserProfileSerializer(request.user).data,
            status=status.HTTP_200_OK,
        )


class ResendEmailOTPView(APIView):
    """POST /api/v1/auth/email/resend â€” resend email OTP (60 s cooldown)."""

    permission_classes = (IsAuthenticated,)
    throttle_classes = (EmailOTPSendThrottle,)

    @extend_schema(
        tags=["Auth"],
        operation_id="auth_email_resend",
        summary="Resend email OTP",
        description="Resend the email OTP code. Enforces a 60-second cooldown between sends. "
        "Rate-limited to 3 requests/hour.",
        request=None,
        responses={
            200: OpenApiResponse(response=MessageResponseSerializer, description="OTP resent"),
            400: OpenApiResponse(description="Cooldown not elapsed"),
            401: OpenApiResponse(description="Not authenticated"),
            429: OpenApiResponse(description="Rate limit exceeded"),
        },
    )
    def post(self, request: Request) -> Response:
        services.resend_email_otp(request.user)
        return Response(
            {"message": "Verification code resent to your email."},
            status=status.HTTP_200_OK,
        )


# ──────────────────────────────────────────────
# Seller upgrade
# ──────────────────────────────────────────────


class UpgradeToSellerView(APIView):
    """POST /api/v1/auth/upgrade-to-seller/ — submit a seller upgrade request."""

    permission_classes = (IsAuthenticated, IsBuyer)
    throttle_classes = (SellerUpgradeThrottle,)

    @extend_schema(
        tags=["Auth"],
        operation_id="auth_upgrade_to_seller",
        summary="Request seller upgrade",
        description=(
            "Submit a request to upgrade a BUYER account to SELLER. "
            "Email or phone must be verified. Only one pending request is allowed at a time. "
            "Rate-limited to 3 requests/day."
        ),
        request=SellerUpgradeRequestSerializer,
        responses={
            201: OpenApiResponse(response=SellerUpgradeStatusSerializer, description="Request submitted"),
            400: OpenApiResponse(description="Verification required"),
            403: OpenApiResponse(description="Only buyers can apply"),
            409: OpenApiResponse(description="Pending request already exists"),
            429: OpenApiResponse(description="Rate limit exceeded"),
        },
    )
    def post(self, request: Request) -> Response:
        serializer = SellerUpgradeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        upgrade_request = services.create_seller_upgrade_request(
            user=request.user,
            business_name=data["business_name"],
            business_description=data.get("business_description", ""),
        )
        return Response(
            SellerUpgradeStatusSerializer(upgrade_request).data,
            status=status.HTTP_201_CREATED,
        )


class UpgradeStatusView(APIView):
    """GET /api/v1/auth/upgrade-status/ — check seller upgrade request status."""

    permission_classes = (IsAuthenticated,)

    @extend_schema(
        tags=["Auth"],
        operation_id="auth_upgrade_status",
        summary="Get upgrade request status",
        description="Returns the authenticated user's most recent seller upgrade request, or 404 if none exists.",
        responses={
            200: OpenApiResponse(response=SellerUpgradeStatusSerializer, description="Upgrade request details"),
            401: OpenApiResponse(description="Not authenticated"),
            404: OpenApiResponse(description="No upgrade request found"),
        },
    )
    def get(self, request: Request) -> Response:
        from apps.common.exceptions import NotFoundError

        upgrade_request = services.get_latest_seller_upgrade_request(request.user)
        if upgrade_request is None:
            raise NotFoundError("No seller upgrade request found.")

        return Response(
            SellerUpgradeStatusSerializer(upgrade_request).data,
            status=status.HTTP_200_OK,
        )


# ──────────────────────────────────────────────
# Password reset
# ──────────────────────────────────────────────


class ForgotPasswordView(APIView):
    """POST /api/v1/auth/password/forgot/ — request a password reset email."""

    permission_classes = (AllowAny,)
    throttle_classes = (PasswordResetThrottle,)

    @extend_schema(
        tags=["Auth"],
        operation_id="auth_password_forgot",
        summary="Forgot password",
        description=(
            "Send a password reset token to the given email address. "
            "Always returns 200 to prevent email enumeration. "
            "Rate-limited to 3 requests/hour per IP."
        ),
        request=ForgotPasswordSerializer,
        responses={
            200: OpenApiResponse(response=MessageResponseSerializer, description="Reset email sent (or silently ignored)"),
            400: OpenApiResponse(description="Validation error"),
            429: OpenApiResponse(description="Rate limit exceeded"),
        },
    )
    def post(self, request: Request) -> Response:
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        services.initiate_password_reset(serializer.validated_data["email"])
        return Response(
            {"message": "If that email is registered, a password reset link has been sent."},
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(APIView):
    """POST /api/v1/auth/password/reset/ — confirm reset token and set new password."""

    permission_classes = (AllowAny,)
    throttle_classes = (PasswordResetThrottle,)

    @extend_schema(
        tags=["Auth"],
        operation_id="auth_password_reset",
        summary="Reset password",
        description=(
            "Submit the reset token from the email along with a new password. "
            "Tokens expire after 1 hour and are single-use. "
            "Rate-limited to 3 requests/hour per IP."
        ),
        request=ResetPasswordSerializer,
        responses={
            200: OpenApiResponse(response=MessageResponseSerializer, description="Password updated"),
            400: OpenApiResponse(description="Invalid token or passwords do not match"),
            422: OpenApiResponse(description="Token expired"),
            429: OpenApiResponse(description="Rate limit exceeded"),
        },
    )
    def post(self, request: Request) -> Response:
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        services.confirm_password_reset(
            token=serializer.validated_data["token"],
            new_password=serializer.validated_data["new_password"],
        )
        return Response(
            {"message": "Your password has been reset successfully."},
            status=status.HTTP_200_OK,
        )
