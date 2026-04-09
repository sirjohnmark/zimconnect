"""
Celery configuration for TRADLINKAPI.
"""

import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

app = Celery("tradlinkapi")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Sanity-check task for verifying Celery connectivity."""
    print(f"Request: {self.request!r}")
