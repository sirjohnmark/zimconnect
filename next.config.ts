import type { NextConfig } from "next";

// ---------------------------------------------------------------------------
// Content Security Policy
// Adjust connect-src / script-src when adding analytics or payment SDKs.
// Keep 'unsafe-inline' until nonce-based CSP is implemented via middleware.
// ---------------------------------------------------------------------------
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://*.supabase.co https://*.supabase.in",
  "connect-src 'self' https://*.supabase.co https://*.supabase.in",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options",           value: "DENY" },
  { key: "X-Content-Type-Options",    value: "nosniff" },
  { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy",   value: CSP },
  // Uncomment once confirmed HTTPS-only on production:
  // { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",  // every route including API + _next/static
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
