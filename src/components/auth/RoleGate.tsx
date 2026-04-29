"use client";

import { useRole } from "@/lib/auth/useRole";
import type { Permission, Role } from "@/lib/auth/permissions";

interface RoleGateProps {
  children: React.ReactNode;
  /**
   * Render children only when the user has this permission.
   * Takes precedence over `roles` when both are provided.
   */
  permission?: Permission;
  /** Render children only when the user has one of these roles. */
  roles?: Role[];
  /** Rendered when the gate denies access. Defaults to null (renders nothing). */
  fallback?: React.ReactNode;
}

/**
 * Conditionally renders children based on the current user's role/permissions.
 *
 * @example — permission-based:
 *   <RoleGate permission="manage:own-listings">
 *     <CreateListingButton />
 *   </RoleGate>
 *
 * @example — role-based with fallback:
 *   <RoleGate roles={["ADMIN", "MODERATOR"]} fallback={<p>Admin only</p>}>
 *     <AdminPanel />
 *   </RoleGate>
 */
export function RoleGate({
  children,
  permission,
  roles,
  fallback = null,
}: RoleGateProps) {
  const { role, isLoading, can } = useRole();

  // Don't flash content/fallback before we know the user's role
  if (isLoading) return null;

  let allowed: boolean;

  if (permission) {
    allowed = can(permission);
  } else if (roles) {
    allowed = role !== undefined && roles.includes(role);
  } else {
    // No constraint specified — gate only requires authentication
    allowed = role !== undefined;
  }

  return allowed ? <>{children}</> : <>{fallback}</>;
}
