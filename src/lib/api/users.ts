import { api } from "./client";
import { getStoredUser } from "@/lib/auth/auth";
import { assertPermission } from "@/lib/auth/permissions";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: "BUYER" | "SELLER" | "ADMIN" | "MODERATOR";
  profile_picture: string | null;
  phone: string;
  bio: string;
  location: string;
  is_active: boolean;
  is_verified: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface GetUsersParams {
  page?: number;
  page_size?: number;
  search?: string;
  role?: string;
  is_active?: boolean;
}

export interface PaginatedUsers {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminUser[];
}

export interface UserUpdatePayload {
  is_active?: boolean;
  role?: "BUYER" | "SELLER" | "ADMIN" | "MODERATOR";
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

/** Admin: list all users with optional search, role, and active filters. */
export async function getUsers(params: GetUsersParams = {}): Promise<PaginatedUsers> {
  assertPermission(getStoredUser(), "manage:users");
  return api.get<PaginatedUsers>("/api/v1/admin/users/", {
    params: params as Record<string, string | number | boolean | undefined | null>,
  });
}

/** Admin: get a single user by ID. */
export async function getUserById(id: number): Promise<AdminUser> {
  assertPermission(getStoredUser(), "manage:users");
  return api.get<AdminUser>(`/api/v1/admin/users/${id}/`);
}

/** Admin: update a user's active status or role. */
export async function updateUserAdmin(id: number, data: UserUpdatePayload): Promise<AdminUser> {
  assertPermission(getStoredUser(), "manage:users");
  return api.patch<AdminUser>(`/api/v1/admin/users/${id}/`, data);
}

/** Admin: permanently delete a user account. */
export async function deleteUser(id: number): Promise<void> {
  assertPermission(getStoredUser(), "manage:users");
  await api.delete<void>(`/api/v1/admin/users/${id}/`);
}

// ─── Trash endpoints ──────────────────────────────────────────────────────────

export interface DeletedUser {
  id: number;
  email: string;
  username: string;
  role: string;
  is_active: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  listings_count: number;
  created_at: string;
}

export interface PaginatedDeletedUsers {
  count: number;
  next: string | null;
  previous: string | null;
  results: DeletedUser[];
}

/** Admin: list soft-deleted users. */
export async function getDeletedUsers(page = 1): Promise<PaginatedDeletedUsers> {
  assertPermission(getStoredUser(), "manage:users");
  return api.get<PaginatedDeletedUsers>("/api/v1/admin/users/deleted/", {
    params: { page },
  });
}
