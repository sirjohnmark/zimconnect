import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Session } from "@supabase/supabase-js";

/**
 * Returns the current session or null.
 * Safe to call from Server Components and Server Actions.
 */
export async function getSession(): Promise<Session | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session;
}

/**
 * Returns the session or redirects to /login.
 * Use at the top of any server component or action that requires auth.
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
