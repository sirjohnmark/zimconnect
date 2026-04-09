"""
Admin panel views — dashboard, user management, listing moderation.
"""

from django.contrib.auth import get_user_model
from django.db.models import Count
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.exceptions import NotFoundError, ServiceError
from apps.common.pagination import StandardResultsSetPagination
from apps.common.permissions import IsAdmin, IsModerator
from apps.adminpanel import selectors, services
from apps.adminpanel.serializers import (
    AdminDashboardSerializer,
    AdminListingModerationSerializer,
    AdminUserDetailSerializer,
    AdminUserListSerializer,
    AdminUserUpdateSerializer,
    ModerationActionSerializer,
)

User = get_user_model()


# ──────────────────────────────────────────────
# Dashboard
# ──────────────────────────────────────────────


class DashboardView(APIView):
    """GET /api/admin/dashboard/ — aggregate stats (admin only)."""

    permission_classes = (IsAdmin,)

    @extend_schema(
        tags=["Admin"],
        operation_id="admin_dashboard",
        summary="Dashboard statistics",
        description="Aggregate platform statistics: users, listings, conversations. **Admin only.**",
        responses={
            200: OpenApiResponse(response=AdminDashboardSerializer, description="Dashboard stats"),
            403: OpenApiResponse(description="Not an admin"),
        },
    )
    def get(self, request: Request) -> Response:
        stats = selectors.get_dashboard_stats()
        serializer = AdminDashboardSerializer(stats)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ──────────────────────────────────────────────
# User management
# ──────────────────────────────────────────────


class AdminUserListView(APIView):
    """GET /api/admin/users/ — paginated user list (admin only)."""

    permission_classes = (IsAdmin,)

    @extend_schema(
        tags=["Admin"],
        operation_id="admin_users_list",
        summary="List users",
        description="Paginated list of all users with filters. **Admin only.**",
        parameters=[
            OpenApiParameter("role", OpenApiTypes.STR, description="Filter by role: BUYER, SELLER, ADMIN, MODERATOR"),
            OpenApiParameter("is_active", OpenApiTypes.BOOL, description="Filter by active status"),
            OpenApiParameter("search", OpenApiTypes.STR, description="Search by email or username"),
        ],
        responses={200: AdminUserListSerializer(many=True)},
    )
    def get(self, request: Request) -> Response:
        filters = {
            "role": request.query_params.get("role"),
            "is_active": request.query_params.get("is_active"),
            "search": request.query_params.get("search"),
        }
        # Convert is_active string to bool
        if filters["is_active"] is not None:
            filters["is_active"] = filters["is_active"].lower() in ("true", "1")

        filters = {k: v for k, v in filters.items() if v is not None}

        qs = selectors.get_all_users(filters or None)
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = AdminUserListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class AdminUserDetailView(APIView):
    """
    GET   /api/admin/users/{id}/ — user detail with counts.
    PATCH /api/admin/users/{id}/ — update is_active or role.
    """

    permission_classes = (IsAdmin,)

    @extend_schema(
        tags=["Admin"],
        operation_id="admin_users_detail",
        summary="Get user detail",
        description="Full user detail with listing and conversation counts. **Admin only.**",
        responses={
            200: OpenApiResponse(response=AdminUserDetailSerializer, description="User detail"),
            404: OpenApiResponse(description="User not found"),
        },
    )
    def get(self, request: Request, user_id: int) -> Response:
        try:
            user = (
                User.objects
                .annotate(
                    listings_count=Count("listings"),
                    conversations_count=Count("conversations"),
                )
                .get(pk=user_id)
            )
        except User.DoesNotExist:
            raise NotFoundError(f"User with id {user_id} not found.")

        serializer = AdminUserDetailSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        tags=["Admin"],
        operation_id="admin_users_update",
        summary="Update a user",
        description="Toggle user active status or change role. Cannot modify your own account. **Admin only.**",
        request=AdminUserUpdateSerializer,
        responses={
            200: OpenApiResponse(response=AdminUserDetailSerializer, description="Updated user"),
            400: OpenApiResponse(description="Cannot modify own account"),
            404: OpenApiResponse(description="User not found"),
        },
    )
    def patch(self, request: Request, user_id: int) -> Response:
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            raise NotFoundError(f"User with id {user_id} not found.")

        serializer = AdminUserUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if "is_active" in data:
            if data["is_active"]:
                services.activate_user(user, request.user)
            else:
                services.deactivate_user(user, request.user)

        if "role" in data:
            services.change_user_role(user, request.user, data["role"])

        # Refetch with annotations
        user = (
            User.objects
            .annotate(
                listings_count=Count("listings"),
                conversations_count=Count("conversations"),
            )
            .get(pk=user_id)
        )
        return Response(
            AdminUserDetailSerializer(user).data,
            status=status.HTTP_200_OK,
        )


# ──────────────────────────────────────────────
# Listing moderation
# ──────────────────────────────────────────────


class ModerationListView(APIView):
    """GET /api/admin/listings/moderation/ — draft listings for review."""

    permission_classes = (IsModerator,)

    @extend_schema(
        tags=["Admin"],
        operation_id="admin_moderation_list",
        summary="Moderation queue",
        description="Paginated list of DRAFT listings awaiting moderation. **Moderator or admin.**",
        responses={200: AdminListingModerationSerializer(many=True)},
    )
    def get(self, request: Request) -> Response:
        qs = selectors.get_listings_for_moderation()
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = AdminListingModerationSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class ModerationDetailView(APIView):
    """GET /api/admin/listings/moderation/{id}/ — single listing detail for review."""

    permission_classes = (IsModerator,)

    @extend_schema(
        tags=["Admin"],
        operation_id="admin_moderation_detail",
        summary="Moderation listing detail",
        description="Full detail of a listing under moderation. **Moderator or admin.**",
        responses={
            200: OpenApiResponse(response=AdminListingModerationSerializer, description="Listing detail"),
            404: OpenApiResponse(description="Listing not found"),
        },
    )
    def get(self, request: Request, listing_id: int) -> Response:
        listing = selectors.get_listing_moderation_detail(listing_id)
        serializer = AdminListingModerationSerializer(listing)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ApproveListingView(APIView):
    """POST /api/admin/listings/moderation/{id}/approve/ — approve a draft listing."""

    permission_classes = (IsModerator,)

    @extend_schema(
        tags=["Admin"],
        operation_id="admin_moderation_approve",
        summary="Approve listing",
        description="Approve a draft listing, transitioning it to ACTIVE. **Moderator or admin.**",
        request=None,
        responses={
            200: OpenApiResponse(response=AdminListingModerationSerializer, description="Approved listing"),
            404: OpenApiResponse(description="Listing not found"),
            409: OpenApiResponse(description="Listing is not in DRAFT status"),
        },
    )
    def post(self, request: Request, listing_id: int) -> Response:
        listing = selectors.get_listing_moderation_detail(listing_id)
        approved = services.approve_listing(listing, request.user)
        serializer = AdminListingModerationSerializer(approved)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RejectListingView(APIView):
    """POST /api/admin/listings/moderation/{id}/reject/ — reject a listing with reason."""

    permission_classes = (IsModerator,)

    @extend_schema(
        tags=["Admin"],
        operation_id="admin_moderation_reject",
        summary="Reject listing",
        description="Reject a listing with a mandatory reason. Transitions the listing to REJECTED. **Moderator or admin.**",
        request=ModerationActionSerializer,
        responses={
            200: OpenApiResponse(response=AdminListingModerationSerializer, description="Rejected listing"),
            400: OpenApiResponse(description="Rejection reason is required"),
            404: OpenApiResponse(description="Listing not found"),
        },
    )
    def post(self, request: Request, listing_id: int) -> Response:
        serializer = ModerationActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reason = serializer.validated_data.get("reason", "")
        if not reason:
            raise ServiceError("A rejection reason is required.")

        listing = selectors.get_listing_moderation_detail(listing_id)
        rejected = services.reject_listing(listing, request.user, reason)
        return Response(
            AdminListingModerationSerializer(rejected).data,
            status=status.HTTP_200_OK,
        )
