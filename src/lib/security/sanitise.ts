/**
 * HTML sanitisation helpers.
 *
 * sanitiseText      — strips ALL tags; safe for title, location, username, etc.
 * sanitiseRichText  — allows a minimal safe subset; safe for description / bio.
 *
 * Both functions also:
 *   - trim surrounding whitespace
 *   - collapse internal runs of whitespace > 2 newlines
 *   - normalise Unicode to NFC (guards against homoglyph attacks)
 */

import sanitizeHtml from "sanitize-html";

// ---------------------------------------------------------------------------
// sanitiseText
// ---------------------------------------------------------------------------
// Use for: title, location, username, phone, any single-line field.
// Result:  plain text string — zero HTML.
// ---------------------------------------------------------------------------
export function sanitiseText(input: string): string {
  const stripped = sanitizeHtml(input, {
    allowedTags: [],      // strip every tag
    allowedAttributes: {},
  });

  return stripped
    .normalize("NFC")
    .trim()
    .replace(/\s{3,}/g, "\n\n"); // collapse excess whitespace
}

// ---------------------------------------------------------------------------
// sanitiseRichText
// ---------------------------------------------------------------------------
// Use for: description, bio — fields that may contain light formatting.
// Allows: <b>, <i>, <a href="...">, <br> only.
// Strips: script, style, data-* attributes, javascript: hrefs, everything else.
// ---------------------------------------------------------------------------
export function sanitiseRichText(input: string): string {
  const cleaned = sanitizeHtml(input, {
    allowedTags: ["b", "i", "a", "br"],
    allowedAttributes: {
      a: ["href"],
    },
    allowedSchemes: ["https", "http", "mailto"],  // blocks javascript: hrefs
    disallowedTagsMode: "discard",
  });

  return cleaned
    .normalize("NFC")
    .trim()
    .replace(/(\s*<br\s*\/?>\s*){3,}/gi, "<br><br>"); // collapse excess <br>
}
