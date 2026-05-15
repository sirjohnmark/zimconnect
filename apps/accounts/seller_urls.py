"""
URL routes for seller-specific features.

Mounted at /api/v1/sellers/ by config/urls.py.

IMPORTANT — order matters: 'me/' must come before '<str:username>/' so the
literal 'me' is not consumed as a username lookup.
"""

from django.urls import path

from apps.accounts import seller_views

app_name = "sellers"

urlpatterns = [
    path("apply/", seller_views.SellerApplyView.as_view(), name="apply"),
    path("application-status/", seller_views.SellerApplicationStatusView.as_view(), name="application-status"),
    path("dashboard/", seller_views.SellerDashboardView.as_view(), name="dashboard"),
    path("listings/", seller_views.SellerListingsView.as_view(), name="listings"),
    path("me/", seller_views.SellerMeView.as_view(), name="me"),
    path("<str:username>/", seller_views.SellerPublicView.as_view(), name="public-profile"),
]
