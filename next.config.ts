import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      // Deterministic free photos — used in mock data (picsum.photos/seed/N/W/H)
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      // Legacy placeholder — keep until all mock data is updated
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      // Add your production storage hostname here when ready, e.g.:
      // { protocol: "https", hostname: "res.cloudinary.com" },
      // { protocol: "https", hostname: "your-s3-bucket.s3.amazonaws.com" },
    ],
  },
};

export default nextConfig;
