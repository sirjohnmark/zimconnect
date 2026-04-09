"""
Reusable validators for image uploads and phone numbers.
"""

from __future__ import annotations

import re

from django.core.exceptions import ValidationError


class ImageSizeValidator:
    """
    Reject files larger than *max_mb* megabytes.

    Usage:
        image = models.ImageField(validators=[ImageSizeValidator(max_mb=5)])
    """

    def __init__(self, max_mb: int = 5) -> None:
        self.max_mb = max_mb
        self.max_bytes = max_mb * 1024 * 1024

    def __call__(self, value) -> None:
        if value.size > self.max_bytes:
            raise ValidationError(
                f"Image size must not exceed {self.max_mb} MB. "
                f"Received {value.size / (1024 * 1024):.1f} MB.",
                code="image_too_large",
            )

    def __eq__(self, other):
        return isinstance(other, ImageSizeValidator) and self.max_mb == other.max_mb

    def deconstruct(self):
        return (
            f"{self.__class__.__module__}.{self.__class__.__qualname__}",
            [],
            {"max_mb": self.max_mb},
        )


class ImageContentTypeValidator:
    """
    Reject files whose content type is not in the allowed set.

    Usage:
        image = models.ImageField(
            validators=[ImageContentTypeValidator(allowed=["image/jpeg", "image/png", "image/webp"])]
        )
    """

    DEFAULT_ALLOWED = frozenset({
        "image/jpeg",
        "image/png",
        "image/webp",
    })

    def __init__(self, allowed: list[str] | None = None) -> None:
        self.allowed = frozenset(allowed) if allowed else self.DEFAULT_ALLOWED

    def __call__(self, value) -> None:
        content_type = getattr(value, "content_type", None)
        if content_type and content_type not in self.allowed:
            pretty = ", ".join(sorted(self.allowed))
            raise ValidationError(
                f"Unsupported image type '{content_type}'. Allowed: {pretty}.",
                code="invalid_content_type",
            )

    def __eq__(self, other):
        return isinstance(other, ImageContentTypeValidator) and self.allowed == other.allowed

    def deconstruct(self):
        return (
            f"{self.__class__.__module__}.{self.__class__.__qualname__}",
            [],
            {"allowed": sorted(self.allowed)},
        )


class ZimbabwePhoneValidator:
    """
    Validate E.164 Zimbabwe phone numbers: +263XXXXXXXXX (12 digits total).

    Accepts:
        +263771234567   (mobile)
        +263242123456   (landline)
    """

    E164_REGEX = re.compile(r"^\+263[1-9]\d{8,9}$")
    message = "Enter a valid Zimbabwe phone number in E.164 format (e.g. +263771234567)."
    code = "invalid_zw_phone"

    def __call__(self, value: str) -> None:
        if not self.E164_REGEX.match(value):
            raise ValidationError(self.message, code=self.code)

    def __eq__(self, other):
        return isinstance(other, ZimbabwePhoneValidator)

    def deconstruct(self):
        return (
            f"{self.__class__.__module__}.{self.__class__.__qualname__}",
            [],
            {},
        )
