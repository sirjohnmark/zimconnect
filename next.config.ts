import type { NextConfig } from "next";

const API_URL = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) throw new Error("BACKEND_URL or NEXT_PUBLIC_API_URL must be set");

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Proxy /api/* → Django backend to avoid CORS in development and production
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        // Django requires trailing slashes; the rewrite appends "/" so browser
        // requests don't hit Django's APPEND_SLASH 301 redirect.
        destination: `${API_URL}/api/:path*/`,
      },
      {
        source: "/ws/:path*",
        destination: `${API_URL}/ws/:path*`,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.sanganai.co.zw",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
    ],
  },
};

export default nextConfig;
