/**
 * Strips non-digits and normalises to the Zimbabwe international format.
 * Rules (per CLAUDE.md):
 *   - Strip leading 0, prepend 263
 *   - If already starts with 263 keep as-is
 */
export function toZimbabweNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("263")) return digits;
  if (digits.startsWith("0")) return "263" + digits.slice(1);
  return "263" + digits;
}

/**
 * Builds a wa.me deep-link for the given phone number.
 * The pre-filled message references the listing title so buyers get context.
 */
export function buildWhatsAppUrl(phone: string, listingTitle: string): string {
  const number = toZimbabweNumber(phone);
  const text = encodeURIComponent(
    `Hi, I'm interested in your listing: "${listingTitle}". Is it still available?`
  );
  return `https://wa.me/${number}?text=${text}`;
}

/**
 * Returns a display-friendly phone string with the last 4 digits hidden.
 * e.g. "0771234567" → "+263 77 123 ****"
 */
export function maskPhone(phone: string): string {
  const zim = toZimbabweNumber(phone);
  const visible = zim.slice(0, -4);
  return `+${visible} ****`;
}

/**
 * Returns a display-friendly fully-revealed phone string.
 * e.g. "0771234567" → "+263 771 234 567"
 */
export function revealPhone(phone: string): string {
  const zim = toZimbabweNumber(phone);
  // Format: +263 XX XXX XXXX  (group after country code)
  const local = zim.slice(3); // strip 263
  if (local.length === 9) {
    return `+263 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
  }
  return `+${zim}`;
}
