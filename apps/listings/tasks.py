"""
Celery tasks for the listings app.
"""

import io
import logging

from celery import shared_task
from django.contrib.postgres.search import SearchVector
from django.core.files.base import ContentFile
from django.db import transaction
from django.db.models import F
from django.utils import timezone

logger = logging.getLogger(__name__)

IMAGE_MAX_WIDTH = 1920
THUMBNAIL_SIZE = (400, 300)
LISTING_EXPIRY_DAYS = 90


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    ignore_result=True,
)
def process_listing_images(self, listing_id: int) -> None:
    """
    Process all images for a listing: resize to max 1920px width,
    create a thumbnail at 400x300, convert to WebP, and update the record.
    """
    from PIL import Image

    from apps.listings.models import ListingImage

    images = ListingImage.objects.filter(listing_id=listing_id)
    if not images.exists():
        logger.info("process_listing_images: no images for listing %s", listing_id)
        return

    try:
        for listing_image in images:
            if not listing_image.image:
                continue

            try:
                listing_image.image.open()
                img = Image.open(listing_image.image)
                img = img.convert("RGB")
            except Exception:
                logger.warning(
                    "process_listing_images: cannot open image %s",
                    listing_image.pk,
                )
                continue

            # ── Resize to max width ──────────────────────
            if img.width > IMAGE_MAX_WIDTH:
                ratio = IMAGE_MAX_WIDTH / img.width
                new_height = int(img.height * ratio)
                img = img.resize((IMAGE_MAX_WIDTH, new_height), Image.LANCZOS)

            # ── Save main image as WebP ──────────────────
            buffer = io.BytesIO()
            img.save(buffer, format="WEBP", quality=85)
            buffer.seek(0)

            original_name = listing_image.image.name.rsplit("/", 1)[-1]
            webp_name = original_name.rsplit(".", 1)[0] + ".webp"

            listing_image.image.delete(save=False)
            listing_image.image.save(webp_name, ContentFile(buffer.read()), save=False)

            # ── Create thumbnail ─────────────────────────
            thumb = img.copy()
            thumb.thumbnail(THUMBNAIL_SIZE, Image.LANCZOS)
            thumb_buffer = io.BytesIO()
            thumb.save(thumb_buffer, format="WEBP", quality=80)
            thumb_buffer.seek(0)

            thumb_name = f"thumb_{webp_name}"
            if hasattr(listing_image, "thumbnail"):
                listing_image.thumbnail.save(
                    thumb_name, ContentFile(thumb_buffer.read()), save=False,
                )
            # If no thumbnail field exists yet, save as a convention alongside
            # the main image. The thumbnail field can be added later.

            listing_image.save()
            logger.info(
                "process_listing_images: processed image %s → %s",
                listing_image.pk,
                webp_name,
            )
    except Exception as exc:
        logger.exception("process_listing_images failed for listing %s", listing_id)
        raise self.retry(exc=exc)


@shared_task(ignore_result=True)
def expire_old_listings() -> None:
    """
    Periodic task (daily at 2 AM Africa/Harare): find ACTIVE listings
    older than 90 days since publication and set status to ARCHIVED.
    """
    from apps.common.constants import ListingStatus
    from apps.listings.models import Listing

    cutoff = timezone.now() - timezone.timedelta(days=LISTING_EXPIRY_DAYS)
    expired = Listing.objects.filter(
        status=ListingStatus.ACTIVE,
        published_at__lte=cutoff,
    )

    count = expired.update(status=ListingStatus.ARCHIVED)
    if count:
        logger.info("expire_old_listings: archived %d listings older than %d days", count, LISTING_EXPIRY_DAYS)


@shared_task(ignore_result=True)
def update_listing_view_count(listing_id: int, count: int) -> None:
    """
    Increment a listing's views_count by *count* in a single DB write.
    Called from flush_listing_view_counts to batch Redis-accumulated views.
    """
    from apps.listings.models import Listing

    Listing.objects.filter(pk=listing_id).update(views_count=F("views_count") + count)


@shared_task(ignore_result=True)
def flush_listing_view_counts() -> None:
    """
    Periodic task (every 5 minutes): read accumulated view counts from
    Redis and flush them to the DB in batched updates.
    """
    from apps.common.cache import CacheKeys

    try:
        from django_redis import get_redis_connection

        redis = get_redis_connection("default")
    except Exception:
        # Redis not available (dev without Redis) — silently skip
        logger.debug("flush_listing_view_counts: Redis not available, skipping")
        return

    pattern = f"*{CacheKeys.LISTING_VIEWS_PREFIX}*"
    keys = list(redis.scan_iter(match=pattern, count=500))

    if not keys:
        return

    pipe = redis.pipeline()
    for key in keys:
        pipe.getset(key, 0)
    values = pipe.execute()

    flushed = 0
    for key, raw_count in zip(keys, values):
        if not raw_count:
            continue
        count = int(raw_count)
        if count <= 0:
            continue
        # key format: b"listing_views:<listing_id>"
        listing_id = int(key.decode().split(":")[-1])
        update_listing_view_count.delay(listing_id, count)
        flushed += 1

    if flushed:
        logger.info("flush_listing_view_counts: flushed %d listings", flushed)


@shared_task(ignore_result=True)
def rebuild_search_vectors() -> None:
    """
    Backfill / rebuild search_vector for ALL listings.

    Run manually or via management command after schema changes
    or bulk imports:  rebuild_search_vectors.delay()
    """
    from apps.listings.models import Listing

    updated = Listing.all_objects.update(
        search_vector=(
            SearchVector("title", weight="A")
            + SearchVector("description", weight="B")
            + SearchVector("location", weight="C")
        ),
    )
    logger.info("rebuild_search_vectors: updated %d listings", updated)


def increment_view_count(listing_id: int) -> None:
    """
    Accumulate a view count in Redis. Called synchronously from the view layer.
    Falls back to direct DB increment if Redis is unavailable.
    """
    from apps.common.cache import CacheKeys

    try:
        from django_redis import get_redis_connection

        redis = get_redis_connection("default")
        redis.incr(f"{CacheKeys.LISTING_VIEWS_PREFIX}{listing_id}")
    except Exception:
        # Fallback: direct DB write (acceptable in dev / low-traffic)
        from apps.listings.models import Listing

        Listing.objects.filter(pk=listing_id).update(views_count=F("views_count") + 1)
