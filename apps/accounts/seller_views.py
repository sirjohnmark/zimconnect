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
    SellerProfileMeSerializer,
    SellerProfilePublicSerializer,
    SellerProfileUpdateSerializer,
)
from apps.common.permissions import IsSeller

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
