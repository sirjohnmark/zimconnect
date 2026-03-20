"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Records that the logged-in user visited a category page.
 * Uses the upsert_category_view RPC which atomically increments view_count
 * and refreshes last_viewed_at via ON CONFLICT DO UPDATE.
 *
 * Never throws — all errors are swallowed so the caller can fire-and-forget.
 */
export async function recordCategoryView(categoryId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return; // not logged in — nothing to record

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc("upsert_category_view", {
      p_user_id:     user.id,
      p_category_id: categoryId,
    });
  } catch {
    // Intentionally silent — browse tracking must never block navigation.
  }
}
