import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, type SessionCookie } from "@/lib/auth/cookies";

// ─── Route definitions ────────────────────────────────────────────────────────

const DASHBOARD_PREFIX = "/dashboard";
const ADMIN_ROUTES = ["/dashboard/categories"];
const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function parseSessionCookie(req: NextRequest): SessionCookie | null {
  try {
    const raw = req.cookies.get(COOKIE_NAME)?.value;
    if (!raw) return null;
    return JSON.parse(atob(decodeURIComponent(raw))) as SessionCookie;
  } catch {
    return null;
  }
}

function isAdmin(role: string): boolean {
  return role === "ADMIN" || role === "MODERATOR";
}

// ─── Middleware ────────────────────────────────────────────────────────────────

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = parseSessionCookie(req);
  const isAuthenticated = session !== null;

  // 1. Protect dashboard routes — require authentication
  if (pathname.startsWith(DASHBOARD_PREFIX)) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Protect admin routes — require ADMIN or MODERATOR role
    if (ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
      if (!isAdmin(session.role)) {
        // Non-admin user trying to access admin route — redirect to dashboard
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  }

  // 3. Redirect authenticated users away from auth pages
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    if (isAuthenticated) {
      const redirectTo = req.nextUrl.searchParams.get("redirect") ?? "/dashboard";
      return NextResponse.redirect(new URL(redirectTo, req.url));
    }
  }

  return NextResponse.next();
}

// ─── Matcher — only run on page routes, exclude static assets ─────────────────

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (svg, png, etc.)
     * - api routes (proxied to backend)
     */
    "/((?!_next|api|ws|favicon\\.ico|.*\\.svg$|.*\\.png$|.*\\.jpg$).*)",
  ],
};
