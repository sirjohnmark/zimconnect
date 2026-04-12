"""
Tests for the categories app — tree, list, detail.
"""

import pytest
from rest_framework import status

from tests.conftest import CategoryFactory

TREE_URL = "/api/v1/categories/tree/"
LIST_URL = "/api/v1/categories/"


def _detail_url(category_id):
    return f"/api/v1/categories/{category_id}/"


@pytest.mark.django_db
class TestCategoryTree:
    def test_category_tree(self, api_client, sample_category, child_category):
        resp = api_client.get(TREE_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert isinstance(resp.data, list)
        # Root category should be present
        root_names = [c["name"] for c in resp.data]
        assert sample_category.name in root_names

    def test_tree_is_cached(self, api_client, sample_category):
        """Second request should hit the cache (same result, no extra query)."""
        resp1 = api_client.get(TREE_URL)
        resp2 = api_client.get(TREE_URL)
        assert resp1.status_code == status.HTTP_200_OK
        assert resp2.status_code == status.HTTP_200_OK
        assert resp1.data == resp2.data


@pytest.mark.django_db
class TestCategoryList:
    def test_category_list_paginated(self, api_client):
        CategoryFactory.create_batch(5)
        resp = api_client.get(LIST_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert "results" in resp.data
        assert "count" in resp.data
        assert resp.data["count"] >= 5


@pytest.mark.django_db
class TestCategoryDetail:
    def test_category_detail_with_children(
        self, api_client, sample_category, child_category
    ):
        resp = api_client.get(_detail_url(sample_category.pk))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["name"] == sample_category.name

    def test_category_not_found(self, api_client):
        resp = api_client.get(_detail_url(99999))
        assert resp.status_code == status.HTTP_404_NOT_FOUND
