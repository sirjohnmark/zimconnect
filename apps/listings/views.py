"""
Listing views — CRUD, publish, images.
"""

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.constants import UserRole
from apps.common.exceptions import NotFoundError, PermissionDeniedError
from apps.common.pagination import StandardResultsSetPagination
from apps.listings import selectors, services
from apps.listings.permissions import IsOwnerOrReadOnly
from apps.listings.serializers import (
    ListingCreateSerializer,
    ListingDetailSerializer,
    ListingImageSerializer,
    ListingImageUploadSerializer,
    ListingListSerializer,
    ListingUpdateSerializer,
)

# Reusable OpenAPI query parameters for listing filters
_LISTING_FILTER_PARAMS = [
    OpenApiParameter("category", OpenApiTypes.STR, description="Category slug (includes subcategories)"),
    OpenApiParameter("location", OpenApiTypes.STR, description="Zimbabwe city code"),
    OpenApiParameter("min_price", OpenApiTypes.DECIMAL, description="Minimum price"),
    OpenApiParameter("max_price", OpenApiTypes.DECIMAL, description="Maximum price"),
    OpenApiParameter("condition", OpenApiTypes.STR, description="NEW or USED"),
    OpenApiParameter("search", OpenApiTypes.STR, description="Full-text search in title/description"),
    OpenApiParameter("featured", OpenApiTypes.BOOL, description="Filter featured listings only"),
    OpenApiParameter(
        "ordering",
        OpenApiTypes.STR,
        description="Sort field: created_at, -created_at, price, -price, views_count, -views_count",
    ),
]


class ListingListCreateView(APIView):
    """
    GET  /api/listings/ — paginated active listings with filters.
    POST /api/listings/ — create a new listing (seller role required).
    """

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [IsAuthenticatedOrReadOnly()]

    @extend_schema(
        tags=["Listings"],
        operation_id="listings_list",
        summary="List active listings",
        description="Paginated, filterable list of active marketplace listings. Public endpoint.",
        parameters=_LISTING_FILTER_PARAMS,
        responses={200: ListingListSerializer(many=True)},
    )
    def get(self, request: Request) -> Response:
        filters = {
            "category": request.query_params.get("category"),
            "location": request.query_params.get("location"),
            "min_price": request.query_params.get("min_price"),
            "max_price": request.query_params.get("max_price"),
            "condition": request.query_params.get("condition"),
            "search": request.query_params.get("search"),
            "featured": request.query_params.get("featured"),
            "ordering": request.query_params.get("ordering"),
        }
        # Strip None values
        filters = {k: v for k, v in filters.items() if v is not None}

        qs = selectors.get_active_listings(filters or None)
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = ListingListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    @extend_schema(
        tags=["Listings"],
        operation_id="listings_create",
        summary="Create a listing",
        description="Create a new listing in DRAFT status. Requires SELLER or ADMIN role.",
        request=ListingCreateSerializer,
        responses={
            201: OpenApiResponse(response=ListingDetailSerializer, description="Listing created"),
            400: OpenApiResponse(description="Validation error"),
            403: OpenApiResponse(description="Not a seller/admin"),
        },
    )
    def post(self, request: Request) -> Response:
        if getattr(request.user, "role", None) not in {UserRole.SELLER, UserRole.ADMIN}:
            raise PermissionDeniedError("Only sellers can create listings.")

        serializer = ListingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        listing = services.create_listing(
            owner=request.user,
            title=data["title"],
            description=data["description"],
            price=data["price"],
            currency=data["currency"],
            condition=data["condition"],
            category_id=data["category_id"],
            location=data["location"],
        )

        # Refetch with relations for detail response
        listing = selectors.get_listing_by_id(listing.pk)
        return Response(
            ListingDetailSerializer(listing).data,
            status=status.HTTP_201_CREATED,
        )


class ListingDetailView(APIView):
    """
    GET    /api/listings/{id}/ — public detail, increments views_count.
    PATCH  /api/listings/{id}/ — owner only.
    DELETE /api/listings/{id}/ — owner or admin.
    """

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    @extend_schema(
        tags=["Listings"],
        operation_id="listings_detail",
        summary="Get listing detail",
        description="Retrieve a listing by ID. Increments view count. Public endpoint.",
        responses={
            200: OpenApiResponse(response=ListingDetailSerializer, description="Listing detail"),
            404: OpenApiResponse(description="Listing not found"),
        },
    )
    def get(self, request: Request, listing_id: int) -> Response:
        listing = selectors.get_listing_by_id(listing_id)
        listing.increment_views()
        serializer = ListingDetailSerializer(listing)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        tags=["Listings"],
        operation_id="listings_update",
        summary="Update a listing",
        description="Partially update a listing. **Owner only.**",
        request=ListingUpdateSerializer,
        responses={
            200: OpenApiResponse(response=ListingDetailSerializer, description="Updated listing"),
            400: OpenApiResponse(description="Validation error"),
            403: OpenApiResponse(description="Not the listing owner"),
            404: OpenApiResponse(description="Listing not found"),
        },
    )
    def patch(self, request: Request, listing_id: int) -> Response:
        listing = selectors.get_listing_by_id(listing_id)
        serializer = ListingUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated = services.update_listing(listing, request.user, **serializer.validated_data)
        updated = selectors.get_listing_by_id(updated.pk)
        return Response(
            ListingDetailSerializer(updated).data,
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        tags=["Listings"],
        operation_id="listings_delete",
        summary="Delete a listing",
        description="Permanently delete a listing. **Owner or admin.**",
        responses={
            204: OpenApiResponse(description="Listing deleted"),
            403: OpenApiResponse(description="Not the owner or admin"),
            404: OpenApiResponse(description="Listing not found"),
        },
    )
    def delete(self, request: Request, listing_id: int) -> Response:
        listing = selectors.get_listing_by_id(listing_id)
        services.delete_listing(listing, request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyListingsView(APIView):
    """GET /api/listings/my-listings/ — authenticated user's own listings."""

    permission_classes = (IsAuthenticated,)

    @extend_schema(
        tags=["Listings"],
        operation_id="listings_mine",
        summary="My listings",
        description="List the authenticated user's own listings. Filterable by status.",
        parameters=[
            OpenApiParameter("status", OpenApiTypes.STR, description="Filter by status: DRAFT, ACTIVE, SOLD, REJECTED"),
        ],
        responses={200: ListingListSerializer(many=True)},
    )
    def get(self, request: Request) -> Response:
        status_filter = request.query_params.get("status")
        qs = selectors.get_user_listings(request.user, status=status_filter)
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = ListingListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class ListingPublishView(APIView):
    """POST /api/listings/{id}/publish/ — owner publishes a draft listing."""

    permission_classes = (IsAuthenticated,)

    @extend_schema(
        tags=["Listings"],
        operation_id="listings_publish",
        summary="Publish a draft listing",
        description="Transition a listing from DRAFT to ACTIVE status. **Owner only.**",
        request=None,
        responses={
            200: OpenApiResponse(response=ListingDetailSerializer, description="Published listing"),
            403: OpenApiResponse(description="Not the listing owner"),
            404: OpenApiResponse(description="Listing not found"),
            409: OpenApiResponse(description="Listing is not in DRAFT status"),
        },
    )
    def post(self, request: Request, listing_id: int) -> Response:
        listing = selectors.get_listing_by_id(listing_id)
        published = services.publish_listing(listing, request.user)
        published = selectors.get_listing_by_id(published.pk)
        return Response(
            ListingDetailSerializer(published).data,
            status=status.HTTP_200_OK,
        )


class ListingImageUploadView(APIView):
    """POST /api/listings/{id}/images/ — add images to a listing (owner only)."""

    permission_classes = (IsAuthenticated,)

    @extend_schema(
        tags=["Listings"],
        operation_id="listings_images_upload",
        summary="Upload listing images",
        description="Upload 1–10 images to a listing. **Owner only.** Max 10 images per listing total. Multipart form-data.",
        request=ListingImageUploadSerializer,
        responses={
            201: OpenApiResponse(response=ListingImageSerializer(many=True), description="Uploaded images"),
            400: OpenApiResponse(description="Validation error or image limit exceeded"),
            403: OpenApiResponse(description="Not the listing owner"),
            404: OpenApiResponse(description="Listing not found"),
        },
    )
    def post(self, request: Request, listing_id: int) -> Response:
        listing = selectors.get_listing_by_id(listing_id)

        if listing.owner_id != request.user.pk:
            raise PermissionDeniedError("You do not own this listing.")

        serializer = ListingImageUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_images = services.add_images(listing, serializer.validated_data["images"])
        return Response(
            ListingImageSerializer(new_images, many=True).data,
            status=status.HTTP_201_CREATED,
        )


class ListingImageDeleteView(APIView):
    """DELETE /api/listings/images/{image_id}/ — delete an image (owner or admin)."""

    permission_classes = (IsAuthenticated,)

    @extend_schema(
        tags=["Listings"],
        operation_id="listings_images_delete",
        summary="Delete a listing image",
        description="Remove an image from a listing. **Owner or admin.**",
        responses={
            204: OpenApiResponse(description="Image deleted"),
            403: OpenApiResponse(description="Not the owner or admin"),
            404: OpenApiResponse(description="Image not found"),
        },
    )
    def delete(self, request: Request, image_id: int) -> Response:
        from apps.listings.models import ListingImage

        try:
            image = ListingImage.objects.select_related("listing").get(pk=image_id)
        except ListingImage.DoesNotExist:
            raise NotFoundError(f"Image with id {image_id} not found.")

        services.delete_image(image, request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
