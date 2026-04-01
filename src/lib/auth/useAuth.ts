"use client";

import { useAuthContext } from "./AuthProvider";
import type { AuthState } from "./AuthProvider";
import type { AuthUser } from "@/lib/api/auth";
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
  login: (credentials: LoginInput) => Promise<unknown>;
  /** Create a new account and log in immediately. */
  register: (data: RegisterInput) => Promise<unknown>;
  /** Clears auth state, calls /api/auth/logout, and redirects. */
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { auth, login, register, logout } = useAuthContext();

  return {
    auth,
    isLoading:       auth.status === "loading",
    isAuthenticated: auth.status === "authenticated",
    user:            auth.status === "authenticated" ? auth.user : null,
    login,
    register,
    logout,
  };
}
