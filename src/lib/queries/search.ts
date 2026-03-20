import { createClient } from "@/lib/supabase/server";
import { CATEGORY_LISTINGS_PER_PAGE } from "@/lib/constants";
import type { Listing } from "@/types";

export const SEARCH_PER_PAGE = CATEGORY_LISTINGS_PER_PAGE; // 12

/**
 * Sanitizes a user-supplied string for safe use with to_tsquery.
 *
 * to_tsquery is strict: passing raw user input will throw a Postgres error
 * on any special operator characters (&, |, !, <, >, :, ', (, )).
 * This function:
 *   1. Strips those characters
 *   2. Collapses whitespace
 *   3. Joins remaining words with the AND operator ( & )
 *
 * Returns an empty string if nothing useful remains — callers must handle
 * the empty case and fall back to a non-FTS query.
 */
export function sanitizeQuery(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/[&|!<>:()'*\\@]/g, " ") // strip to_tsquery special chars
    .replace(/\s+/g, " ")              // collapse whitespace
    .trim();

  if (!cleaned) return "";

  return cleaned
    .split(" ")
    .filter(Boolean)
    .join(" & ");
}

/**
 * Full-text search across the listings table using the pre-built
 * search_vector tsvector column (GIN-indexed on title + description).
 *
 * Equivalent SQL:
 *   SELECT * FROM listings
 *   WHERE search_vector @@ to_tsquery('english', $1)
 *     AND status = 'active'
 *   ORDER BY created_at DESC
 *   LIMIT 12 OFFSET (page - 1) * 12;
 *
 * @param query  Already-sanitized string in to_tsquery format, e.g. "iphone & 14"
 * @param page   1-based page number
 */
export async function searchListings(
  query: string,
  page: number = 1
): Promise<{ listings: Listing[]; total: number }> {
  const sanitized = sanitizeQuery(query);

  // Empty after sanitization — nothing useful to search.
  if (!sanitized) return { listings: [], total: 0 };

  const supabase = await createClient();
  const from = (page - 1) * SEARCH_PER_PAGE;
  const to = from + SEARCH_PER_PAGE - 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error, count } = await (supabase as any)
    .from("listings")
    .select("*", { count: "exact" })
    .textSearch("search_vector", sanitized, { config: "english" })
    .eq("status", "active")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("[searchListings]", error.message);
    return { listings: [], total: 0 };
  }

  // Deduplicate — safety net against any duplicate rows from the query
  const seen = new Set<string>();
  const unique = ((data ?? []) as Listing[]).filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  return { listings: unique, total: count ?? 0 };
}
