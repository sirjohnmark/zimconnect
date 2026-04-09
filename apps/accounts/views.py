"""
Account views — registration, login, logout, token refresh, profile.
"""

from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts import services
from apps.accounts.serializers import (
    LoginResponseSerializer,
    LogoutRequestSerializer,
    MessageResponseSerializer,
    TokenResponseSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    UserRegistrationSerializer,
    UserUpdateSerializer,
)
from apps.common.throttling import LoginRateThrottle, RegisterRateThrottle


class RegisterView(APIView):
    """POST /api/auth/register — create a new user account."""

    permission_classes = (AllowAny,)
    throttle_classes = (RegisterRateThrottle,)

    @extend_schema(
        tags=["Auth"],
        operation_id="auth_register",
        summary="Register a new user",
        description="Create a new BUYER or SELLER account. Rate-limited to 5 requests/hour.",
        request=UserRegistrationSerializer,
        responses={
            201: OpenApiResponse(response=UserProfileSerializer, description="User created"),
            400: OpenApiResponse(description="Validation error (duplicate email/username, password mismatch)"),
            429: OpenApiResponse(description="Rate limit exceeded"),
        },
    )
    def post(self, request: Request) -> Response:
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.validate_email = serializer.validate_email  # keeps IDE happy
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = services.create_user(
            email=data["email"],
            username=data["username"],
            password=data["password"],
            role=data["role"],
            first_name=data.get("first_name", ""),
            last_name=data.get("last_name", ""),
            phone=data.get("phone", ""),
        )
        profile = UserProfileSerializer(user).data
        return Response(profile, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """POST /api/auth/login — authenticate and return JWT pair + profile."""

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
    """POST /api/auth/logout — blacklist the refresh token."""

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
    """POST /api/auth/token/refresh — rotate refresh token."""

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
    """GET/PATCH /api/auth/profile — read or update your own profile."""

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
