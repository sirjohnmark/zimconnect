"use client";

/**
 * useRequireAuth — redirect to /login if the visitor is not authenticated.
 *
 * Usage (in any Client Component or page):
 *
 *   const { isLoading } = useRequireAuth();
 *   if (isLoading) return <Spinner />;
 *
 * Optionally pass a custom redirect path:
 *   useRequireAuth("/login?redirect=/dashboard/listings/create");
 *
 * To integrate with the backend later: no changes needed here —
 * AuthProvider already handles the session check.
 */

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./useAuth";

export function useRequireAuth(redirectTo?: string) {
  const { isLoading, isAuthenticated } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const destination = redirectTo ?? `/login?redirect=${encodeURIComponent(pathname)}`;
      router.replace(destination);
    }
  }, [isLoading, isAuthenticated, redirectTo, router, pathname]);

  return { isLoading, isAuthenticated };
}
