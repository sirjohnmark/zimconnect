import { api, ApiError } from "./client";
import {
  saveUser,
  getStoredUser,
  clearStoredUser,
  saveAccount,
  findAccountByEmail,
  updateStoredPassword,
  getStoredPassword,
} from "@/lib/auth/auth";
import type { LoginInput } from "@/lib/validations/auth";
import type { RegisterInput } from "@/lib/validations/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  /** base64 data URL — stored in localStorage in mock mode */
  avatar?: string;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
}

// ─── Mock / real toggle ───────────────────────────────────────────────────────

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

// ─── Auth functions ───────────────────────────────────────────────────────────

export async function registerUser(data: RegisterInput): Promise<LoginResponse> {
  if (USE_MOCK) {
    if (findAccountByEmail(data.email)) {
      throw new ApiError(409, "Conflict", "An account with this email already exists.");
    }
    const user: AuthUser = {
      id: `user-${Date.now()}`,
      name: data.name,
      email: data.email,
    };
    saveAccount({ ...user, password: data.password });
    saveUser(user);
    return { user, token: "mock-token" };
  }
  return api.post<LoginResponse>("/auth/register", data);
}

export async function loginUser(credentials: LoginInput): Promise<LoginResponse> {
  if (USE_MOCK) {
    const account = findAccountByEmail(credentials.email);
    if (!account) {
      throw new ApiError(404, "Not Found", "No account found with this email. Please create an account first.");
    }
    if (account.password !== credentials.password) {
      throw new ApiError(401, "Unauthorized", "Incorrect password. Please try again.");
    }
    const user: AuthUser = { id: account.id, name: account.name, email: account.email };
    saveUser(user);
    return { user, token: "mock-token" };
  }
  return api.post<LoginResponse>("/auth/login", credentials);
}

export async function getMe(): Promise<AuthUser> {
  if (USE_MOCK) {
    const user = getStoredUser();
    if (!user) throw new ApiError(401, "Unauthorized", "Not authenticated");
    return user;
  }
  return api.get<AuthUser>("/auth/me");
}

export async function logoutUser(): Promise<void> {
  if (USE_MOCK) {
    clearStoredUser();
    return;
  }
  return api.post<void>("/auth/logout", {});
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  if (USE_MOCK) {
    const user = getStoredUser();
    if (!user) throw new ApiError(401, "Unauthorized", "Not authenticated");
    const stored = getStoredPassword(user.id);
    if (stored !== currentPassword) {
      throw new ApiError(400, "Bad Request", "Current password is incorrect.");
    }
    updateStoredPassword(user.id, newPassword);
    return;
  }
  return api.post<void>("/auth/change-password", { currentPassword, newPassword });
}

export async function updateProfile(updates: Partial<Omit<AuthUser, "id">>): Promise<AuthUser> {
  if (USE_MOCK) {
    const user = getStoredUser();
    if (!user) throw new ApiError(401, "Unauthorized", "Not authenticated");
    const updated: AuthUser = { ...user, ...updates };
    saveUser(updated);
    return updated;
  }
  return api.patch<AuthUser>("/auth/profile", updates);
}
