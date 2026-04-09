"""
Celery configuration for TRADLINKAPI.
"""

import os

from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

app = Celery("tradlinkapi")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

app.conf.beat_schedule = {
    "expire-old-listings-daily": {
        "task": "apps.listings.tasks.expire_old_listings",
        "schedule": crontab(hour=2, minute=0),  # 2:00 AM Africa/Harare (from CELERY_TIMEZONE)
    },
    "flush-listing-views": {
        "task": "apps.listings.tasks.flush_listing_view_counts",
        "schedule": 300.0,  # every 5 minutes
    },
}


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Sanity-check task for verifying Celery connectivity."""
    print(f"Request: {self.request!r}")
