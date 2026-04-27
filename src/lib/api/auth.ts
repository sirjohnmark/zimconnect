import { api, ApiError } from "./client";
import {
  saveUser,
  getStoredUser,
  clearStoredUser,
  saveAccount,
  findAccountByEmail,
  updateStoredPassword,
  verifyStoredPassword,
  saveTokens,
  clearTokens,
} from "@/lib/auth/auth";
import { clearSessionCookie } from "@/lib/auth/cookies";
import type { LoginInput, RegisterInput } from "@/lib/validations/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  /** Convenience full name — `first_name + " " + last_name` */
  name: string;
  phone: string;
  avatar?: string;
  role: "BUYER" | "SELLER" | "ADMIN" | "MODERATOR";
  profile_picture: string | null;
  bio: string;
  location: string;
  phone_verified: boolean;
  email_verified: boolean;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  tokens: { access: string; refresh: string };
  user: AuthUser;
}

// ─── Mock helpers ─────────────────────────────────────────────────────────────

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

function mockUser(overrides: Partial<AuthUser> & { id: string | number; email: string; username: string; first_name: string; last_name: string }): AuthUser {
  return {
    phone: "",
    role: "BUYER",
    profile_picture: null,
    bio: "",
    location: "",
    phone_verified: false,
    email_verified: false,
    is_verified: false,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
    id: typeof overrides.id === "string" ? parseInt(overrides.id, 10) || Date.now() : overrides.id,
    name: `${overrides.first_name} ${overrides.last_name}`.trim(),
  };
}

// ─── Auth functions ───────────────────────────────────────────────────────────

export async function registerUser(data: RegisterInput): Promise<AuthUser> {
  if (USE_MOCK) {
    if (findAccountByEmail(data.email)) {
      throw new ApiError(409, "Conflict", "An account with this email already exists.");
    }
    const user = mockUser({
      id: Date.now(),
      email: data.email,
      username: data.username,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone ?? "",
      role: data.role,
    });
    await saveAccount({ id: String(user.id), name: `${data.first_name} ${data.last_name}`, email: data.email, password: data.password });
    return user;
  }
  return api.post<AuthUser>("/api/v1/auth/register", {
    email: data.email,
    username: data.username,
    password: data.password,
    confirm_password: data.confirm_password,
    role: data.role,
    phone: data.phone,
    first_name: data.first_name,
    last_name: data.last_name,
  });
}

export async function loginUser(credentials: LoginInput): Promise<LoginResponse> {
  if (USE_MOCK) {
    const account = findAccountByEmail(credentials.email);
    if (!account) {
      throw new ApiError(404, "Not Found", "No account found with this email. Please create an account first.");
    }
    const passwordValid = await verifyStoredPassword(account.id, credentials.password);
    if (!passwordValid) {
      throw new ApiError(401, "Unauthorized", "Incorrect password. Please try again.");
    }
    const stored = getStoredUser();
    const accountId = parseInt(account.id, 10) || Date.now();
    const user = stored ?? mockUser({ id: accountId, email: account.email, username: account.email.split("@")[0], first_name: account.name.split(" ")[0] ?? account.name, last_name: account.name.split(" ")[1] ?? "" });
    saveUser(user);
    return { tokens: { access: "mock-access", refresh: "mock-refresh" }, user };
  }
  const response = await api.post<LoginResponse>("/api/v1/auth/login", credentials);
  const user = normalizeUser(response.user);
  await saveTokens(response.tokens.access, response.tokens.refresh, user.role);
  saveUser(user);
  return { ...response, user };
}

export async function refreshAccessToken(): Promise<string> {
  if (USE_MOCK) return "mock-access";
  // The refresh token lives in an HttpOnly cookie — exchange it via the internal route
  const res = await fetch("/api/auth/refresh", { method: "POST" });
  if (!res.ok) throw new ApiError(401, "Unauthorized", "Session expired. Please log in again.");
  const { access } = await res.json() as { access: string };
  return access;
}

export async function logoutUser(): Promise<void> {
  try {
    if (!USE_MOCK) {
      await api.post<void>("/api/v1/auth/logout", {});
    }
  } finally {
    clearStoredUser();
    await clearTokens();
    clearSessionCookie();
  }
}

function normalizeUser(user: AuthUser): AuthUser {
  return { ...user, name: user.name || `${user.first_name} ${user.last_name}`.trim(), avatar: user.avatar ?? user.profile_picture ?? undefined };
}

export async function getMe(): Promise<AuthUser> {
  if (USE_MOCK) {
    const user = getStoredUser();
    if (!user) throw new ApiError(401, "Unauthorized", "Not authenticated");
    return normalizeUser(user as unknown as AuthUser);
  }
  const user = await api.get<AuthUser>("/api/v1/auth/profile");
  const normalized = normalizeUser(user);
  saveUser(normalized);
  return normalized;
}

export async function updateProfile(updates: Partial<Omit<AuthUser, "id" | "created_at" | "updated_at" | "is_active">>): Promise<AuthUser> {
  if (USE_MOCK) {
    const user = getStoredUser();
    if (!user) throw new ApiError(401, "Unauthorized", "Not authenticated");
    const updated = normalizeUser({ ...user, ...updates } as unknown as AuthUser);
    saveUser(updated);
    return updated;
  }
  const updated = normalizeUser(await api.patch<AuthUser>("/api/v1/auth/profile", updates));
  saveUser(updated);
  return updated;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  if (USE_MOCK) {
    const user = getStoredUser();
    if (!user) throw new ApiError(401, "Unauthorized", "Not authenticated");
    const id = String((user as unknown as AuthUser).id);
    const valid = await verifyStoredPassword(id, currentPassword);
    if (!valid) throw new ApiError(400, "Bad Request", "Current password is incorrect.");
    await updateStoredPassword(id, newPassword);
    return;
  }
  await api.post<void>("/api/v1/auth/change-password", { current_password: currentPassword, new_password: newPassword });
}

// ─── OTP ──────────────────────────────────────────────────────────────────────

export type OtpMethod = "email" | "sms";

export interface SendOtpPayload {
  method: OtpMethod;
  email?: string;
  phone?: string;
}

export interface VerifyOtpPayload {
  method: OtpMethod;
  code: string;
  email?: string;
  phone?: string;
}

/**
 * POST /api/v1/send-otp
 * Sends a 6-digit OTP via email or SMS.
 * Contact identifier (email/phone) is included so the endpoint works
 * even before a session token has been issued.
 */
export async function sendOtp(method: OtpMethod, email?: string, phone?: string): Promise<void> {
  if (USE_MOCK) return;
  const payload: SendOtpPayload = { method };
  if (method === "email" && email) payload.email = email;
  if (method === "sms"   && phone) payload.phone = phone;
  await api.post<void>("/api/v1/send-otp", payload);
}

/**
 * POST /api/v1/verify-otp
 * Verifies the submitted OTP code.
 * Throws ApiError(400) for invalid code, ApiError(410) for expired code.
 */
export async function verifyOtpCode(
  code: string,
  method: OtpMethod,
  email?: string,
  phone?: string,
): Promise<void> {
  if (USE_MOCK) return;
  const payload: VerifyOtpPayload = { method, code };
  if (method === "email" && email) payload.email = email;
  if (method === "sms"   && phone) payload.phone = phone;
  await api.post<void>("/api/v1/verify-otp", payload);
}

// ─── Legacy aliases (kept for any other callers) ──────────────────────────────

/** @deprecated Use sendOtp("email", email) */
export const sendEmailOtp  = (email?: string) => sendOtp("email", email);
/** @deprecated Use sendOtp("sms", undefined, phone) */
export const sendPhoneOtp  = (phone?: string) => sendOtp("sms", undefined, phone);
/** @deprecated Use verifyOtpCode(otp, "email", email) */
export const verifyEmailOtp = (otp: string, email?: string) => verifyOtpCode(otp, "email", email);
/** @deprecated Use verifyOtpCode(otp, "sms", undefined, phone) */
export const verifyPhoneOtp = (otp: string, phone?: string) => verifyOtpCode(otp, "sms", undefined, phone);
