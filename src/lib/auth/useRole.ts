"use client";

import { useAuth } from "@/lib/auth/useAuth";
import { hasPermission } from "@/lib/auth/permissions";
import type { Permission, Role } from "@/lib/auth/permissions";

export interface UseRoleReturn {
  /** Raw role string from the auth user. Undefined while loading or unauthenticated. */
  role: Role | undefined;
  /** True while the session is being hydrated. */
  isLoading: boolean;
  isAdmin:     boolean;   // ADMIN only
  isModerator: boolean;   // MODERATOR only
  /** True for ADMIN or MODERATOR */
  isStaff:     boolean;
  isSeller:    boolean;
  isBuyer:     boolean;
  /** Returns true when the current user has the given permission. */
  can: (permission: Permission) => boolean;
}

export function useRole(): UseRoleReturn {
  const { user, isLoading } = useAuth();
  const role = user?.role as Role | undefined;

  return {
    role,
    isLoading,
    isAdmin:     role === "ADMIN",
    isModerator: role === "MODERATOR",
    isStaff:     role === "ADMIN" || role === "MODERATOR",
    isSeller:    role === "SELLER",
    isBuyer:     role === "BUYER",
    can: (permission) => hasPermission(role, permission),
  };
}
