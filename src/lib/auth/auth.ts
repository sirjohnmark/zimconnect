/**
 * Auth store.
 *
 * JWT tokens
 * ──────────
 * Access token  : kept in a module-level JS variable (cleared on tab close).
 *                 Never written to localStorage — XSS cannot read it.
 * Refresh token : stored in an HttpOnly, Secure, SameSite=Strict cookie set
 *                 by the Next.js /api/auth/session route.  JS cannot read it.
 *
 * Mock passwords
 * ──────────────
 * Hashed with SHA-256 via the Web Crypto API before being written to
 * localStorage.  Plaintext passwords are never persisted.
 */

import type { AuthUser } from "@/lib/api/auth";

const SESSION_KEY     = "sanganai_user";
const ACCOUNTS_KEY    = "sanganai_accounts";
const PREFERENCES_KEY = "sanganai_prefs";

// ─── In-memory access token (cleared when tab closes) ─────────────────────────

let _accessToken: string | null = null;

export function setMemoryToken(token: string): void  { _accessToken = token; }
export function getMemoryToken(): string | null       { return _accessToken; }
export function clearMemoryToken(): void              { _accessToken = null; }

// Public alias used by the API client
export function getAccessToken(): string | null { return _accessToken; }

// ─── Refresh token — server-side HttpOnly cookie only ─────────────────────────
// Not readable from JS by design. Use /api/auth/refresh to exchange it.

export async function saveTokens(access: string, refresh: string, role: string): Promise<void> {
  setMemoryToken(access);
  await fetch("/api/auth/session", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ refresh, role }),
  });
}

export async function clearTokens(): Promise<void> {
  clearMemoryToken();
  await fetch("/api/auth/session", { method: "DELETE" });
}

// ─── Mock password hashing (SHA-256 via Web Crypto) ───────────────────────────

const MOCK_SALT = "sanganai-mock-salt-v1";

export async function hashPassword(password: string): Promise<string> {
  const encoded = new TextEncoder().encode(password + MOCK_SALT);
  const hashBuf = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── Stored account shape (password is SHA-256 hashed, never plaintext) ───────

export interface StoredAccount {
  id:       string;
  name:     string;
  email:    string;
  password: string; // SHA-256 hex digest of (plaintext + MOCK_SALT)
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

export async function saveAccount(account: Omit<StoredAccount, "password"> & { password: string }): Promise<void> {
  if (typeof window === "undefined") return;
  const hashed  = await hashPassword(account.password);
  const stored  = { ...account, password: hashed };
  const accounts = getStoredAccounts();
  accounts.push(stored);
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

export async function updateStoredPassword(userId: string, newPassword: string): Promise<void> {
  if (typeof window === "undefined") return;
  const accounts = getStoredAccounts();
  const idx = accounts.findIndex((a) => a.id === userId);
  if (idx !== -1) {
    accounts[idx].password = await hashPassword(newPassword);
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  }
}

export async function verifyStoredPassword(userId: string, candidatePassword: string): Promise<boolean> {
  const account = getStoredAccounts().find((a) => a.id === userId);
  if (!account) return false;
  const hashed = await hashPassword(candidatePassword);
  return account.password === hashed;
}

// ─── Preferences ──────────────────────────────────────────────────────────────

export interface UserPreferences {
  emailNotifications: boolean;
  smsNotifications:   boolean;
  marketingEmails:    boolean;
  newMessageAlert:    boolean;
  listingViewAlert:   boolean;
  currency:           "USD" | "ZWL";
  language:           "en";
  profileVisibility:  "public" | "private";
  showPhone:          boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  emailNotifications: true,
  smsNotifications:   false,
  marketingEmails:    false,
  newMessageAlert:    true,
  listingViewAlert:   true,
  currency:           "USD",
  language:           "en",
  profileVisibility:  "public",
  showPhone:          true,
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

// ─── OTP (mock — server-side in production) ───────────────────────────────────

const OTP_KEY = "sanganai_otp";

interface StoredOtp {
  code:      string;
  contact:   string;
  method:    "email" | "phone";
  expiresAt: number;
}

export function generateAndStoreOtp(contact: string, method: "email" | "phone"): string {
  const code  = String(Math.floor(100000 + Math.random() * 900000));
  const entry: StoredOtp = { code, contact, method, expiresAt: Date.now() + 10 * 60 * 1000 };
  if (typeof window !== "undefined") localStorage.setItem(OTP_KEY, JSON.stringify(entry));
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
