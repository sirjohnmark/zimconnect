import { createClient } from "@/lib/supabase/server";
import type { Listing, Profile } from "@/types";

export const ADMIN_PAGE_SIZE = 50;

// ─── Joined admin types ────────────────────────────────────────────────────

export interface AdminListing extends Listing {
  seller: { id: string; username: string; display_name: string } | null;
}

// ─── Queries ──────────────────────────────────────────────────────────────

/**
 * Returns ALL listings (every status) ordered newest-first.
 * Requires the calling session to have role = 'admin' — enforced by RLS.
 */
export async function getAllListings(
  page = 1
): Promise<{ listings: AdminListing[]; total: number }> {
  const supabase = await createClient();
  const from = (page - 1) * ADMIN_PAGE_SIZE;
  const to = from + ADMIN_PAGE_SIZE - 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error, count } = await (supabase as any)
    .from("listings")
    .select(
      "*, seller:profiles!user_id(id, username, display_name)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("[getAllListings]", error.message);
    return { listings: [], total: 0 };
  }

  return {
    listings: (data ?? []) as AdminListing[],
    total: count ?? 0,
  };
}

/**
 * Returns ALL user profiles ordered newest-first.
 * Requires the calling session to have role = 'admin' — enforced by RLS.
 */
export async function getAllUsers(
  page = 1
): Promise<{ users: Profile[]; total: number }> {
  const supabase = await createClient();
  const from = (page - 1) * ADMIN_PAGE_SIZE;
  const to = from + ADMIN_PAGE_SIZE - 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error, count } = await (supabase as any)
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("[getAllUsers]", error.message);
    return { users: [], total: 0 };
  }

  return {
    users: (data ?? []) as Profile[],
    total: count ?? 0,
  };
}
