"use client";

import { createContext, useCallback, useContext, useEffect, useReducer, useRef } from "react";
import { useRouter } from "next/navigation";
import { getMe, logoutUser, registerUser, updateProfile } from "@/lib/api/auth";
import { ApiError, NetworkError } from "@/lib/api/client";
import type { AuthUser, LoginResponse } from "@/lib/api/auth";
import type { ProfileUpdatePayload } from "@/lib/api/mappers";
import type { LoginInput, RegisterInput } from "@/lib/validations/auth";
import { getStoredUser, setMemoryToken, saveUser, saveTokens, setStaySignedIn, login as authLogin } from "@/lib/auth/auth";

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
  login: (credentials: LoginInput, staySignedIn?: boolean) => Promise<LoginResponse>;
  register: (data: RegisterInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  updateUser: (updates: ProfileUpdatePayload) => Promise<AuthUser>;
  setUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export interface AuthProviderProps {
  children: React.ReactNode;
  logoutRedirect?: string;
}

export function AuthProvider({ children, logoutRedirect = "/login" }: AuthProviderProps) {
  const router         = useRouter();
  const [auth, dispatch] = useReducer(authReducer, { status: "loading" });
  const initCancelRef  = useRef<(() => void) | null>(null);

  // When the API client fires this event after a failed token refresh, clear
  // auth state and send the user to the login page.
  useEffect(() => {
    function onSessionExpired() {
      dispatch({ type: "CLEAR_USER" });
      router.push("/login");
    }
    window.addEventListener("auth:session-expired", onSessionExpired);
    return () => window.removeEventListener("auth:session-expired", onSessionExpired);
  }, [router]);

  useEffect(() => {
    if (USE_MOCK) {
      const user = getStoredUser();
      if (user) {
        // Re-hydrate in-memory token and re-set the HttpOnly cookies so the
        // middleware keeps recognising the session after a page reload.
        void saveTokens("mock-access", "mock-refresh", (user as unknown as AuthUser).role)
          .catch(() => {});
        dispatch({ type: "SET_USER", user: user as unknown as AuthUser });
      } else {
        dispatch({ type: "CLEAR_USER" });
      }
      return;
    }

    let cancelled = false;
    initCancelRef.current = () => { cancelled = true; };
    dispatch({ type: "LOADING" });

    async function initSession() {
      try {
        const res = await fetch("/api/auth/refresh", { method: "POST" });
        if (!res.ok) {
          if (!cancelled) dispatch({ type: "CLEAR_USER" });
          return;
        }
        if (cancelled) return;
        const { access } = await res.json() as { access: string };
        setMemoryToken(access);
      } catch {
        if (!cancelled) dispatch({ type: "CLEAR_USER" });
        return;
      }

      try {
        const user = await getMe();
        const patchRole = () => fetch("/api/auth/session", {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ role: user.role }),
        });
        patchRole().catch(() => { setTimeout(() => patchRole().catch(() => {}), 2000); });
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
    return () => {
      cancelled = true;
      initCancelRef.current = null;
    };
  }, []);

  const login = useCallback(async (credentials: LoginInput, staySignedIn: boolean = false): Promise<LoginResponse> => {
    // Cancel any in-flight initSession so a stale 401 can't CLEAR_USER after SET_USER
    initCancelRef.current?.();
    const response = await authLogin(credentials, staySignedIn);
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
      setStaySignedIn(false);
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

  const setUser = useCallback((user: AuthUser) => {
    saveUser(user);
    dispatch({ type: "SET_USER", user });
  }, []);

  return (
    <AuthContext.Provider value={{ auth, login, register, logout, updateUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
