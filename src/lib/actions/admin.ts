"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AdminModerationStatus } from "@/types";

// ─── Auth guard ────────────────────────────────────────────────────────────

async function assertAdmin(): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) throw new Error("Unauthorized");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") throw new Error("Forbidden: admin access required");
}

// ─── Actions ──────────────────────────────────────────────────────────────

const VALID_MODERATION_STATUSES: AdminModerationStatus[] = [
  "active",
  "inactive",
  "removed",
];

/**
 * Change a listing's status to active, inactive, or removed.
 * Caller must be an admin — verified against profiles.role before update.
 */
export async function moderateListing(
  formData: FormData
): Promise<{ error?: string }> {
  try {
    await assertAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const id = formData.get("id");
  const status = formData.get("status") as AdminModerationStatus | null;

  if (typeof id !== "string" || !id.trim()) {
    return { error: "Missing listing ID." };
  }
  if (!status || !VALID_MODERATION_STATUSES.includes(status)) {
    return { error: `Status must be one of: ${VALID_MODERATION_STATUSES.join(", ")}.` };
  }

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("listings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("[moderateListing]", error.message);
    return { error: error.message };
  }

  revalidatePath("/admin");
  return {};
}

/**
 * Suspend or unsuspend a user.
 * Expects formData fields: id (profile uuid), suspend ("true" | "false").
 * Caller must be an admin.
 */
export async function suspendUser(
  formData: FormData
): Promise<{ error?: string }> {
  try {
    await assertAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const id = formData.get("id");
  const suspendRaw = formData.get("suspend");

  if (typeof id !== "string" || !id.trim()) {
    return { error: "Missing user ID." };
  }
  if (suspendRaw !== "true" && suspendRaw !== "false") {
    return { error: "suspend must be 'true' or 'false'." };
  }

  const isSuspended = suspendRaw === "true";
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("profiles")
    .update({ is_suspended: isSuspended })
    .eq("id", id);

  if (error) {
    console.error("[suspendUser]", error.message);
    return { error: error.message };
  }

  revalidatePath("/admin");
  return {};
}
