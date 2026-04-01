/**
 * localStorage auth store.
 *
 * Two separate keys:
 *   zimconnect_accounts — registered accounts (array of stored users + hashed passwords)
 *   zimconnect_user     — the currently logged-in user session
 *
 * This is the ONLY place that touches localStorage.
 * Swap this file out to move to cookies / HTTP-only tokens later.
 */

import type { AuthUser } from "@/lib/api/auth";

const SESSION_KEY  = "zimconnect_user";
const ACCOUNTS_KEY = "zimconnect_accounts";

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
