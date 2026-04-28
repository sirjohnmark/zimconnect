"""
TRADLINKAPI URL Configuration.

API versioning
--------------
All API routes live under ``/api/v1/``.
The legacy ``/api/`` prefix returns a **301 redirect** to ``/api/v1/``
with a ``Deprecation`` header so existing clients upgrade gracefully.
"""

from django.conf import settings
from django.contrib import admin
from django.http import HttpResponsePermanentRedirect, JsonResponse
from django.urls import include, path, re_path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)


def api_root(request):
    return JsonResponse({
        "name": "Sanganai API",
        "version": "1.0.0",
        "endpoints": {
            "auth": "/api/v1/auth/",
            "categories": "/api/v1/categories/",
            "listings": "/api/v1/listings/",
            "buyers": "/api/v1/buyers/",
            "sellers": "/api/v1/sellers/",
            "inbox": "/api/v1/inbox/",
            "admin_panel": "/api/v1/admin/",
            "docs": "/api/v1/docs/",
            "redoc": "/api/v1/redoc/",
            "schema": "/api/v1/schema/",
            "websocket_chat": "ws://host/ws/chat/{conversation_id}/?token=JWT",
        },
    })


# ── Versioned API routes done ─────────────────────
v1_patterns = [
    path("auth/", include("apps.accounts.urls")),
    path("categories/", include("apps.categories.urls")),
    path("listings/", include("apps.listings.urls")),
    path("buyers/", include("apps.listings.buyer_urls")),
    path("sellers/", include("apps.accounts.seller_urls")),
    path("inbox/", include("apps.inbox.urls")),
    path("admin/", include("apps.adminpanel.urls")),
    # OpenAPI schema + docs
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="v1:schema"), name="swagger-ui"),
    path("redoc/", SpectacularRedocView.as_view(url_name="v1:schema"), name="redoc"),
]


# ── Deprecated /api/ → /api/v1/ redirect ─────
def _deprecated_api_redirect(request, rest_of_path=""):
    destination = f"/api/v1/{rest_of_path}"
    if request.META.get("QUERY_STRING"):
        destination = f"{destination}?{request.META['QUERY_STRING']}"
    response = HttpResponsePermanentRedirect(destination)
    response["Deprecation"] = "true"
    response["Sunset"] = "2026-10-01"
    response["Link"] = '</api/v1/>; rel="successor-version"'
    return response


urlpatterns = [
    path("", api_root, name="api-root"),
    path("admin/", admin.site.urls),
    # v1 API
    path("api/v1/", include((v1_patterns, "v1"))),
    # Deprecated /api/ redirect — explicitly excludes /api/v1/ to prevent infinite loop
    re_path(r"^api/(?!v1/)(?P<rest_of_path>.*)$", _deprecated_api_redirect, name="api-deprecated-redirect"),
]

# Debug toolbar URLs (dev only)
if settings.DEBUG:
    try:
        import debug_toolbar

        urlpatterns = [
            path("__debug__/", include(debug_toolbar.urls)),
        ] + urlpatterns
    except ImportError:
        pass

    # Serve media files in development
    from django.conf.urls.static import static

    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
