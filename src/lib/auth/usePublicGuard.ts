"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./useAuth";

// Symmetric counterpart to useAuthGuard: redirects already-authenticated users
// away from public-only routes (landing page, login, register) to their dashboard.
export function usePublicGuard() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    // Already on the verify-email page — don't redirect again or we'd loop.
    if (pathname.startsWith("/verify-email")) return;
    const isAdmin    = user?.role === "ADMIN" || user?.role === "MODERATOR";
    const isVerified = user?.is_verified || user?.email_verified;
    router.replace(!isAdmin && !isVerified ? "/verify-email" : "/dashboard");
  }, [isLoading, isAuthenticated, user, router, pathname]);

  return { isLoading, isAuthenticated };
}
