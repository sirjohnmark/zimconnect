"use server";

import { createClient } from "@/lib/supabase/server";
import { updateProfileSchema } from "@/lib/validations/profile";
import type { ActionResult } from "@/types/auth";

export async function updateProfile(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in to update your profile." };
  }

  const raw = {
    display_name: formData.get("display_name") || undefined,
    bio: formData.get("bio") || undefined,
    location: formData.get("location") || undefined,
    phone: formData.get("phone") || undefined,
  };

  const parsed = updateProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Only update fields that were submitted
  const updates = Object.fromEntries(
    Object.entries(parsed.data).filter(([, v]) => v !== undefined)
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { message: "Profile updated successfully." };
}
