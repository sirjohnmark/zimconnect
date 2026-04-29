import type { AuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Role = "ADMIN" | "MODERATOR" | "SELLER" | "BUYER";

export type Permission =
  // Navigation / views
  | "view:messages"
  | "view:my-listings"
  | "view:orders"
  | "view:saved"
  | "view:admin-panel"
  // Listings actions
  | "manage:own-listings"    // create / edit / delete own listings
  | "moderate:listings"      // approve / reject / feature any listing
  // Admin actions
  | "manage:users"
  | "manage:categories";

// ─── Role → permission matrix ─────────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  ADMIN: new Set<Permission>([
    "view:messages",
    "view:my-listings",
    "view:orders",
    "view:saved",
    "view:admin-panel",
    "manage:own-listings",
    "moderate:listings",
    "manage:users",
    "manage:categories",
  ]),
  MODERATOR: new Set<Permission>([
    "view:messages",
    "view:my-listings",
    "view:orders",
    "view:admin-panel",
    "manage:own-listings",
    "moderate:listings",
    "manage:users",
    "manage:categories",
  ]),
  SELLER: new Set<Permission>([
    "view:messages",
    "view:my-listings",
    "view:orders",
    "manage:own-listings",
  ]),
  BUYER: new Set<Permission>([
    "view:messages",
    "view:orders",
    "view:saved",
  ]),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true when the given role has the requested permission. */
export function hasPermission(
  role: Role | string | undefined | null,
  permission: Permission,
): boolean {
  if (!role) return false;
  return (ROLE_PERMISSIONS[role as Role]?.has(permission)) ?? false;
}

/** Returns true when the user has the requested permission. */
export function can(user: AuthUser | null, permission: Permission): boolean {
  return hasPermission(user?.role, permission);
}

/**
 * Throws ApiError(403) if the user lacks the required permission.
 * Use this at the top of API functions to guard against unauthorized calls.
 *
 * @example
 *   export async function createListing(data: CreateListingPayload) {
 *     assertPermission(getStoredUser(), "manage:own-listings");
 *     return api.post("/api/v1/listings/", data);
 *   }
 */
export function assertPermission(
  user: AuthUser | null,
  permission: Permission,
): void {
  if (!can(user, permission)) {
    throw new ApiError(
      403,
      "Forbidden",
      "You do not have permission to perform this action.",
    );
  }
}
