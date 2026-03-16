import { createClient } from "@/lib/supabase/server";
import { LISTINGS_PER_PAGE, CATEGORY_LISTINGS_PER_PAGE } from "@/lib/constants";
import type { Listing, ListingFilters, ListingWithDetails } from "@/types";

export async function getListings(
  filters?: ListingFilters
): Promise<{ listings: Listing[]; total: number }> {
  const supabase = await createClient();
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? LISTINGS_PER_PAGE;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("listings")
    .select("*", { count: "exact" })
    .eq("status", "active")
    .range(from, to);

  if (filters?.category_id) {
    query = query.eq("category_id", filters.category_id);
  }
  if (filters?.location) {
    query = query.eq("location", filters.location);
  }
  if (filters?.condition) {
    query = query.eq("condition", filters.condition);
  }
  if (filters?.min_price != null) {
    query = query.gte("price", filters.min_price);
  }
  if (filters?.max_price != null) {
    query = query.lte("price", filters.max_price);
  }
  if (filters?.query) {
    // Full-text search on search_vector when available; ilike fallback.
    query = query.ilike("title", `%${filters.query}%`);
  }

  switch (filters?.sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "price_asc":
      query = query.order("price", { ascending: true, nullsFirst: false });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false, nullsFirst: false });
      break;
    default:
      // newest first; featured listings float to top
      query = query
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[getListings]", error.message);
    return { listings: [], total: 0 };
  }
  return { listings: (data ?? []) as Listing[], total: count ?? 0 };
}

export async function getListingBySlug(
  slug: string
): Promise<ListingWithDetails | null> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("listings")
    .select(
      `*,
      listing_images(id, listing_id, storage_path, sort_order, is_primary),
      seller:profiles!user_id(id, username, display_name, avatar_url, location, phone, is_verified, listings_count),
      category:categories!category_id(id, name, slug, icon_url)`
    )
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error("[getListingBySlug]", error.message);
    return null;
  }
  if (!data) return null;

  // Increment view count asynchronously — never block the render.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  void (supabase as any).rpc("increment_listing_views", { listing_id: data.id });

  return data as ListingWithDetails;
}

export async function getListingsByUser(
  userId: string,
  status: "active" | "inactive" | "sold" | "all" = "active"
): Promise<Listing[]> {
  const supabase = await createClient();
  const page = 0;
  const from = page * LISTINGS_PER_PAGE;
  const to = from + LISTINGS_PER_PAGE - 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("listings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status !== "all") {
    query = query.eq("status", status);
  } else {
    // Exclude soft-deleted listings from the dashboard view.
    query = query.neq("status", "deleted");
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getListingsByUser]", error.message);
    return [];
  }
  return (data ?? []) as Listing[];
}

export async function getListingsByCategory(
  categoryId: string,
  page: number = 1
): Promise<{ listings: Listing[]; total: number }> {
  const supabase = await createClient();
  const from = (page - 1) * CATEGORY_LISTINGS_PER_PAGE;
  const to = from + CATEGORY_LISTINGS_PER_PAGE - 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error, count } = await (supabase as any)
    .from("listings")
    .select("*", { count: "exact" })
    .eq("category_id", categoryId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("[getListingsByCategory]", error.message);
    return { listings: [], total: 0 };
  }

  return {
    listings: (data ?? []) as Listing[],
    total: count ?? 0,
  };
}

export async function getListingById(id: string): Promise<Listing | null> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("listings")
    .select("*")
    .eq("id", id)
    .neq("status", "deleted")
    .maybeSingle();

  if (error) {
    console.error("[getListingById]", error.message);
    return null;
  }
  return data as Listing | null;
}

export async function getFeaturedListings(limit = 8): Promise<Listing[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("listings")
    .select("*")
    .eq("status", "active")
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getFeaturedListings]", error.message);
    return [];
  }
  return (data ?? []) as Listing[];
}

/** Top Deals — most-viewed active listings site-wide. */
export async function getTopDeals(limit = 6): Promise<Listing[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("listings")
    .select("*")
    .eq("status", "active")
    .order("views_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getTopDeals]", error.message);
    return [];
  }
  return (data ?? []) as Listing[];
}

export interface DashboardStats {
  total: number;
  active: number;
  inactive: number;
  sold: number;
  totalViews: number;
  topByViews: Array<{ title: string; views_count: number; slug: string }>;
}

/** Aggregate stats for the seller dashboard. */
export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("listings")
    .select("status, views_count, title, slug")
    .eq("user_id", userId)
    .neq("status", "deleted")
    .order("views_count", { ascending: false });

  const rows = (data ?? []) as Array<{ status: string; views_count: number; title: string; slug: string }>;

  return {
    total: rows.length,
    active: rows.filter((r) => r.status === "active").length,
    inactive: rows.filter((r) => r.status === "inactive").length,
    sold: rows.filter((r) => r.status === "sold").length,
    totalViews: rows.reduce((sum, r) => sum + (r.views_count ?? 0), 0),
    topByViews: rows.slice(0, 5).map((r) => ({
      title: r.title.length > 22 ? r.title.slice(0, 22) + "…" : r.title,
      views_count: r.views_count ?? 0,
      slug: r.slug,
    })),
  };
}
