"""
WebSocket URL routing for the inbox app.

Mounted by config/asgi.py under the ``websocket`` protocol.
"""

from django.urls import path

from apps.inbox.consumers import ChatConsumer

websocket_urlpatterns = [
    path("ws/chat/<int:conversation_id>/", ChatConsumer.as_asgi()),
]
