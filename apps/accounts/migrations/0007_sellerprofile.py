"""
Migration: add SellerProfile model.
"""

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0006_sellerupgraderequest"),
    ]

    operations = [
        migrations.CreateModel(
            name="SellerProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("shop_name", models.CharField(max_length=150)),
                ("shop_description", models.TextField(blank=True, default="", max_length=2000)),
                ("response_time_hours", models.PositiveSmallIntegerField(
                    blank=True,
                    help_text="Typical response time in hours. Set by the seller.",
                    null=True,
                )),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.OneToOneField(
                    db_index=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="seller_profile",
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                "verbose_name": "seller profile",
                "verbose_name_plural": "seller profiles",
                "db_table": "seller_profiles",
            },
        ),
    ]
