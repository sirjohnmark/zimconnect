"""
Category views — tree, list, detail.
"""

from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
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
from apps.common.pagination import StandardResultsSetPagination
from apps.common.permissions import IsAdminOrReadOnly


class CategoryTreeView(APIView):
    """GET /api/categories/tree — full nested tree, cached for 1 hour."""

    permission_classes = (AllowAny,)

    @method_decorator(cache_page(60 * 60))
    def get(self, request: Request) -> Response:
        qs = selectors.get_category_tree()
        serializer = CategoryTreeSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CategoryListView(APIView):
    """
    GET  /api/categories/ — paginated flat list of active categories.
    POST /api/categories/ — create a new category (admin only).
    """

    permission_classes = (IsAdminOrReadOnly,)

    def get(self, request: Request) -> Response:
        qs = selectors.get_active_categories()
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = CategoryListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

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
    GET   /api/categories/{id}/ — category detail + direct children.
    PATCH /api/categories/{id}/ — update category (admin only).
    """

    permission_classes = (IsAdminOrReadOnly,)

    def get(self, request: Request, category_id: int) -> Response:
        category = selectors.get_category_by_id(category_id)
        serializer = CategoryDetailSerializer(category)
        return Response(serializer.data, status=status.HTTP_200_OK)

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
