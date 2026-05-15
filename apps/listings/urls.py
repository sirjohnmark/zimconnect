"""
URL routes for the listings app.

All mounted under /api/v1/listings/ by config/urls.py.
"""

from django.urls import path

from apps.listings import views

app_name = "listings"

urlpatterns = [
    path("", views.ListingListCreateView.as_view(), name="list-create"),
    path("my/", views.MyListingsView.as_view(), name="my-listings"),
    path("<int:listing_id>/", views.ListingDetailView.as_view(), name="detail"),
    path("<int:listing_id>/publish/", views.ListingPublishView.as_view(), name="publish"),
    path("<int:listing_id>/upload-images/", views.ListingImageUploadView.as_view(), name="image-upload"),
    path("images/<int:image_id>/", views.ListingImageDeleteView.as_view(), name="image-delete"),
]
