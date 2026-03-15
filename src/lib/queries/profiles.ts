import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

export async function getProfileById(id: string): Promise<Profile | null> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[getProfileById]", error.message);
    return null;
  }
  return data as Profile | null;
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    console.error("[getProfileByUsername]", error.message);
    return null;
  }
  return data as Profile | null;
}
