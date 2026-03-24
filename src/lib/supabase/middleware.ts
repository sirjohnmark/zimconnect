import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types";

export function createClient(request: NextRequest) {
  // Start with a response we can mutate cookies on.
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write cookies onto the outgoing request so Server Components see them.
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          // Re-create the response so it carries the refreshed cookies.
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  return { supabase, response };
}
