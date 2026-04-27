"use client";

import { createContext, useCallback, useContext, useEffect, useReducer } from "react";
import { useRouter } from "next/navigation";
import { getMe, loginUser, logoutUser, registerUser, updateProfile } from "@/lib/api/auth";
import { ApiError, NetworkError } from "@/lib/api/client";
import type { AuthUser, LoginResponse } from "@/lib/api/auth";
import type { ProfileUpdatePayload } from "@/lib/api/mappers";
import type { LoginInput, RegisterInput } from "@/lib/validations/auth";
import { getStoredUser, setMemoryToken } from "@/lib/auth/auth";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

// ─── State (discriminated union) ─────────────────────────────────────────────

export type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: AuthUser }
  | { status: "unauthenticated" };

type AuthAction =
  | { type: "LOADING" }
  | { type: "SET_USER"; user: AuthUser }
  | { type: "CLEAR_USER" };

function authReducer(_state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOADING":    return { status: "loading" };
    case "SET_USER":   return { status: "authenticated", user: action.user };
    case "CLEAR_USER": return { status: "unauthenticated" };
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AuthContextValue {
  auth: AuthState;
  login: (credentials: LoginInput) => Promise<LoginResponse>;
  register: (data: RegisterInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  updateUser: (updates: ProfileUpdatePayload) => Promise<AuthUser>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export interface AuthProviderProps {
  children: React.ReactNode;
  logoutRedirect?: string;
}

export function AuthProvider({ children, logoutRedirect = "/login" }: AuthProviderProps) {
  const router = useRouter();
  const [auth, dispatch] = useReducer(authReducer, { status: "loading" });

  useEffect(() => {
    if (USE_MOCK) {
      const user = getStoredUser();
      if (user) {
        setMemoryToken("mock-access");
        dispatch({ type: "SET_USER", user: user as unknown as AuthUser });
      } else {
        dispatch({ type: "CLEAR_USER" });
      }
      return;
    }

    let cancelled = false;
    dispatch({ type: "LOADING" });

    async function initSession() {
      // Try to restore the access token via the HttpOnly refresh cookie
      try {
        const res = await fetch("/api/auth/refresh", { method: "POST" });
        if (res.ok) {
          const { access } = await res.json() as { access: string };
          setMemoryToken(access);
        } else {
          if (!cancelled) dispatch({ type: "CLEAR_USER" });
          return;
        }
      } catch {
        if (!cancelled) dispatch({ type: "CLEAR_USER" });
        return;
      }

      try {
        const user = await getMe();
        if (!cancelled) dispatch({ type: "SET_USER", user });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError || err instanceof NetworkError) {
          dispatch({ type: "CLEAR_USER" });
        } else {
          console.error("[auth] unexpected error fetching profile:", err);
          dispatch({ type: "CLEAR_USER" });
        }
      }
    }

    initSession();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (credentials: LoginInput): Promise<LoginResponse> => {
    const response = await loginUser(credentials);
    if (USE_MOCK) setMemoryToken("mock-access");
    dispatch({ type: "SET_USER", user: response.user });
    return response;
  }, []);

  // register creates the account (and in mock mode also logs in immediately).
  // In real API mode the user must verify OTP and then call login() separately.
  const register = useCallback(async (data: RegisterInput): Promise<AuthUser> => {
    const user = await registerUser(data);
    if (USE_MOCK) {
      dispatch({ type: "SET_USER", user });
    }
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      dispatch({ type: "CLEAR_USER" });
      router.push(logoutRedirect);
      router.refresh();
    }
  }, [logoutRedirect, router]);

  const updateUser = useCallback(async (updates: ProfileUpdatePayload): Promise<AuthUser> => {
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

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
