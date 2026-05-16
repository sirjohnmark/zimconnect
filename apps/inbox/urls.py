"""
URL routes for the inbox messaging app.

All mounted under /api/v1/inbox/ by config/urls.py.
"""

from django.urls import path

from apps.inbox import views

app_name = "inbox"

urlpatterns = [
    # Conversation list & start
    path("", views.ConversationListView.as_view(), name="conversation-list"),
    path("start/", views.StartConversationView.as_view(), name="conversation-start"),
    path("unread-count/", views.UnreadCountView.as_view(), name="unread-count"),

    # Conversation detail, messages, and actions
    path("<int:conversation_id>/", views.ConversationDetailView.as_view(), name="conversation-detail"),
    path("<int:conversation_id>/messages/", views.ConversationMessagesView.as_view(), name="conversation-messages"),
    path("<int:conversation_id>/send/", views.ConversationSendMessageView.as_view(), name="send-message"),
    path("<int:conversation_id>/read/", views.MarkConversationReadView.as_view(), name="conversation-read"),
    path("<int:conversation_id>/delivered/", views.MarkConversationDeliveredView.as_view(), name="conversation-delivered"),
    path("<int:conversation_id>/archive/", views.ArchiveConversationView.as_view(), name="conversation-archive"),

    # Single-message actions
    path("messages/<int:message_id>/mark-read/", views.MarkMessageReadView.as_view(), name="message-mark-read"),
    path("messages/<int:message_id>/delivered/", views.MarkMessageDeliveredView.as_view(), name="message-delivered"),
    path("messages/<int:message_id>/report/", views.ReportMessageView.as_view(), name="message-report"),
]
