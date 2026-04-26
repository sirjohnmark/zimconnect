/**
 * Auth cookie helpers — bridge between client-side auth and server-side middleware.
 *
 * Cookies are set alongside localStorage so middleware (which runs on the server)
 * can read them and protect routes before any HTML is sent.
 *
 * These are NOT httpOnly — they need to be writable from client-side JS.
 * The real security boundary is the Django backend which validates JWT tokens.
 */

const COOKIE_NAME = "sanganai_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days (matches typical JWT lifespan)

export interface SessionCookie {
  role: string;
}

function setCookie(name: string, value: string, maxAge: number): void {
  if (typeof window === "undefined") return;
  const secure = window.location.protocol === "https:";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${secure ? "; Secure" : ""}`;
}

function removeCookie(name: string): void {
  if (typeof window === "undefined") return;
  const secure = window.location.protocol === "https:";
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${secure ? "; Secure" : ""}`;
}

export function setSessionCookie(role: string): void {
  const payload: SessionCookie = { role };
  setCookie(COOKIE_NAME, btoa(JSON.stringify(payload)), COOKIE_MAX_AGE);
}

export function clearSessionCookie(): void {
  removeCookie(COOKIE_NAME);
}

/** Read session cookie (client-side only) */
export function getSessionCookie(): SessionCookie | null {
  if (typeof window === "undefined") return null;
  try {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`),
    );
    if (!match) return null;
    return JSON.parse(atob(decodeURIComponent(match[1]))) as SessionCookie;
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
