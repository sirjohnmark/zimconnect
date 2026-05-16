"""
Inbox v2 migration: upgrade Conversation, Message, add ConversationParticipant.

Changes:
- Conversation: add buyer, seller, created_by FKs; status, last_message_at fields; extra indexes.
- Message: add recipient FK, message_type, status, delivered_at, read_at, updated_at.
  Remove is_read (replaced by status).
- New model: ConversationParticipant (per-user metadata for read state, mute, archive).
- Data migration: copy is_read=True → status='read'.
"""

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


def migrate_is_read_to_status(apps, schema_editor):
    Message = apps.get_model("inbox", "Message")
    Message.objects.filter(is_read=True).update(status="read")


class Migration(migrations.Migration):

    dependencies = [
        ("inbox", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ── Conversation: new fields ──────────────────────────────────────
        migrations.AddField(
            model_name="conversation",
            name="buyer",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="buyer_conversations",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="conversation",
            name="seller",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="seller_conversations",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="conversation",
            name="created_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="created_conversations",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="conversation",
            name="status",
            field=models.CharField(
                choices=[
                    ("active", "Active"),
                    ("archived", "Archived"),
                    ("blocked", "Blocked"),
                    ("closed", "Closed"),
                ],
                db_index=True,
                default="active",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="conversation",
            name="last_message_at",
            field=models.DateTimeField(blank=True, db_index=True, null=True),
        ),
        # ── Message: new fields (before removing is_read) ─────────────────
        migrations.AddField(
            model_name="message",
            name="recipient",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="received_messages",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="message",
            name="message_type",
            field=models.CharField(
                choices=[("text", "Text"), ("image", "Image"), ("system", "System")],
                default="text",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="message",
            name="status",
            field=models.CharField(
                choices=[
                    ("sent", "Sent"),
                    ("delivered", "Delivered"),
                    ("read", "Read"),
                    ("failed", "Failed"),
                ],
                db_index=True,
                default="sent",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="message",
            name="delivered_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="message",
            name="read_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="message",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),
        # ── Data migration: is_read → status ──────────────────────────────
        migrations.RunPython(
            migrate_is_read_to_status,
            reverse_code=migrations.RunPython.noop,
        ),
        # ── Remove is_read ────────────────────────────────────────────────
        migrations.RemoveIndex(
            model_name="message",
            name="idx_msg_sender_read",
        ),
        migrations.RemoveField(
            model_name="message",
            name="is_read",
        ),
        # ── ConversationParticipant model ─────────────────────────────────
        migrations.CreateModel(
            name="ConversationParticipant",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "conversation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="conversation_participants",
                        to="inbox.conversation",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="conversation_participations",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "role",
                    models.CharField(
                        choices=[("buyer", "Buyer"), ("seller", "Seller"), ("admin", "Admin")],
                        default="buyer",
                        max_length=10,
                    ),
                ),
                (
                    "last_read_message",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to="inbox.message",
                    ),
                ),
                ("archived_at", models.DateTimeField(blank=True, null=True)),
                ("muted_at", models.DateTimeField(blank=True, null=True)),
                ("last_read_at", models.DateTimeField(blank=True, null=True)),
            ],
            options={
                "db_table": "conversation_participants",
            },
        ),
        migrations.AddConstraint(
            model_name="conversationparticipant",
            constraint=models.UniqueConstraint(
                fields=["conversation", "user"],
                name="uq_conv_participant",
            ),
        ),
        migrations.AddIndex(
            model_name="conversationparticipant",
            index=models.Index(fields=["user", "conversation"], name="idx_cp_user_conv"),
        ),
        # ── Conversation: extra indexes ───────────────────────────────────
        migrations.AddIndex(
            model_name="conversation",
            index=models.Index(
                fields=["listing", "buyer", "seller"],
                name="idx_conv_listing_buyer_seller",
            ),
        ),
        migrations.AddIndex(
            model_name="conversation",
            index=models.Index(fields=["buyer", "status"], name="idx_conv_buyer_status"),
        ),
        migrations.AddIndex(
            model_name="conversation",
            index=models.Index(fields=["seller", "status"], name="idx_conv_seller_status"),
        ),
        # ── Message: replace old index, add new ones ──────────────────────
        migrations.AddIndex(
            model_name="message",
            index=models.Index(fields=["sender", "status"], name="idx_msg_sender_status"),
        ),
        migrations.AddIndex(
            model_name="message",
            index=models.Index(fields=["recipient", "status"], name="idx_msg_recipient_status"),
        ),
        migrations.AddIndex(
            model_name="message",
            index=models.Index(
                fields=["conversation", "status"],
                name="idx_msg_conv_status",
            ),
        ),
    ]
