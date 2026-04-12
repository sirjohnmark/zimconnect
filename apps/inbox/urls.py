"""
URL routes for the inbox messaging app.

All mounted under /api/v1/inbox/ by config/urls.py.
"""

from django.urls import path

from apps.inbox import views

app_name = "inbox"

urlpatterns = [
    path("", views.ConversationListCreateView.as_view(), name="conversation-list-create"),
    path("unread-count/", views.UnreadCountView.as_view(), name="unread-count"),
    path("<int:conversation_id>/", views.ConversationDetailView.as_view(), name="conversation-detail"),
    path("<int:conversation_id>/messages/", views.ConversationSendMessageView.as_view(), name="send-message"),
    path("messages/<int:message_id>/mark-read/", views.MarkReadView.as_view(), name="mark-read"),
]
