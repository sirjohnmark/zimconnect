"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";

export type AdminGuardStatus = "loading" | "allowed" | "denied";

/**
 * Enforces admin-only access at the React layer.
 * Redirects to /login when the user is unauthenticated or lacks an admin role.
 * Returns "loading" while the session is being restored.
 */
export function useAdminGuard(): AdminGuardStatus {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const isAdmin = user?.role === "ADMIN" || user?.role === "MODERATOR";

  useEffect(() => {
    if (isLoading) return;
    if (!user || !isAdmin) {
      router.replace("/login");
    }
  }, [isLoading, user, isAdmin, router]);

  if (isLoading) return "loading";
  if (!user || !isAdmin) return "denied";
  return "allowed";
}
