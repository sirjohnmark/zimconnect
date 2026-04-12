"""
URL routes for the categories app.

All mounted under /api/v1/categories/ by config/urls.py.
"""

from django.urls import path

from apps.categories import views

app_name = "categories"

urlpatterns = [
    path("tree/", views.CategoryTreeView.as_view(), name="tree"),
    path("", views.CategoryListView.as_view(), name="list"),
    path("<int:category_id>/", views.CategoryDetailView.as_view(), name="detail"),
]
