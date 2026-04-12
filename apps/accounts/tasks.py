"""
Celery tasks for the accounts app.
"""

import logging

from celery import shared_task
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)

User = get_user_model()


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=30,
    ignore_result=True,
)
def send_otp_task(self, user_id: int) -> None:
    """
    Async Celery task that sends a phone OTP to the given user.

    Keeps registration and resend responses fast by offloading
    SMS delivery to the background.
    """
    from apps.accounts.services import send_phone_otp

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        logger.error("send_otp_task: user %s not found", user_id)
        return

    try:
        send_phone_otp(user)
    except Exception as exc:
        logger.exception("send_otp_task failed for user %s", user_id)
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=30,
    ignore_result=True,
)
def send_email_otp_task(self, user_id: int) -> None:
    """
    Async Celery task that sends an email OTP to the given user.

    Keeps registration fast by offloading email delivery to the background.
    """
    from apps.accounts.services import send_email_otp

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        logger.error("send_email_otp_task: user %s not found", user_id)
        return

    try:
        send_email_otp(user)
    except Exception as exc:
        logger.exception("send_email_otp_task failed for user %s", user_id)
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=30,
    ignore_result=True,
)
def send_welcome_email(self, user_id: int) -> None:
    """
    Send a welcome email after user registration.

    Uses HTML + plaintext templates. In dev, the console email backend
    prints output to stdout.
    """
    from django.core.mail import send_mail
    from django.template.loader import render_to_string

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        logger.error("send_welcome_email: user %s not found", user_id)
        return

    try:
        context = {"username": user.username, "email": user.email}
        html_body = render_to_string("accounts/email/welcome.html", context)
        text_body = render_to_string("accounts/email/welcome.txt", context)

        send_mail(
            subject="Welcome to Sanganai!",
            message=text_body,
            from_email=None,  # uses DEFAULT_FROM_EMAIL
            recipient_list=[user.email],
            html_message=html_body,
            fail_silently=False,
        )
        logger.info("send_welcome_email: sent to user %s (%s)", user_id, user.email)
    except Exception as exc:
        logger.exception("send_welcome_email failed for user %s", user_id)
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=30,
    ignore_result=True,
)
def send_password_reset_email(self, user_id: int, reset_token: str) -> None:
    """
    Send password reset email with a secure token link.

    Scaffold — will be fully wired when the password reset flow is implemented.
    """
    from django.core.mail import send_mail
    from django.template.loader import render_to_string

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        logger.error("send_password_reset_email: user %s not found", user_id)
        return

    try:
        context = {
            "username": user.username,
            "reset_token": reset_token,
            # "reset_url" will be constructed from frontend URL + token in future
        }
        html_body = render_to_string("accounts/email/password_reset.html", context)
        text_body = render_to_string("accounts/email/password_reset.txt", context)

        send_mail(
            subject="Sanganai — Password Reset",
            message=text_body,
            from_email=None,
            recipient_list=[user.email],
            html_message=html_body,
            fail_silently=False,
        )
        logger.info("send_password_reset_email: sent to user %s", user_id)
    except Exception as exc:
        logger.exception("send_password_reset_email failed for user %s", user_id)
        raise self.retry(exc=exc)
