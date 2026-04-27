/**
 * POST /api/auth/refresh
 *
 * Reads the HttpOnly sanganai_refresh cookie, exchanges it with Django for a
 * new access token, and returns { access } to the client.
 * If Django rotates the refresh token the new one is re-set in the HttpOnly cookie.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createHmac } from "crypto";

const BACKEND_URL    = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";
const REFRESH_COOKIE = "sanganai_refresh";
const SESSION_COOKIE = "sanganai_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET env var is required");
}

function signPayload(payload: object, secret: string): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig  = createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

const COOKIE_BASE = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path:     "/",
};

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  let djangoRes: Response;
  try {
    djangoRes = await fetch(`${BACKEND_URL}/api/v1/auth/token/refresh/`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ refresh: refreshToken }),
      signal:  AbortSignal.timeout(10_000),
    });
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 503 });
  }

  if (!djangoRes.ok) {
    const res = NextResponse.json({ error: "Session expired" }, { status: 401 });
    res.cookies.set(REFRESH_COOKIE, "", { ...COOKIE_BASE, maxAge: 0 });
    res.cookies.set(SESSION_COOKIE, "", { ...COOKIE_BASE, maxAge: 0 });
    return res;
  }

  const data = await djangoRes.json() as { access: string; refresh?: string };
  const res  = NextResponse.json({ access: data.access });

  // If Django rotated the refresh token, store the new one
  if (data.refresh) {
    res.cookies.set(REFRESH_COOKIE, data.refresh, { ...COOKIE_BASE, maxAge: COOKIE_MAX_AGE });
    // Re-sign session cookie — role is unchanged but expiry extends
    const signedSession = signPayload({ role: "BUYER" }, SESSION_SECRET!);
    res.cookies.set(SESSION_COOKIE, signedSession, { ...COOKIE_BASE, maxAge: COOKIE_MAX_AGE });
  }

  return res;
}
