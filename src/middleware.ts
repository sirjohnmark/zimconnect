import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/middleware";

// Paths that require an authenticated session.
// Pattern-matched against the full pathname.
const PROTECTED_ROUTES: RegExp[] = [
  /^\/dashboard(\/.*)?$/,
  /^\/sell(\/.*)?$/,
  /^\/listings\/[^/]+\/edit(\/.*)?$/,
  /^\/settings(\/.*)?$/,
];

function isProtected(pathname: string): boolean {
  return PROTECTED_ROUTES.some((re) => re.test(pathname));
}

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  // Refresh the session — this keeps the cookie alive between requests.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session && isProtected(request.nextUrl.pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on every path except Next.js internals and static assets.
     * The isProtected() check inside the handler does the real filtering.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
