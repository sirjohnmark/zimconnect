"""
URL routes for buyer-specific features.

Mounted at /api/v1/buyers/ by config/urls.py.
"""

from django.urls import path

from apps.listings import buyer_views

app_name = "buyers"

urlpatterns = [
    path("dashboard/", buyer_views.BuyerDashboardView.as_view(), name="dashboard"),
    path("saved/", buyer_views.SavedListingView.as_view(), name="saved-list"),
    path("saved/<int:listing_id>/", buyer_views.SavedListingDeleteView.as_view(), name="saved-delete"),
]
