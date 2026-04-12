"""
Category views â€” tree, list, detail.
"""

from django.core.cache import cache
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.categories import selectors, services
from apps.categories.serializers import (
    CategoryCreateUpdateSerializer,
    CategoryDetailSerializer,
    CategoryListSerializer,
    CategoryTreeSerializer,
)
from apps.common.cache import CacheKeys, TTL_CATEGORY_TREE
from apps.common.pagination import StandardResultsSetPagination
from apps.common.permissions import IsAdminOrReadOnly


class CategoryTreeView(APIView):
    """GET /api/v1/categories/tree â€” full nested tree, cached for 1 hour."""

    permission_classes = (AllowAny,)

    @extend_schema(
        tags=["Categories"],
        operation_id="categories_tree",
        summary="Get category tree",
        description="Full nested category tree. Cached for 1 hour. Public endpoint.",
        responses={
            200: OpenApiResponse(response=CategoryTreeSerializer(many=True), description="Nested category tree"),
        },
    )
    def get(self, request: Request) -> Response:
        data = cache.get(CacheKeys.CATEGORY_TREE)
        if data is None:
            qs = selectors.get_category_tree()
            data = CategoryTreeSerializer(qs, many=True).data
            cache.set(CacheKeys.CATEGORY_TREE, data, TTL_CATEGORY_TREE)
        return Response(data, status=status.HTTP_200_OK)


class CategoryListView(APIView):
    """
    GET  /api/v1/categories/ â€” paginated flat list of active categories.
    POST /api/v1/categories/ â€” create a new category (admin only).
    """

    permission_classes = (IsAdminOrReadOnly,)

    @extend_schema(
        tags=["Categories"],
        operation_id="categories_list",
        summary="List categories",
        description="Paginated flat list of active categories. Public endpoint.",
        responses={200: CategoryListSerializer(many=True)},
    )
    def get(self, request: Request) -> Response:
        qs = selectors.get_active_categories()
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = CategoryListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    @extend_schema(
        tags=["Categories"],
        operation_id="categories_create",
        summary="Create a category",
        description="Create a new category. **Admin only.**",
        request=CategoryCreateUpdateSerializer,
        responses={
            201: OpenApiResponse(response=CategoryDetailSerializer, description="Category created"),
            400: OpenApiResponse(description="Validation error"),
            403: OpenApiResponse(description="Not an admin"),
        },
    )
    def post(self, request: Request) -> Response:
        serializer = CategoryCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        parent_id = data.pop("parent", None)
        parent_id = parent_id.pk if parent_id else None

        category = services.create_category(
            name=data.pop("name"),
            parent_id=parent_id,
            **data,
        )
        return Response(
            CategoryDetailSerializer(category).data,
            status=status.HTTP_201_CREATED,
        )


class CategoryDetailView(APIView):
    """
    GET   /api/v1/categories/{id}/ â€” category detail + direct children.
    PATCH /api/v1/categories/{id}/ â€” update category (admin only).
    """

    permission_classes = (IsAdminOrReadOnly,)

    @extend_schema(
        tags=["Categories"],
        operation_id="categories_detail",
        summary="Get category detail",
        description="Category detail including direct children. Public endpoint.",
        responses={
            200: OpenApiResponse(response=CategoryDetailSerializer, description="Category detail"),
            404: OpenApiResponse(description="Category not found"),
        },
    )
    def get(self, request: Request, category_id: int) -> Response:
        category = selectors.get_category_by_id(category_id)
        serializer = CategoryDetailSerializer(category)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        tags=["Categories"],
        operation_id="categories_update",
        summary="Update a category",
        description="Partially update a category. **Admin only.**",
        request=CategoryCreateUpdateSerializer,
        responses={
            200: OpenApiResponse(response=CategoryDetailSerializer, description="Updated category"),
            400: OpenApiResponse(description="Validation error"),
            403: OpenApiResponse(description="Not an admin"),
            404: OpenApiResponse(description="Category not found"),
        },
    )
    def patch(self, request: Request, category_id: int) -> Response:
        category = selectors.get_category_by_id(category_id)
        serializer = CategoryCreateUpdateSerializer(
            category, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)

        updated = services.update_category(category, **serializer.validated_data)
        return Response(
            CategoryDetailSerializer(updated).data,
            status=status.HTTP_200_OK,
        )
