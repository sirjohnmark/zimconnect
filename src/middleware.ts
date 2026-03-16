import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/middleware";

// Paths that require an authenticated session.
const PROTECTED_ROUTES: RegExp[] = [
  /^\/dashboard(\/.*)?$/,
  /^\/sell(\/.*)?$/,
  /^\/listings\/[^/]+\/edit(\/.*)?$/,
  /^\/settings(\/.*)?$/,
  /^\/admin(\/.*)?$/,
];

// Paths that require role = 'admin'. Must be a subset of PROTECTED_ROUTES.
const ADMIN_ROUTES: RegExp[] = [/^\/admin(\/.*)?$/];

function isProtected(pathname: string): boolean {
  return PROTECTED_ROUTES.some((re) => re.test(pathname));
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some((re) => re.test(pathname));
}

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  // Refresh the session — keeps the cookie alive between requests.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // ── Unauthenticated guard ────────────────────────────────────────────────
  if (!session && isProtected(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Admin-only guard ─────────────────────────────────────────────────────
  if (session && isAdminRoute(pathname)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      return new NextResponse("Not found", { status: 404 });
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on every path except Next.js internals and static assets.
     * The guards inside the handler do the real filtering.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
