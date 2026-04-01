"use client";

import { createContext, useCallback, useContext, useEffect, useReducer } from "react";
import { useRouter } from "next/navigation";
import { getMe, loginUser, logoutUser } from "@/lib/api/auth";
import { ApiError, NetworkError } from "@/lib/api/client";
import type { AuthUser, LoginResponse } from "@/lib/api/auth";
import type { LoginInput } from "@/lib/validations/auth";

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
  logout: () => Promise<void>;
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
  const [auth, dispatch] = useReducer(authReducer, { status: "loading" });

  // Fetch the current user on mount — silently clears state if not authenticated
  useEffect(() => {
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

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
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
