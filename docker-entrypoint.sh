#!/bin/sh
set -e

# Run migrations
python manage.py migrate --noinput

case "$1" in
    server)
        # Daphne for ASGI (HTTP + WebSocket)
        exec daphne \
            -b 0.0.0.0 \
            -p 8000 \
            --proxy-headers \
            config.asgi:application
        ;;
    worker)
        exec celery -A config.celery worker \
            --loglevel=info \
            --concurrency="${CELERY_CONCURRENCY:-4}"
        ;;
    beat)
        exec celery -A config.celery beat \
            --loglevel=info \
            --scheduler django_celery_beat.schedulers:DatabaseScheduler
        ;;
    *)
        exec "$@"
        ;;
esac
