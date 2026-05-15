/**
 * POST  /api/auth/session  — store refresh token in HttpOnly cookie + signed session cookie
 * DELETE /api/auth/session  — clear both cookies on logout
 *
 * Runs in Node.js runtime so we can use the built-in 'crypto' module for HMAC signing.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createHmac } from "crypto";

const REFRESH_COOKIE  = "sanganai_refresh";
const SESSION_COOKIE  = "sanganai_session";
const COOKIE_MAX_AGE  = 60 * 60 * 24 * 7; // 7 days

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET env var is required. Add it to .env.local and .env.production");
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
  let body: { refresh?: string; role?: string };
  try {
    body = await req.json() as { refresh?: string; role?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { refresh, role } = body;
  if (!refresh || typeof refresh !== "string" || !role || typeof role !== "string") {
    return NextResponse.json({ error: "refresh and role are required" }, { status: 400 });
  }

  const signedSession = signPayload({ role }, SESSION_SECRET!);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(REFRESH_COOKIE, refresh, { ...COOKIE_BASE, maxAge: COOKIE_MAX_AGE });
  res.cookies.set(SESSION_COOKIE, signedSession, { ...COOKIE_BASE, maxAge: COOKIE_MAX_AGE });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(REFRESH_COOKIE, "", { ...COOKIE_BASE, maxAge: 0 });
  res.cookies.set(SESSION_COOKIE, "", { ...COOKIE_BASE, maxAge: 0 });
  return res;
}
