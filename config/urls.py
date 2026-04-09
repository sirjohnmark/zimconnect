"""
TRADLINKAPI URL Configuration.
"""

from django.conf import settings
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)


def api_root(request):
    return JsonResponse({
        "name": "ZimConnect API",
        "version": "1.0.0",
        "endpoints": {
            "auth": "/api/auth/",
            "categories": "/api/categories/",
            "listings": "/api/listings/",
            "inbox": "/api/inbox/",
            "admin_panel": "/api/admin/",
            "docs": "/api/docs/",
            "redoc": "/api/redoc/",
            "schema": "/api/schema/",
        },
    })


urlpatterns = [
    path("", api_root, name="api-root"),
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/categories/", include("apps.categories.urls")),
    path("api/listings/", include("apps.listings.urls")),
    path("api/inbox/", include("apps.inbox.urls")),
    path("api/admin/", include("apps.adminpanel.urls")),
    # OpenAPI schema + docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
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
