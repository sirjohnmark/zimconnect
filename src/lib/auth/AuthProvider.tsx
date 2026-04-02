"use client";

import { createContext, useCallback, useContext, useEffect, useReducer } from "react";
import { useRouter } from "next/navigation";
import { getMe, loginUser, logoutUser, registerUser, updateProfile } from "@/lib/api/auth";
import { ApiError, NetworkError } from "@/lib/api/client";
import type { AuthUser, LoginResponse } from "@/lib/api/auth";
import type { LoginInput, RegisterInput } from "@/lib/validations/auth";
import { getStoredUser } from "@/lib/auth/auth";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

// ─── State shape (discriminated union) ───────────────────────────────────────
// Using a discriminated union means TypeScript narrows the type correctly:
//   if (auth.status === "authenticated") auth.user  ← always defined here

export type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: AuthUser }
  | { status: "unauthenticated" };

// ─── Actions ──────────────────────────────────────────────────────────────────

type AuthAction =
  | { type: "LOADING" }
  | { type: "SET_USER"; user: AuthUser }
  | { type: "CLEAR_USER" };

function authReducer(_state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOADING":       return { status: "loading" };
    case "SET_USER":      return { status: "authenticated", user: action.user };
    case "CLEAR_USER":    return { status: "unauthenticated" };
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AuthContextValue {
  auth: AuthState;
  login: (credentials: LoginInput) => Promise<LoginResponse>;
  register: (data: RegisterInput) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<Omit<AuthUser, "id">>) => Promise<AuthUser>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export interface AuthProviderProps {
  children: React.ReactNode;
  /** Redirect to this path after logout. Defaults to "/login". */
  logoutRedirect?: string;
}

export function AuthProvider({ children, logoutRedirect = "/login" }: AuthProviderProps) {
  const router = useRouter();
  // Always start as "loading" — identical on server and client, prevents hydration mismatch.
  // The correct state is resolved in the effect below (client-only, after hydration).
  const [auth, dispatch] = useReducer(authReducer, { status: "loading" });

  useEffect(() => {
    // Mock mode: read localStorage synchronously on the client after hydration
    if (USE_MOCK) {
      const user = getStoredUser();
      dispatch(user ? { type: "SET_USER", user } : { type: "CLEAR_USER" });
      return;
    }

    // Real API mode: fetch session from backend
    let cancelled = false;
    dispatch({ type: "LOADING" });

    getMe()
      .then((user) => {
        if (!cancelled) dispatch({ type: "SET_USER", user });
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          // Not logged in — expected, silent
          dispatch({ type: "CLEAR_USER" });
        } else if (err instanceof NetworkError) {
          // No backend / offline — expected in development, silent
          dispatch({ type: "CLEAR_USER" });
        } else {
          // Genuinely unexpected — log for debugging
          console.error("[auth] unexpected error fetching /api/me:", err);
          dispatch({ type: "CLEAR_USER" });
        }
      });

    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (credentials: LoginInput): Promise<LoginResponse> => {
    const response = await loginUser(credentials);
    dispatch({ type: "SET_USER", user: response.user });
    return response;
  }, []);

  const register = useCallback(async (data: RegisterInput): Promise<LoginResponse> => {
    const response = await registerUser(data);
    dispatch({ type: "SET_USER", user: response.user });
    return response;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      // Always clear local state even if the server call fails
      dispatch({ type: "CLEAR_USER" });
      router.push(logoutRedirect);
      router.refresh();
    }
  }, [logoutRedirect, router]);

  const updateUser = useCallback(async (updates: Partial<Omit<AuthUser, "id">>): Promise<AuthUser> => {
    const updated = await updateProfile(updates);
    dispatch({ type: "SET_USER", user: updated });
    return updated;
  }, []);

  return (
    <AuthContext.Provider value={{ auth, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Internal hook (consumed by useAuth.ts) ───────────────────────────────────

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
