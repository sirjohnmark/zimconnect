import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      // Placeholder images used in mock data
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
