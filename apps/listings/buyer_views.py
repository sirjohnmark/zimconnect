"""
Buyer-specific listing views — saved (wishlist) management.

Mounted at /api/v1/buyers/ by config/urls.py.
"""

from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts import services as account_services
from apps.accounts.serializers import BuyerDashboardSerializer
from apps.common.constants import SellerUpgradeStatus, UserRole
from apps.common.pagination import StandardResultsSetPagination
from apps.common.permissions import IsBuyerOrSeller
from apps.inbox.models import Conversation
from apps.listings import selectors, services
from apps.listings.models import SavedListing
from apps.listings.serializers import SavedListingSerializer

import logging

logger = logging.getLogger(__name__)


class BuyerDashboardView(APIView):
    """GET /api/v1/buyers/dashboard/ — dashboard summary for buyer mode."""

    permission_classes = (IsAuthenticated, IsBuyerOrSeller)

    @extend_schema(
        tags=["Buyers"],
        operation_id="buyers_dashboard",
        summary="Buyer dashboard",
        description=(
            "Return the authenticated user's buyer dashboard summary. "
            "Approved sellers keep buyer-mode access."
        ),
        responses={
            200: OpenApiResponse(response=BuyerDashboardSerializer, description="Buyer dashboard summary"),
            401: OpenApiResponse(description="Not authenticated"),
            403: OpenApiResponse(description="Only buyers or sellers can access this endpoint"),
        },
    )
    def get(self, request: Request) -> Response:
        latest_request = account_services.get_latest_seller_upgrade_request(request.user)
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


class SavedListingView(APIView):
    """
    GET  /api/v1/buyers/saved/ — list all saved listings for the authenticated buyer.
    POST /api/v1/buyers/saved/ — add a listing to the wishlist.
    """

    permission_classes = (IsAuthenticated, IsBuyerOrSeller)

    @extend_schema(
        tags=["Buyers"],
        operation_id="buyers_saved_list",
        summary="List saved listings",
        description="Return all listings the authenticated buyer has saved, newest first.",
        responses={
            200: SavedListingSerializer(many=True),
            401: OpenApiResponse(description="Not authenticated"),
            403: OpenApiResponse(description="Only buyers can access this endpoint"),
        },
    )
    def get(self, request: Request) -> Response:
        qs = selectors.get_saved_listings(request.user)
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = SavedListingSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    @extend_schema(
        tags=["Buyers"],
        operation_id="buyers_saved_add",
        summary="Save a listing",
        description=(
            "Add a listing to the buyer's wishlist. "
            "Only ACTIVE listings can be saved. Returns 409 if already saved."
        ),
        request=None,
        responses={
            201: OpenApiResponse(response=SavedListingSerializer, description="Listing saved"),
            400: OpenApiResponse(description="Listing is not active"),
            401: OpenApiResponse(description="Not authenticated"),
            403: OpenApiResponse(description="Only buyers can save listings"),
            404: OpenApiResponse(description="Listing not found"),
            409: OpenApiResponse(description="Already saved"),
        },
    )
    def post(self, request: Request) -> Response:
        listing_id = request.data.get("listing_id")
        if not listing_id:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"listing_id": "This field is required."})

        try:
            listing_id = int(listing_id)
        except (TypeError, ValueError):
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"listing_id": "Must be an integer."})

        saved = services.save_listing(buyer=request.user, listing_id=listing_id)
        # Reload with full relations for response
        saved = selectors.get_saved_listings(request.user).get(pk=saved.pk)
        return Response(
            SavedListingSerializer(saved).data,
            status=status.HTTP_201_CREATED,
        )


class SavedListingDeleteView(APIView):
    """DELETE /api/v1/buyers/saved/{listing_id}/ — remove a listing from the wishlist."""

    permission_classes = (IsAuthenticated, IsBuyerOrSeller)

    @extend_schema(
        tags=["Buyers"],
        operation_id="buyers_saved_remove",
        summary="Remove a saved listing",
        description="Remove the given listing from the buyer's wishlist.",
        responses={
            204: OpenApiResponse(description="Listing removed from wishlist"),
            401: OpenApiResponse(description="Not authenticated"),
            403: OpenApiResponse(description="Only buyers can manage saved listings"),
            404: OpenApiResponse(description="Listing not in wishlist"),
        },
    )
    def delete(self, request: Request, listing_id: int) -> Response:
        services.unsave_listing(buyer=request.user, listing_id=listing_id)
        return Response(status=status.HTTP_204_NO_CONTENT)
