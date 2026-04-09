"""
URL routes for the admin panel app.

All mounted under /api/admin/ by config/urls.py.
"""

from django.urls import path

from apps.adminpanel import views

app_name = "adminpanel"

urlpatterns = [
    # Dashboard
    path("dashboard/", views.DashboardView.as_view(), name="dashboard"),
    # User management
    path("users/", views.AdminUserListView.as_view(), name="user-list"),
    path("users/<int:user_id>/", views.AdminUserDetailView.as_view(), name="user-detail"),
    # Listing moderation
    path("listings/moderation/", views.ModerationListView.as_view(), name="moderation-list"),
    path("listings/moderation/<int:listing_id>/", views.ModerationDetailView.as_view(), name="moderation-detail"),
    path("listings/moderation/<int:listing_id>/approve/", views.ApproveListingView.as_view(), name="approve-listing"),
    path("listings/moderation/<int:listing_id>/reject/", views.RejectListingView.as_view(), name="reject-listing"),
]
