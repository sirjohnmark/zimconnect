import { NextResponse, type NextRequest } from "next/server";

// ─── Route definitions ────────────────────────────────────────────────────────

const DASHBOARD_PREFIX = "/dashboard";
const ADMIN_ROUTES     = [
  "/dashboard/admin",
  "/dashboard/categories",
  "/dashboard/admin-listings",
  "/dashboard/users",
];
const AUTH_ROUTES      = ["/login", "/register", "/forgot-password"];

// ─── Cookie names ─────────────────────────────────────────────────────────────

const SESSION_COOKIE  = "sanganai_session";
const REFRESH_COOKIE  = "sanganai_refresh";

// ─── HMAC session verification (Edge-compatible Web Crypto API) ───────────────

async function verifySessionCookie(
  cookieValue: string,
  secret: string,
): Promise<{ role: string } | null> {
  const dotIdx = cookieValue.lastIndexOf(".");
  if (dotIdx === -1) return null;

  const payloadB64url = cookieValue.slice(0, dotIdx);
  const sigB64url     = cookieValue.slice(dotIdx + 1);

  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
  } catch {
    return null;
  }

  // Convert base64url → Uint8Array
  const b64  = sigB64url.replace(/-/g, "+").replace(/_/g, "/");
  const sigBytes = Uint8Array.from(
    atob(b64.padEnd(b64.length + (4 - (b64.length % 4)) % 4, "=")),
    (c) => c.charCodeAt(0),
  );

  const payloadBytes = new TextEncoder().encode(payloadB64url);
  const valid = await crypto.subtle.verify("HMAC", key, sigBytes, payloadBytes);
  if (!valid) return null;

  try {
    const decoded = atob(
      payloadB64url.replace(/-/g, "+").replace(/_/g, "/").padEnd(
        payloadB64url.length + (4 - (payloadB64url.length % 4)) % 4, "=",
      ),
    );
    return JSON.parse(decoded) as { role: string };
  } catch {
    return null;
  }
}

// ─── Open-redirect guard ──────────────────────────────────────────────────────
// Only allow same-origin relative paths; reject absolute URLs and //host paths.

function safeRedirectPath(raw: string | null): string {
  if (!raw) return "/dashboard";
  if (raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("://")) return raw;
  return "/dashboard";
}

function isAdmin(role: string): boolean {
  return role === "ADMIN" || role === "MODERATOR";
}

// ─── Middleware ────────────────────────────────────────────────────────────────

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const secret        = process.env.SESSION_SECRET ?? "";
  const sessionValue  = req.cookies.get(SESSION_COOKIE)?.value;
  const hasRefresh    = Boolean(req.cookies.get(REFRESH_COOKIE)?.value);

  // Verify HMAC signature — reject forged/tampered cookies
  const session = sessionValue && secret
    ? await verifySessionCookie(sessionValue, secret)
    : null;

  // A user is authenticated if they have a valid signed session cookie
  // OR a refresh token cookie (new-login case where session might lag one request)
  const isAuthenticated = session !== null || hasRefresh;

  // 1. Protect dashboard routes
  if (pathname.startsWith(DASHBOARD_PREFIX)) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Protect admin routes — require verified HMAC role
    if (ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
      if (!session || !isAdmin(session.role)) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  }

  // 3. Redirect authenticated users away from auth pages (open-redirect fix)
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    if (isAuthenticated) {
      const rawRedirect = req.nextUrl.searchParams.get("redirect");
      const redirectTo  = safeRedirectPath(rawRedirect);
      return NextResponse.redirect(new URL(redirectTo, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|api|ws|favicon\\.ico|.*\\.svg$|.*\\.png$|.*\\.jpg$).*)",
  ],
};
