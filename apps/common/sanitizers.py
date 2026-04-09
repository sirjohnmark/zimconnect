"""
Bleach-based text sanitisers for user-generated content.
"""

from __future__ import annotations

import re

import bleach


def sanitize_html(text: str) -> str:
    """
    Strip **all** HTML tags from *text*, returning plain text.

    Useful for fields that must never contain markup (titles, short descriptions).
    """
    if not text:
        return ""
    return bleach.clean(text, tags=[], attributes={}, strip=True).strip()


def sanitize_plain(text: str) -> str:
    """
    Strip all HTML tags **and** collapse consecutive whitespace into single spaces.

    Useful for search-indexed or display-only plain-text fields.
    """
    cleaned = sanitize_html(text)
    return re.sub(r"\s+", " ", cleaned).strip()
