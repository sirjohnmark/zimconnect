"use server";

import { createClient } from "@/lib/supabase/server";
import { updateProfileSchema } from "@/lib/validations/profile";
import { sanitiseText, sanitiseRichText } from "@/lib/security/sanitise";
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

  // Sanitise before writing — display_name/location are plain text, bio allows light formatting.
  const sanitised = { ...parsed.data };
  if (sanitised.display_name) sanitised.display_name = sanitiseText(sanitised.display_name);
  if (sanitised.location)     sanitised.location     = sanitiseText(sanitised.location);
  if (sanitised.phone)        sanitised.phone        = sanitiseText(sanitised.phone);
  if (sanitised.bio)          sanitised.bio          = sanitiseRichText(sanitised.bio);

  // Only update fields that were submitted
  const updates = Object.fromEntries(
    Object.entries(sanitised).filter(([, v]) => v !== undefined)
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
