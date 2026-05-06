"use client";

import { usePublicGuard } from "@/lib/auth/usePublicGuard";

// Null-render component embedded in the (server) home page.
// Triggers usePublicGuard so that client-side navigation to /home
// redirects authenticated users to their dashboard without a full page load.
export function HomeAuthGuard() {
  usePublicGuard();
  return null;
}
