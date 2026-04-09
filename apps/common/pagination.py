"""
Custom pagination class for consistent API responses.
"""

from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    """
    Standard paginator for all list endpoints.

    Query params:
        ?page=2
        ?page_size=50  (max 100)
    """

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100
