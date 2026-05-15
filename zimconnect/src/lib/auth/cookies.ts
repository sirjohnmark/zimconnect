/**
 * Client-side cookie helpers.
 *
 * The session cookie (sanganai_session) and refresh token cookie
 * (sanganai_refresh) are now set SERVER-SIDE by /api/auth/session with
 * HttpOnly; Secure; SameSite=Strict flags.  JavaScript cannot read or write
 * them, which prevents XSS-based token theft.
 *
 * This file only exposes a helper to CLEAR the legacy client-visible
 * sanganai_session cookie on logout (for backward compatibility with any
 * browser that still holds an old cookie from before this change).
 */

export const COOKIE_NAME     = "sanganai_session";
export const SESSION_COOKIE  = "sanganai_session";

export interface SessionCookie {
  role: string;
}

// ─── Clear legacy cookie on logout (client-side) ──────────────────────────────

export function clearSessionCookie(): void {
  if (typeof window === "undefined") return;
  const secure = window.location.protocol === "https:";
  // Expire immediately, SameSite=Strict
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Strict${secure ? "; Secure" : ""}`;
}

// ─── INTENTIONALLY NOT EXPORTED: setSessionCookie ─────────────────────────────
// The session cookie is now set exclusively server-side via POST /api/auth/session
// so that it can carry HttpOnly + Secure flags. Never set it from JS.
