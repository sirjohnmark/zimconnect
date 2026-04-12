"""
Enable the pg_trgm PostgreSQL extension for trigram similarity search.
"""

from django.contrib.postgres.operations import TrigramExtension
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("listings", "0002_listing_rejection_reason"),
    ]

    operations = [
        TrigramExtension(),
    ]
