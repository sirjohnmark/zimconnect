// TODO: implement — browser-side Supabase client (anon key only)
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types";

export function createClient() {
  // TODO: implement
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
