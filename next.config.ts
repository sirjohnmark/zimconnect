import type { NextConfig } from "next";

// ─── Guards ───────────────────────────────────────────────────────────────────

const API_URL = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) throw new Error("BACKEND_URL or NEXT_PUBLIC_API_URL must be set");

// VULN-14: Prevent mock mode from ever being active in deployed production builds.
// Only enforced in CI/deployment environments — local `next build` runs may have
// NEXT_PUBLIC_USE_MOCK=true in .env.local (which overrides .env.production) and
// that is intentional for local testing.
const isDeployedBuild = Boolean(
  process.env.VERCEL || process.env.CI || process.env.RAILWAY_ENVIRONMENT,
);
if (isDeployedBuild && process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_USE_MOCK === "true") {
  throw new Error(
    "NEXT_PUBLIC_USE_MOCK must not be 'true' in production. " +
    "Set it to 'false' in your deployment environment variables.",
  );
}

// ─── Content-Security-Policy ──────────────────────────────────────────────────

const CSP = [
  "default-src 'self'",
  // Next.js requires 'unsafe-inline' and 'unsafe-eval' for its runtime
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://api.sanganai.co.zw https://picsum.photos https://via.placeholder.com",
  "font-src 'self'",
  "connect-src 'self' https://api.sanganai.co.zw wss://api.sanganai.co.zw",
  "media-src 'none'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy",            value: CSP },
  { key: "X-Content-Type-Options",             value: "nosniff" },
  { key: "X-Frame-Options",                    value: "DENY" },
  { key: "X-XSS-Protection",                   value: "1; mode=block" },
  { key: "Referrer-Policy",                    value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",                  value: "camera=(), microphone=(), geolocation=(), payment=()" },
  {
    key:   "Strict-Transport-Security",
    // 2 years, include subdomains, submit to preload list
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

// ─── Config ───────────────────────────────────────────────────────────────────

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Django uses trailing slashes; keep Vercel consistent so fetch() URLs with trailing
  // slashes are never redirected (which would cause opaqueredirect with redirect:"manual").
  trailingSlash: true,

  async headers() {
    return [
      {
        source:  "/(.*)",
        headers: SECURITY_HEADERS,
      },
    ];
  },

  async rewrites() {
    return [
      {
        // Scoped to /api/v1/ so internal Next.js routes at /api/auth/* are NOT proxied
        source:      "/api/v1/:path*",
        destination: `${API_URL}/api/v1/:path*`,
      },
      {
        source:      "/ws/:path*",
        destination: `${API_URL}/ws/:path*`,
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.sanganai.co.zw" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "via.placeholder.com" },
    ],
  },
};

export default nextConfig;
