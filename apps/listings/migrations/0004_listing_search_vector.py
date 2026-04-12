"""
Add search_vector (SearchVectorField) to Listing with GIN index,
and backfill existing rows.
"""

from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import SearchVectorField
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("listings", "0003_enable_pg_trgm"),
    ]

    operations = [
        migrations.AddField(
            model_name="listing",
            name="search_vector",
            field=SearchVectorField(null=True),
        ),
        migrations.AddIndex(
            model_name="listing",
            index=GinIndex(fields=["search_vector"], name="listing_search_vector_idx"),
        ),
        # Backfill search_vector for existing rows
        migrations.RunSQL(
            sql="""
                UPDATE listings
                SET search_vector =
                    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
                    setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
                    setweight(to_tsvector('english', COALESCE(location, '')), 'C');
            """,
            reverse_sql="""
                UPDATE listings SET search_vector = NULL;
            """,
        ),
    ]
