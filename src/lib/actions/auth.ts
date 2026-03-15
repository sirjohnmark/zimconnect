"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema, resetPasswordSchema } from "@/lib/validations/auth";
import type { ActionResult } from "@/types/auth";

// ---------------------------------------------------------------------------
// signUp
// ---------------------------------------------------------------------------
export async function signUp(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
    username: formData.get("username"),
    phone: formData.get("phone"),
    location: formData.get("location"),
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { email, password, username, phone, location } = parsed.data;
  const supabase = await createClient();

  // Check username uniqueness before attempting auth signup.
  // Cast required until `supabase gen types typescript` generates the real Database types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existing) {
    return { fieldErrors: { username: ["Username is already taken"] } };
  }

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "Signup failed. Please try again." };
  }

  // Insert the profile row.
  // Note: if email confirmation is enabled in Supabase, data.session will be
  // null here. A Postgres trigger (on auth.users insert) is the safest fallback
  // for that scenario. The insert below works when confirmation is disabled OR
  // when RLS allows the newly created (unconfirmed) user to insert their own row.
  // Cast required until `supabase gen types typescript` generates the real Database types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: profileError } = await (supabase as any).from("profiles").insert({
    id: data.user.id,
    username,
    display_name: username,
    phone: phone || null,
    location,
    is_verified: false,
    listings_count: 0,
  });

  if (profileError) {
    // Auth user was created — surface the error but don't block login.
    // The profile can be created on first dashboard visit.
    console.error("[signUp] profile insert failed:", profileError.message);
  }

  // If Supabase requires email confirmation, redirect to an info page instead.
  if (!data.session) {
    redirect("/signup/confirm");
  }

  redirect("/dashboard");
}

// ---------------------------------------------------------------------------
// signIn
// ---------------------------------------------------------------------------
export async function signIn(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { email, password } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Avoid leaking whether the email exists.
    return { error: "Invalid email or password." };
  }

  // Honor ?next= redirect from middleware.
  redirect("/dashboard");
}

// ---------------------------------------------------------------------------
// signOut
// ---------------------------------------------------------------------------
export async function signOut(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// ---------------------------------------------------------------------------
// resetPassword
// ---------------------------------------------------------------------------
export async function resetPassword(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = { email: formData.get("email") };
  const parsed = resetPasswordSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/settings/password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { message: "Check your email for a password reset link." };
}
