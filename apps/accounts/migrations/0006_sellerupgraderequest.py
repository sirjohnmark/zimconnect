"""
Migration: add SellerUpgradeRequest model.
"""

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0005_user_password_reset_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name="SellerUpgradeRequest",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(
                    choices=[("PENDING", "Pending"), ("APPROVED", "Approved"), ("REJECTED", "Rejected")],
                    db_index=True,
                    default="PENDING",
                    max_length=20,
                )),
                ("business_name", models.CharField(max_length=150)),
                ("business_description", models.TextField(blank=True, default="", max_length=1000)),
                ("rejection_reason", models.TextField(blank=True, default="", max_length=1000)),
                ("requested_at", models.DateTimeField(auto_now_add=True)),
                ("reviewed_at", models.DateTimeField(blank=True, null=True)),
                ("user", models.ForeignKey(
                    db_index=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="seller_upgrade_requests",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("reviewed_by", models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="seller_requests_reviewed",
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                "verbose_name": "seller upgrade request",
                "verbose_name_plural": "seller upgrade requests",
                "db_table": "seller_upgrade_requests",
                "ordering": ["-requested_at"],
            },
        ),
        migrations.AddIndex(
            model_name="sellerupgraderequest",
            index=models.Index(fields=["user", "status"], name="sur_user_status_idx"),
        ),
    ]
