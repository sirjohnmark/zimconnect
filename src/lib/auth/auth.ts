/**
 * localStorage auth store.
 *
 * Two separate keys:
 *   sanganai_accounts — registered accounts (array of stored users + hashed passwords)
 *   sanganai_user     — the currently logged-in user session
 *
 * This is the ONLY place that touches localStorage.
 * Swap this file out to move to cookies / HTTP-only tokens later.
 */

import type { AuthUser } from "@/lib/api/auth";

const SESSION_KEY      = "sanganai_user";
const ACCOUNTS_KEY     = "sanganai_accounts";
const PREFERENCES_KEY  = "sanganai_prefs";

// ─── Stored account shape (includes password for mock validation) ─────────────

export interface StoredAccount {
  id: string;
  name: string;
  email: string;
  /** Plain-text in mock mode only — replace with a hash when using a real backend */
  password: string;
}

// ─── Accounts (registered users) ─────────────────────────────────────────────

export function getStoredAccounts(): StoredAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as StoredAccount[]) : [];
  } catch {
    return [];
  }
}

export function saveAccount(account: StoredAccount): void {
  if (typeof window === "undefined") return;
  const accounts = getStoredAccounts();
  accounts.push(account);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function findAccountByEmail(email: string): StoredAccount | null {
  return getStoredAccounts().find((a) => a.email.toLowerCase() === email.toLowerCase()) ?? null;
}

// ─── Session (logged-in user) ─────────────────────────────────────────────────

export function saveUser(user: AuthUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function clearStoredUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

export function isStoredAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SESSION_KEY) !== null;
}

// ─── Password change (mock) ───────────────────────────────────────────────────

export function updateStoredPassword(userId: string, newPassword: string): void {
  if (typeof window === "undefined") return;
  const accounts = getStoredAccounts();
  const idx = accounts.findIndex((a) => a.id === userId);
  if (idx !== -1) {
    accounts[idx].password = newPassword;
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  }
}

export function getStoredPassword(userId: string): string | null {
  const account = getStoredAccounts().find((a) => a.id === userId);
  return account?.password ?? null;
}

// ─── Preferences ──────────────────────────────────────────────────────────────

export interface UserPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  newMessageAlert: boolean;
  listingViewAlert: boolean;
  currency: "USD" | "ZWL";
  language: "en";
  profileVisibility: "public" | "private";
  showPhone: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  emailNotifications: true,
  smsNotifications: false,
  marketingEmails: false,
  newMessageAlert: true,
  listingViewAlert: true,
  currency: "USD",
  language: "en",
  profileVisibility: "public",
  showPhone: true,
};

export function getStoredPreferences(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    return raw ? { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<UserPreferences>) } : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: UserPreferences): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
}

// ─── OTP (mock — in production these would be server-side only) ───────────────

const OTP_KEY = "sanganai_otp";

interface StoredOtp {
  code: string;
  contact: string; // email or phone
  method: "email" | "phone";
  expiresAt: number; // timestamp ms
}

export function generateAndStoreOtp(contact: string, method: "email" | "phone"): string {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const entry: StoredOtp = { code, contact, method, expiresAt: Date.now() + 10 * 60 * 1000 }; // 10 min
  if (typeof window !== "undefined") {
    localStorage.setItem(OTP_KEY, JSON.stringify(entry));
  }
  return code;
}

export function verifyOtp(code: string): { valid: boolean; reason?: string } {
  if (typeof window === "undefined") return { valid: false, reason: "unavailable" };
  try {
    const raw = localStorage.getItem(OTP_KEY);
    if (!raw) return { valid: false, reason: "No code found. Please request a new one." };
    const entry = JSON.parse(raw) as StoredOtp;
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(OTP_KEY);
      return { valid: false, reason: "Code has expired. Please request a new one." };
    }
    if (entry.code !== code.trim()) {
      return { valid: false, reason: "Incorrect code. Please try again." };
    }
    localStorage.removeItem(OTP_KEY);
    return { valid: true };
  } catch {
    return { valid: false, reason: "Something went wrong. Please try again." };
  }
}

export function clearOtp(): void {
  if (typeof window !== "undefined") localStorage.removeItem(OTP_KEY);
}
