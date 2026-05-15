"""
Seller-specific views — public storefront and own profile management.

Mounted at /api/v1/sellers/ by config/urls.py.
"""

import logging

from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts import services
from apps.accounts.serializers import (
    SellerDashboardSerializer,
    SellerProfileMeSerializer,
    SellerProfilePublicSerializer,
    SellerProfileUpdateSerializer,
    SellerUpgradeRequestSerializer,
    SellerUpgradeStatusSerializer,
)
from apps.common.constants import ListingStatus
from apps.common.permissions import IsSeller
from apps.common.throttling import SellerUpgradeThrottle
from apps.listings import selectors as listing_selectors
from apps.listings.serializers import ListingListSerializer

logger = logging.getLogger(__name__)


class SellerPublicView(APIView):
    """GET /api/v1/sellers/{username}/ — public seller storefront."""

    permission_classes = (AllowAny,)

    @extend_schema(
        tags=["Sellers"],
        operation_id="sellers_public_profile",
        summary="Public seller storefront",
        description=(
            "Retrieve the public shop profile for a seller by username. "
            "Includes shop info and active listing count. Public endpoint."
        ),
        responses={
            200: OpenApiResponse(response=SellerProfilePublicSerializer, description="Seller storefront"),
            404: OpenApiResponse(description="Seller not found"),
        },
    )
    def get(self, request: Request, username: str) -> Response:
        profile = services.get_seller_profile_by_username(username)
        return Response(
            SellerProfilePublicSerializer(profile).data,
            status=status.HTTP_200_OK,
        )


class SellerMeView(APIView):
    """
    GET   /api/v1/sellers/me/ — authenticated seller's own profile.
    PATCH /api/v1/sellers/me/ — update shop fields.
    """

    permission_classes = (IsAuthenticated, IsSeller)

    @extend_schema(
        tags=["Sellers"],
        operation_id="sellers_me_read",
        summary="Get my seller profile",
        description="Return the authenticated seller's full shop profile.",
        responses={
            200: OpenApiResponse(response=SellerProfileMeSerializer, description="Seller profile"),
            401: OpenApiResponse(description="Not authenticated"),
            403: OpenApiResponse(description="Only sellers can access this endpoint"),
            404: OpenApiResponse(description="Seller profile not yet created"),
        },
    )
    def get(self, request: Request) -> Response:
        profile = services.get_seller_profile_for_user(request.user)
        return Response(
            SellerProfileMeSerializer(profile).data,
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        tags=["Sellers"],
        operation_id="sellers_me_update",
        summary="Update my seller profile",
        description=(
            "Partially update the authenticated seller's shop profile. "
            "Updatable fields: shop_name, shop_description, response_time_hours."
        ),
        request=SellerProfileUpdateSerializer,
        responses={
            200: OpenApiResponse(response=SellerProfileMeSerializer, description="Updated seller profile"),
            400: OpenApiResponse(description="Validation error"),
            401: OpenApiResponse(description="Not authenticated"),
            403: OpenApiResponse(description="Only sellers can update their profile"),
            404: OpenApiResponse(description="Seller profile not found"),
        },
    )
    def patch(self, request: Request) -> Response:
        serializer = SellerProfileUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        profile = services.update_seller_profile(request.user, **serializer.validated_data)
        return Response(
            SellerProfileMeSerializer(profile).data,
            status=status.HTTP_200_OK,
        )


class SellerApplyView(APIView):
    """POST /api/v1/sellers/apply/ — submit a seller application."""

    permission_classes = (IsAuthenticated,)
    throttle_classes = (SellerUpgradeThrottle,)

    @extend_schema(
        tags=["Sellers"],
        operation_id="sellers_apply",
        summary="Apply to become a seller",
        description=(
            "Submit a seller application for the authenticated BUYER account. "
            "Email or phone must be verified. Only one pending application is allowed."
        ),
        request=SellerUpgradeRequestSerializer,
        responses={
            201: OpenApiResponse(response=SellerUpgradeStatusSerializer, description="Application submitted"),
            400: OpenApiResponse(description="Verification required"),
            403: OpenApiResponse(description="Only buyers can apply"),
            409: OpenApiResponse(description="Pending application already exists"),
            429: OpenApiResponse(description="Rate limit exceeded"),
        },
    )
    def post(self, request: Request) -> Response:
        serializer = SellerUpgradeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        upgrade_request = services.create_seller_upgrade_request(
            user=request.user,
            business_name=serializer.validated_data["business_name"],
            business_description=serializer.validated_data.get("business_description", ""),
        )
        return Response(
            SellerUpgradeStatusSerializer(upgrade_request).data,
            status=status.HTTP_201_CREATED,
        )


class SellerApplicationStatusView(APIView):
    """GET /api/v1/sellers/application-status/ — latest seller application status."""

    permission_classes = (IsAuthenticated,)

    @extend_schema(
        tags=["Sellers"],
        operation_id="sellers_application_status",
        summary="Get seller application status",
        description="Return the authenticated user's latest seller application, if one exists.",
        responses={
            200: OpenApiResponse(response=SellerUpgradeStatusSerializer, description="Application status"),
            401: OpenApiResponse(description="Not authenticated"),
            404: OpenApiResponse(description="No application found"),
        },
    )
    def get(self, request: Request) -> Response:
        from apps.common.exceptions import NotFoundError

        upgrade_request = services.get_latest_seller_upgrade_request(request.user)
        if upgrade_request is None:
            raise NotFoundError("No seller application found.")

        return Response(
            SellerUpgradeStatusSerializer(upgrade_request).data,
            status=status.HTTP_200_OK,
        )


class SellerDashboardView(APIView):
    """GET /api/v1/sellers/dashboard/ — seller dashboard summary."""

    permission_classes = (IsAuthenticated, IsSeller)

    @extend_schema(
        tags=["Sellers"],
        operation_id="sellers_dashboard",
        summary="Seller dashboard",
        description="Return the authenticated seller's shop profile, listing counts, and recent listings.",
        responses={
            200: OpenApiResponse(response=SellerDashboardSerializer, description="Seller dashboard summary"),
            401: OpenApiResponse(description="Not authenticated"),
            403: OpenApiResponse(description="Only sellers can access this endpoint"),
            404: OpenApiResponse(description="Seller profile not found"),
        },
    )
    def get(self, request: Request) -> Response:
        profile = services.get_seller_profile_for_user(request.user)
        listings = listing_selectors.get_user_listings(request.user)
        recent_listings = listings[:5]
        stats = {
            "total": listings.count(),
            "draft": listings.filter(status=ListingStatus.DRAFT).count(),
            "active": listings.filter(status=ListingStatus.ACTIVE).count(),
            "sold": listings.filter(status=ListingStatus.SOLD).count(),
            "rejected": listings.filter(status=ListingStatus.REJECTED).count(),
        }
        data = {
            "user": request.user,
            "seller_profile": profile,
            "listing_stats": stats,
            "recent_listings": recent_listings,
        }
        return Response(SellerDashboardSerializer(data).data, status=status.HTTP_200_OK)


class SellerListingsView(APIView):
    """GET /api/v1/sellers/listings/ — authenticated seller's listings."""

    permission_classes = (IsAuthenticated, IsSeller)

    @extend_schema(
        tags=["Sellers"],
        operation_id="sellers_listings",
        summary="Seller listings",
        description="List the authenticated seller's own listings. Filterable by status.",
        responses={
            200: OpenApiResponse(response=ListingListSerializer(many=True), description="Seller listings"),
            401: OpenApiResponse(description="Not authenticated"),
            403: OpenApiResponse(description="Only sellers can access this endpoint"),
        },
    )
    def get(self, request: Request) -> Response:
        from apps.common.pagination import StandardResultsSetPagination

        qs = listing_selectors.get_user_listings(
            request.user,
            status=request.query_params.get("status"),
        )
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = ListingListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
