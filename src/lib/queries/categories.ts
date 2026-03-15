import { createClient } from "@/lib/supabase/server";
import { STATIC_CATEGORIES } from "@/lib/constants/categories";
import type { Category } from "@/types";

// DB rows have icon_url; our Category type uses icon. Map on the way out.
function mapRow(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string | null) ?? null,
    icon: (row.icon_url as string | null) ?? null,
    parent_id: (row.parent_id as string | null) ?? null,
    listings_count: (row.listings_count as number) ?? 0,
    sort_order: (row.sort_order as number) ?? 0,
    created_at: (row.created_at as string) ?? "",
  };
}

function staticFallback(): Category[] {
  return STATIC_CATEGORIES.map((c) => ({
    id: c.slug, // placeholder until real IDs exist
    name: c.name,
    slug: c.slug,
    description: null,
    icon: c.icon,
    parent_id: null,
    listings_count: 0,
    sort_order: c.sort_order,
    created_at: "",
  }));
}

export async function getAllCategories(): Promise<Category[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[getAllCategories]", error.message);
    return staticFallback();
  }

  return ((data as Record<string, unknown>[]) ?? []).map(mapRow);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[getCategoryBySlug]", error.message);
    const found = STATIC_CATEGORIES.find((c) => c.slug === slug);
    if (!found) return null;
    return {
      id: found.slug,
      name: found.name,
      slug: found.slug,
      description: null,
      icon: found.icon,
      parent_id: null,
      listings_count: 0,
      sort_order: found.sort_order,
      created_at: "",
    };
  }

  if (!data) return null;
  return mapRow(data as Record<string, unknown>);
}
