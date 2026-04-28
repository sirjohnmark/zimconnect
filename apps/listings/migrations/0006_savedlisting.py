"""
Migration: add SavedListing model (buyer wishlist).
"""

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("listings", "0005_listing_deleted_at_listing_deleted_by_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="SavedListing",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("saved_at", models.DateTimeField(auto_now_add=True)),
                ("buyer", models.ForeignKey(
                    db_index=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="saved_listings",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("listing", models.ForeignKey(
                    db_index=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="saved_by",
                    to="listings.listing",
                )),
            ],
            options={
                "verbose_name": "saved listing",
                "verbose_name_plural": "saved listings",
                "db_table": "saved_listings",
                "ordering": ["-saved_at"],
            },
        ),
        migrations.AddConstraint(
            model_name="savedlisting",
            constraint=models.UniqueConstraint(fields=["buyer", "listing"], name="uq_saved_listing_buyer"),
        ),
        migrations.AddIndex(
            model_name="savedlisting",
            index=models.Index(fields=["buyer", "saved_at"], name="idx_saved_buyer_time"),
        ),
    ]
