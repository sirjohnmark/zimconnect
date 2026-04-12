"""
Celery tasks for the inbox app.
"""

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=30,
    ignore_result=True,
)
def send_new_message_notification(self, message_id: int) -> None:
    """
    Notify the recipient of a new message via email if they have unread
    messages and are not currently online.

    Scaffold: logs notification intent for now. Will send actual email
    when notification email templates are ready.
    """
    from apps.inbox.models import Message

    try:
        message = Message.objects.select_related(
            "sender", "conversation",
        ).get(pk=message_id)
    except Message.DoesNotExist:
        logger.error("send_new_message_notification: message %s not found", message_id)
        return

    # Determine the recipient (the participant who is NOT the sender)
    recipients = message.conversation.participants.exclude(pk=message.sender_id)
    if not recipients.exists():
        logger.warning(
            "send_new_message_notification: no recipients for message %s",
            message_id,
        )
        return

    recipient = recipients.first()

    # Check unread count for the recipient in this conversation
    unread = message.conversation.messages.filter(
        is_read=False,
    ).exclude(sender=recipient).count()

    logger.info(
        "send_new_message_notification: user %s has %d unread message(s) "
        "in conversation %s from %s. (Email notification scaffold — not sent yet)",
        recipient.email,
        unread,
        message.conversation_id,
        message.sender.username,
    )

    # TODO: When email templates are ready, send notification email:
    # from django.core.mail import send_mail
    # from django.template.loader import render_to_string
    # context = {
    #     "recipient_username": recipient.username,
    #     "sender_username": message.sender.username,
    #     "message_preview": message.content[:100],
    #     "unread_count": unread,
    # }
    # html_body = render_to_string("inbox/email/new_message.html", context)
    # text_body = render_to_string("inbox/email/new_message.txt", context)
    # send_mail(
    #     subject=f"New message from {message.sender.username} on Sanganai",
    #     message=text_body,
    #     from_email=None,
    #     recipient_list=[recipient.email],
    #     html_message=html_body,
    #     fail_silently=False,
    # )
