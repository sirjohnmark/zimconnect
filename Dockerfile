# ── Stage 1: build dependencies ──────────────────────────────
FROM python:3.12-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential libpq-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /build

COPY requirements/ requirements/
RUN pip install --no-cache-dir --prefix=/install -r requirements/prod.txt

# ── Stage 2: runtime ─────────────────────────────────────────
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq5 && \
    rm -rf /var/lib/apt/lists/*

# Non-root user
RUN addgroup --system app && adduser --system --ingroup app app

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy project
COPY . .

# Collect static files (uses dummy SECRET_KEY, no DB needed)
RUN SECRET_KEY=build-placeholder \
    DATABASE_URL=sqlite:///tmp.db \
    DJANGO_SETTINGS_MODULE=config.settings.prod \
    ALLOWED_HOSTS=* \
    CORS_ALLOWED_ORIGINS=http://localhost \
    python manage.py collectstatic --noinput 2>/dev/null || true

# Make entrypoint executable
RUN chmod +x /app/docker-entrypoint.sh

# Switch to non-root
USER app

EXPOSE 8000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["server"]
