export const SAFE_REDIRECT_PREFIXES = ["/dashboard", "/verify-email"] as const;

export function safeRedirectPath(raw: string | null): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) return "/dashboard";
  if (SAFE_REDIRECT_PREFIXES.some((p) => raw.startsWith(p))) return raw;
  return "/dashboard";
}
