/**
 * Dashboard-specific queries.
 * All queries are paginated with .range() — no unbounded SELECTs.
 * Every export is safe to call independently in Promise.all() with individual try/catch.
 */

import { createClient } from "@/lib/supabase/server";
import type { Listing, Category } from "@/types";
import type { ConversationSummary } from "@/types/message";

// ---------------------------------------------------------------------------
// getActiveListingsSummary
// ---------------------------------------------------------------------------
// Returns aggregate stats + the 3 most recently created active listings.
// Caps the scan at 200 rows to avoid a full table read on power-sellers.
// ---------------------------------------------------------------------------

export interface ListingSummaryRow {
  title: string;
  slug: string;
  views_count: number;
  status: string;
  id: string;
}

export interface ActiveListingsSummary {
  total: number;
  active: number;
  inactive: number;
  sold: number;
  total_views: number;
  recent: ListingSummaryRow[];
}

export async function getActiveListingsSummary(
  userId: string
): Promise<ActiveListingsSummary> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("listings")
    .select("id, status, views_count, title, slug, created_at")
    .eq("user_id", userId)
    .neq("status", "deleted")
    .order("created_at", { ascending: false })
    .range(0, 199); // cap scan — enough for any realistic seller dashboard

  if (error) {
    console.error("[getActiveListingsSummary]", error.message);
    return { total: 0, active: 0, inactive: 0, sold: 0, total_views: 0, recent: [] };
  }

  const rows = (data ?? []) as Array<{
    id: string;
    status: string;
    views_count: number;
    title: string;
    slug: string;
    created_at: string;
  }>;

  const active   = rows.filter((r) => r.status === "active");
  const inactive = rows.filter((r) => r.status === "inactive");
  const sold     = rows.filter((r) => r.status === "sold");
  const total_views = rows.reduce((sum, r) => sum + (r.views_count ?? 0), 0);

  // 3 most recent active listings (rows already sorted newest-first)
  const recent: ListingSummaryRow[] = active.slice(0, 3).map((r) => ({
    id:          r.id,
    title:       r.title,
    slug:        r.slug,
    views_count: r.views_count ?? 0,
    status:      r.status,
  }));

  return {
    total:       rows.length,
    active:      active.length,
    inactive:    inactive.length,
    sold:        sold.length,
    total_views,
    recent,
  };
}

// ---------------------------------------------------------------------------
// getNearbyListings
// ---------------------------------------------------------------------------
// Returns up to 8 active listings in the same city as the user.
// Excludes the user's own listings.
// ---------------------------------------------------------------------------
export async function getNearbyListings(
  city: string,
  excludeUserId: string
): Promise<Listing[]> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("listings")
    .select("*")
    .eq("status", "active")
    .ilike("location", `%${city}%`)
    .neq("user_id", excludeUserId)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .range(0, 7);

  if (error) {
    console.error("[getNearbyListings]", error.message);
    return [];
  }

  return (data ?? []) as Listing[];
}

// ---------------------------------------------------------------------------
// getListingsInBrowsedCategories
// ---------------------------------------------------------------------------
// Fetches the user's 3 most recently browsed categories, then returns up to
// 4 active listings per category (capped at 12 total across all categories).
// ---------------------------------------------------------------------------

export interface BrowsedCategoryGroup {
  category: Category;
  listings: Listing[];
}

export async function getListingsInBrowsedCategories(
  userId: string
): Promise<BrowsedCategoryGroup[]> {
  const supabase = await createClient();

  // Step 1 — top 3 categories by recency
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cvRows, error: cvError } = await (supabase as any)
    .from("category_views")
    .select("category_id, last_viewed_at")
    .eq("user_id", userId)
    .order("last_viewed_at", { ascending: false })
    .range(0, 2);

  if (cvError || !cvRows?.length) return [];

  const categoryIds = (cvRows as { category_id: string }[]).map((r) => r.category_id);

  // Step 2 — fetch full category objects
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: catRows, error: catError } = await (supabase as any)
    .from("categories")
    .select("*")
    .in("id", categoryIds);

  if (catError || !catRows?.length) return [];

  // Preserve the browse-recency order from cvRows
  const catMap = new Map(
    (catRows as Array<{ id: string; name: string; slug: string; icon_url: string | null; description: string | null; parent_id: string | null; listings_count: number; sort_order: number; created_at: string }>).map(
      (c) => [c.id, c]
    )
  );

  const groups: BrowsedCategoryGroup[] = [];
  let totalListings = 0;

  for (const catId of categoryIds) {
    if (totalListings >= 12) break;

    const rawCat = catMap.get(catId);
    if (!rawCat) continue;

    const category: Category = {
      id:             rawCat.id,
      name:           rawCat.name,
      slug:           rawCat.slug,
      icon:           rawCat.icon_url,
      description:    rawCat.description,
      parent_id:      rawCat.parent_id,
      listings_count: rawCat.listings_count,
      sort_order:     rawCat.sort_order,
      created_at:     rawCat.created_at,
    };

    const limit = Math.min(4, 12 - totalListings);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: listRows, error: listError } = await (supabase as any)
      .from("listings")
      .select("*")
      .eq("category_id", catId)
      .eq("status", "active")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .range(0, limit - 1);

    if (listError) {
      console.error("[getListingsInBrowsedCategories] listings:", listError.message);
      continue;
    }

    const listings = (listRows ?? []) as Listing[];
    if (listings.length > 0) {
      groups.push({ category, listings });
      totalListings += listings.length;
    }
  }

  return groups;
}

// ---------------------------------------------------------------------------
// getInboxPreview
// ---------------------------------------------------------------------------
// Returns the 5 most recent conversations for the user plus a total unread count.
// Shape matches ConversationSummary so ConversationRow can render them directly.
// ---------------------------------------------------------------------------

export interface InboxPreview {
  conversations: ConversationSummary[];
  total_unread: number;
}

export async function getInboxPreview(userId: string): Promise<InboxPreview> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("conversations")
    .select(`
      id, listing_id, buyer_id, seller_id, created_at, updated_at,
      listing:listings!listing_id ( title, slug ),
      buyer:profiles!buyer_id ( id, username, display_name, avatar_url ),
      seller:profiles!seller_id ( id, username, display_name, avatar_url ),
      messages ( body, created_at, is_read, sender_id )
    `)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("updated_at", { ascending: false })
    .range(0, 4); // 5 conversations max

  if (error) {
    console.error("[getInboxPreview]", error.message);
    return { conversations: [], total_unread: 0 };
  }

  let total_unread = 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conversations: ConversationSummary[] = (data ?? []).map((row: any): ConversationSummary => {
    const isBuyer = row.buyer_id === userId;
    const other   = isBuyer ? row.seller : row.buyer;

    const msgs: { body: string; created_at: string; is_read: boolean; sender_id: string }[] =
      row.messages ?? [];

    const sorted = [...msgs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const last         = sorted[0] ?? null;
    const unread_count = msgs.filter((m) => !m.is_read && m.sender_id !== userId).length;
    total_unread      += unread_count;

    // Truncate last message body to 80 chars
    const lastBody = last?.body
      ? last.body.length > 80 ? last.body.slice(0, 77) + "…" : last.body
      : null;

    return {
      id:                       row.id,
      listing_id:               row.listing_id,
      buyer_id:                 row.buyer_id,
      seller_id:                row.seller_id,
      created_at:               row.created_at,
      updated_at:               row.updated_at,
      listing_title:            row.listing?.title  ?? null,
      listing_slug:             row.listing?.slug   ?? null,
      other_party_id:           other?.id           ?? "",
      other_party_username:     other?.username     ?? "unknown",
      other_party_display_name: other?.display_name ?? "Unknown",
      other_party_avatar_url:   other?.avatar_url   ?? null,
      last_message_body:        lastBody,
      last_message_at:          last?.created_at    ?? null,
      unread_count,
    };
  });

  return { conversations, total_unread };
}
