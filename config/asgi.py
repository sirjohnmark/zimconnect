"""
ASGI config for TRADLINKAPI.

Supports both HTTP (Django) and WebSocket (Channels) protocols.
WebSocket connections are authenticated via JWT query-string tokens.
"""

import os

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.prod")

# Initialise Django *before* importing anything that touches models.
django_asgi_app = get_asgi_application()

from apps.common.channel_auth import JWTAuthMiddleware  # noqa: E402
from apps.inbox.routing import websocket_urlpatterns  # noqa: E402

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddleware(
        URLRouter(websocket_urlpatterns),
    ),
})
