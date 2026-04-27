"use client";

import { useAuthContext } from "./AuthProvider";
import type { AuthState } from "./AuthProvider";
import type { AuthUser, LoginResponse } from "@/lib/api/auth";
import type { ProfileUpdatePayload } from "@/lib/api/mappers";
import type { LoginInput, RegisterInput } from "@/lib/validations/auth";

// ─── Public hook ──────────────────────────────────────────────────────────────

export interface UseAuthReturn {
  /** Full discriminated auth state — use `status` to narrow. */
  auth: AuthState;
  /** True while the initial /api/me check is in-flight. */
  isLoading: boolean;
  /** True once /api/me returned a user. */
  isAuthenticated: boolean;
  /** The current user, or null when unauthenticated / loading. */
  user: AuthUser | null;
  /** Submit credentials — resolves with the full login response. */
  login: (credentials: LoginInput) => Promise<LoginResponse>;
  /** Create a new account. In real API mode, OTP verification and login are handled separately. */
  register: (data: RegisterInput) => Promise<AuthUser>;
  /** Clears auth state, calls /api/auth/logout, and redirects. */
  logout: () => Promise<void>;
  /** Update profile fields and refresh auth state. Only writable fields are accepted. */
  updateUser: (updates: ProfileUpdatePayload) => Promise<AuthUser>;
}

export function useAuth(): UseAuthReturn {
  const { auth, login, register, logout, updateUser } = useAuthContext();

  return {
    auth,
    isLoading:       auth.status === "loading",
    isAuthenticated: auth.status === "authenticated",
    user:            auth.status === "authenticated" ? auth.user : null,
    login,
    register,
    logout,
    updateUser,
  };
}
