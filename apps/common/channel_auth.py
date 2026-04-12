"""
JWT authentication middleware for Django Channels WebSocket connections.

Reads a ``token`` query-string parameter, validates it using SimpleJWT,
and attaches the authenticated user to ``scope["user"]``.

Usage in ASGI routing::

    from apps.common.channel_auth import JWTAuthMiddleware

    application = ProtocolTypeRouter({
        "websocket": JWTAuthMiddleware(URLRouter([...])),
    })
"""

from __future__ import annotations

import logging
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken

logger = logging.getLogger(__name__)

User = get_user_model()


@database_sync_to_async
def _get_user(user_id: int):
    """Fetch the user by PK; return AnonymousUser on any failure."""
    try:
        return User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Channels middleware that authenticates via a JWT ``?token=`` query param.

    If the token is missing, expired, or invalid the connection proceeds
    as ``AnonymousUser`` — the consumer is responsible for closing if
    authentication is required.
    """

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode("utf-8")
        params = parse_qs(query_string)
        token_list = params.get("token", [])

        if token_list:
            raw_token = token_list[0]
            try:
                validated = AccessToken(raw_token)
                scope["user"] = await _get_user(validated["user_id"])
            except (InvalidToken, TokenError, KeyError) as exc:
                logger.debug("WS auth failed: %s", exc)
                scope["user"] = AnonymousUser()
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)
