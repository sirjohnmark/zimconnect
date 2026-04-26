# Security Audit Report — Sanganai (ZimConnect Frontend)

**Date:** 2026-04-26
**Auditor:** Claude (Application Security Engineer)
**Scope:** Full repository — `c:\dev\zimconnectFRONTEND\zimconnect`
**Methodology:** Defensive code review, static analysis, dependency audit, trust-boundary mapping

---

## 1. Executive Summary

**Overall Security Posture: HIGH RISK**

This is a Next.js 16 frontend that connects to a Django REST API at `api.sanganai.co.zw`. The app has no server-side middleware, stores auth tokens in localStorage, stores plain-text passwords in mock mode, has no rate limiting, no security headers, and an open redirect. All authorization (including admin access) is enforced purely client-side, which means every admin-protected API call can be made directly by an attacker with any valid credential.

**Top 5 Risks:**

| # | Risk | Severity |
|---|------|----------|
| 1 | No server-side route/middleware protection — all auth and admin checks are client-side only | Critical |
| 2 | JWT access + refresh tokens stored in localStorage — exposed to any XSS | Critical |
| 3 | Plain-text passwords persisted to localStorage in mock mode | Critical |
| 4 | Open redirect in login flow (`redirect` param unvalidated) | High |
| 5 | Account enumeration via differentiated login error messages | High |

**What could realistically go wrong if shipped today:**

- Any user can navigate directly to `/dashboard/categories` and the API calls will succeed if they have a Bearer token — the admin check is only in the React component, not the API gateway.
- A reflected XSS anywhere on the domain (even from a shared subdomain) can steal every user's access + refresh tokens from localStorage.
- An attacker sending phishing links like `https://sanganai.co.zw/login?redirect=https://evil.com` can capture credentials.
- Passwords are stored in plain text in the browser's localStorage devtools panel when mock mode is enabled.
- Any authenticated user can enumerate valid email addresses through differentiated login error responses, enabling targeted credential stuffing.

---

## 2. Attack Surface Map

```
┌─────────────────────────────────────────────────────┐
│                   Browser (Client)                   │
│  ┌─────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Login   │  │ Register │  │ Dashboard Pages   │  │
│  │ /login  │  │ /register│  │ (client auth only)│  │
│  └────┬────┘  └────┬─────┘  └────────┬──────────┘  │
│       │            │                 │               │
│  ┌────┴────────────┴─────────────────┴────────────┐ │
│  │  localStorage: tokens, user, passwords, OTP    │ │
│  └────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP (Next.js rewrite proxy)
┌──────────────────────┴──────────────────────────────┐
│              Next.js Server (FE)                     │
│  - rewrites /api/* → api.sanganai.co.zw             │
│  - rewrites /ws/*  → api.sanganai.co.zw (WS)       │
│  - NO middleware.ts                                  │
│  - NO server-side auth checks                        │
│  - NO CSP/Security headers                           │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────┐
│         Django REST API (api.sanganai.co.zw)        │
│  Assumed: JWT auth, DRF, Postgres                   │
│  (Not audited — out of scope)                       │
└─────────────────────────────────────────────────────┘
```

### Entry Points

| Entry Point | Authentication | Type |
|-------------|---------------|------|
| `/login` | None | User-facing |
| `/register` | None | User-facing |
| `/dashboard/*` | Client-side only | Protected area |
| `/dashboard/categories` | Client-side role check only | Admin |
| `/api/*` (proxied) | Bearer token (from localStorage) | API |
| `/ws/*` (proxied) | Token in query string | WebSocket |
| Form submissions | None (server validates) | User input |

### Sensitive Routes

| Route | Risk |
|-------|------|
| `POST /api/v1/auth/login/` | Credential brute-force, account enumeration |
| `POST /api/v1/auth/register/` | Mass registration, role escalation |
| `POST/PATCH/DELETE /api/v1/categories/` | Unauthorized admin actions |
| `POST/DELETE /api/v1/listings/` | Unauthorized listing manipulation |
| `/ws/chat/:id/?token=` | Token exposure in URL |

### Privileged Actions

| Action | Current Protection |
|--------|-------------------|
| Create/Edit/Delete categories | Client-side role check only |
| Create listings | Client-side auth check only |
| Publish listings | No additional verification |
| Admin dashboard access | Client-side role check only |
| Delete own listings | No confirmation beyond API call |

### External Integrations

| Integration | URL | Data Flow |
|-------------|-----|-----------|
| Django REST API | `https://api.sanganai.co.zw` | All data, auth tokens |
| WebSocket (Django Channels) | `wss://api.sanganai.co.zw/ws/` | Chat messages, auth token |

### Trust Boundaries

```
Untrusted: Browser user input, URL parameters, WebSocket messages
    ↓
Trust boundary: Next.js Server (rewrite proxy — no validation)
    ↓
Trusted: Django API (assumed to enforce RBAC — UNVERIFIED)
```

**Critical observation:** The Next.js server adds zero security. It proxies requests to the Django API without inspecting tokens, validating roles, or rate limiting. The entire security model depends on the Django backend enforcing all access controls independently.

---

## 3. Findings Table

### Finding #1 — No Server-Side Middleware / All Authorization Is Client-Side Only

- **Severity:** CRITICAL
- **Files:** `src/app/(dashboard)/layout.tsx` (no auth guard), `src/app/(dashboard)/dashboard/categories/page.tsx:24` (client-only admin check)
- **No `src/middleware.ts` file exists anywhere in the project.**

**Evidence:**

```typescript
// categories/page.tsx:24 — purely client-side admin check
const isAdmin = user?.role === "ADMIN" || user?.role === "MODERATOR";

// categories/page.tsx:90-97 — shows message but does NOT redirect or block API access
if (!isAdmin) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-sm font-semibold text-gray-900">Admin access required</p>
      <p className="mt-1 text-xs text-gray-500">
        Only admins and moderators can manage categories.
      </p>
    </div>
  );
}
```

The dashboard layout (`src/app/(dashboard)/layout.tsx`) has no `useRequireAuth()` call. The `useRequireAuth` hook itself is purely a client-side redirect — it does not verify tokens server-side.

**Why it matters:** Any user with a valid JWT can directly call `POST /api/v1/categories/` or `DELETE /api/v1/categories/:id/` regardless of their role. The Next.js rewrite proxy adds no authorization layer. The admin categories page only hides the UI — it does not prevent API access.

**Realistic attack scenario:**

1. User registers as `BUYER` through the normal flow
2. User copies their JWT access token from localStorage
3. User calls `curl -X POST https://sanganai.co.zw/api/v1/categories/ -H "Authorization: Bearer <token>" -d '{"name":"Hacked","slug":"hacked"}'`
4. If the Django backend also lacks role checks, the category is created

**Recommended fix:**

Create `src/middleware.ts` with server-side JWT verification and role checks:

```typescript
// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_PATHS = ["/dashboard/categories"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // All dashboard routes require authentication
  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get("sanganai_access")?.value; // once moved to cookies
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Admin routes require admin role — verify in JWT claims
    if (ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
      // Decode JWT and verify role claim
      // If role !== ADMIN/MODERATOR → 403
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

**Verification steps after fix:**
- Access `/dashboard/categories` while unauthenticated → redirected to `/login`
- Access `/dashboard/categories` as BUYER → receive 403
- Access `/dashboard/categories` as ADMIN → allowed

---

### Finding #2 — JWT Access + Refresh Tokens in localStorage

- **Severity:** CRITICAL
- **Files:** `src/lib/api/client.ts:73-75`, `src/lib/auth/auth.ts:77-91`

**Evidence:**

```typescript
// client.ts:73-75 — token injected into every request from localStorage
if (typeof window !== "undefined") {
  const token = localStorage.getItem("sanganai_access");
  if (token) headers["Authorization"] = `Bearer ${token}`;
}

// auth.ts:77-81 — tokens stored in plain text in localStorage
export function saveTokens(access: string, refresh: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

// auth.ts:83-91 — tokens read from localStorage
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}
```

The code acknowledges this in a comment at `src/lib/auth/auth.ts:9`:
`Swap this file out to move to cookies / HTTP-only tokens later.`

**Why it matters:** Any JavaScript running on the domain can read localStorage. This includes:
- XSS payloads from any reflected/stored XSS vulnerability
- Compromised third-party scripts (analytics, ads, etc.)
- Malicious browser extensions
- Shared-origin attacks (subdomain takeover)

**Realistic attack scenario:**

1. A reflected XSS is found in a search parameter that renders unsanitized user input
2. Attacker crafts a link that extracts `localStorage.getItem("sanganai_access")` and `localStorage.getItem("sanganai_refresh")` and sends them to `https://attacker.com/collect`
3. Attacker now has the victim's access AND refresh tokens
4. Attacker can impersonate the victim indefinitely (refresh token rotation assumed not implemented)

**Recommended fix:**

Migrate to HTTP-only, Secure, SameSite cookies. This requires backend changes:

```
Backend response after login:
Set-Cookie: sanganai_access=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/
Set-Cookie: sanganai_refresh=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth/token/refresh/
```

The Next.js rewrite proxy will forward these cookies automatically to the API. The client code no longer touches tokens.

In the short term, at minimum:
- Use `sessionStorage` instead of `localStorage` (clears on tab close, not shared across tabs)
- Add a strict Content-Security-Policy header

**Verification steps after fix:**
- Open DevTools → Application → Storage → Cookies → confirm tokens are HttpOnly
- Run `localStorage.getItem("sanganai_access")` in console → should return `null`
- Verify API requests carry the cookie automatically

---

### Finding #3 — Plain-Text Passwords Stored in localStorage (Mock Mode)

- **Severity:** CRITICAL
- **Files:** `src/lib/auth/auth.ts:22-46`, `src/lib/api/auth.ts:84`

**Evidence:**

```typescript
// auth.ts:22-28 — StoredAccount interface includes plain-text password field
export interface StoredAccount {
  id: string;
  name: string;
  email: string;
  /** Plain-text in mock mode only — replace with a hash when using a real backend */
  password: string;   // ← PLAIN TEXT
}

// auth.ts:42-46 — saves password directly to localStorage
export function saveAccount(account: StoredAccount): void {
  if (typeof window === "undefined") return;
  const accounts = getStoredAccounts();
  accounts.push(account);  // ← pushes account object with plain-text password
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

// auth.ts:106-113 — updates password in-place in localStorage
export function updateStoredPassword(userId: string, newPassword: string): void {
  if (typeof window === "undefined") return;
  const accounts = getStoredAccounts();
  const idx = accounts.findIndex((a) => a.id === userId);
  if (idx !== -1) {
    accounts[idx].password = newPassword;  // ← plain-text password update
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  }
}
```

In `src/lib/api/auth.ts:84`, the register function saves the password directly:

```typescript
saveAccount({
  id: String(user.id),
  name: `${data.first_name} ${data.last_name}`,
  email: data.email,
  password: data.password  // ← plain text from form input
});
```

**Why it matters:** Even in mock/development mode, passwords are stored in plain text in localStorage. This data persists across browser sessions. Any developer or anyone with physical access to a machine used for testing can open DevTools → Application → Local Storage → `sanganai_accounts` and read every registered password.

**Realistic attack scenario:**

1. Development/staging environment has mock mode enabled
2. A developer or tester registers an account using a real or commonly-used password
3. A second developer or anyone with access to the machine opens DevTools
4. All registered email/password pairs are visible in plain text
5. If any credentials match real accounts on other services, credential reuse attack is possible

**Recommended fix:**

Remove password storage entirely from localStorage. For mock mode, use a single hardcoded test password:

```typescript
// Revised approach — never store passwords
export interface StoredAccount {
  id: string;
  name: string;
  email: string;
  // password field REMOVED
}

// For mock auth validation:
const MOCK_TEST_PASSWORD = "sanganai-test-2024"; // single shared test password

// In login mock:
if (credentials.password !== MOCK_TEST_PASSWORD) {
  throw new ApiError(401, "Unauthorized", "Invalid email or password.");
}
```

**Verification steps after fix:**
- Register a test account in mock mode
- Open DevTools → Application → Local Storage → `sanganai_accounts`
- Confirm no password field exists in any stored account object

---

### Finding #4 — Open Redirect in Login Flow

- **Severity:** HIGH
- **Files:** `src/components/auth/LoginForm.tsx:43,57`, `src/components/auth/RegisterForm.tsx:175`

**Evidence:**

```typescript
// LoginForm.tsx:43 — redirectTo taken from URL query parameter without validation
const redirectTo = searchParams.get("redirect") ?? "/dashboard";

// LoginForm.tsx:56-58 — used directly after successful login
try {
  await login(data);
  router.push(redirectTo);  // ← unvalidated URL from attacker-controlled query param
  router.refresh();
}
```

The same pattern exists in `RegisterForm.tsx:175`:

```typescript
const redirectTo = searchParams.get("redirect") ?? "/dashboard";
```

And used at line 333:
```typescript
router.push(redirectTo);
```

**Why it matters:** This is a classic open redirect vulnerability (CWE-601). An attacker can craft a URL where after login, the victim is sent to an attacker-controlled domain.

**Realistic attack scenario:**

1. Attacker sends a phishing email: *"Your Sanganai listing was flagged for review. Please sign in to appeal: https://sanganai.co.zw/login?redirect=https://evil-sanganai.com/dashboard"*
2. Victim sees the legitimate `sanganai.co.zw` domain and clicks
3. After entering valid credentials and logging in, the browser redirects to `evil-sanganai.com`
4. The attacker's site shows a page identical to Sanganai's dashboard and asks the user to "verify their identity" or "re-enter payment details"
5. Victim provides additional sensitive information to the attacker

**Recommended fix:**

Validate the redirect URL against a whitelist of allowed paths:

```typescript
// src/lib/utils.ts — add this function
export function safeRedirect(raw: string | null): string {
  if (!raw) return "/dashboard";

  // Only allow relative paths starting with a single /
  // Block protocol-relative URLs (//evil.com) and backslash tricks
  if (raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\")) {
    // Optional: validate against a list of known paths
    const ALLOWED_PREFIXES = ["/dashboard", "/listings", "/home", "/profile"];
    if (ALLOWED_PREFIXES.some((prefix) => raw.startsWith(prefix))) {
      return raw;
    }
  }

  return "/dashboard";
}

// LoginForm.tsx — use the safe function
const redirectTo = safeRedirect(searchParams.get("redirect"));
```

**Verification steps after fix:**
- Visit `/login?redirect=/dashboard/listings` → after login, redirected to `/dashboard/listings` (valid)
- Visit `/login?redirect=https://evil.com` → after login, redirected to `/dashboard` (invalid, default used)
- Visit `/login?redirect=//evil.com` → after login, redirected to `/dashboard` (protocol-relative blocked)

---

### Finding #5 — Dashboard Layout Has No Auth Guard

- **Severity:** HIGH
- **Files:** `src/app/(dashboard)/layout.tsx:1-50`

**Evidence:**

The entire dashboard layout is a client component but has no `useRequireAuth()` call:

```typescript
"use client";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-gray-50">
      <DesktopSidebar />
      <MobileSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {/* Main area with children */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header>...</header>
        <main>{children}</main>
      </div>
    </div>
  );
}
```

No `useRequireAuth()` in the layout. No server-side middleware protecting `/dashboard/*`. Individual child pages may or may not call `useRequireAuth()` — each page is responsible for its own protection.

**Why it matters:** Any new dashboard page added without explicitly calling `useRequireAuth()` will be accessible without authentication. The Sidebar component fetches user data and will crash or show loading state, but the page content still renders.

**Recommended fix:**

Option A: Add `useRequireAuth()` to the dashboard layout (quickest):

```typescript
"use client";

import { useRequireAuth } from "@/lib/auth/requireAuth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useRequireAuth();
  if (isLoading) return <DashboardSkeleton />;
  // ... rest of layout
}
```

Option B (better): Use `middleware.ts` to protect the entire `/dashboard/*` path prefix server-side (see Finding #1).

**Verification steps after fix:**
- Clear cookies/localStorage → navigate to `/dashboard` → redirected to `/login`
- Clear cookies/localStorage → navigate to `/dashboard/categories` → redirected to `/login`
- Login → navigate to `/dashboard` → renders normally

---

### Finding #6 — Account Enumeration Through Login Error Messages

- **Severity:** HIGH
- **Files:** `src/lib/api/auth.ts:99-107`

**Evidence:**

```typescript
// auth.ts:99-107 — different error codes and messages for different failure modes
if (USE_MOCK) {
  const account = findAccountByEmail(credentials.email);
  if (!account) {
    throw new ApiError(404, "Not Found",
      "No account found with this email. Please create an account first.");
  }
  if (account.password !== credentials.password) {
    throw new ApiError(401, "Unauthorized",
      "Incorrect password. Please try again.");
  }
}
```

In production mode (lines 114-118), the error message comes from the Django API response. If the Django backend also returns different messages for "user not found" vs "wrong password," the same vulnerability exists.

The LoginForm renders these error messages directly:

```typescript
// LoginForm.tsx:61-66
if (err.status === 404) {
  setFormError("No account found with this email. Please create an account first.");
} else if (err.status === 401) {
  setFormError("Incorrect password. Please try again.");
}
```

**Why it matters:** An attacker can enumerate valid email addresses on the platform. This is a prerequisite for:
- Targeted phishing attacks against known users
- Credential stuffing with breached password lists
- Social engineering attacks

**Realistic attack scenario:**

1. Attacker obtains a list of 10,000 Zimbabwean email addresses
2. Attacker writes a script that sends login requests for each email with a dummy password
3. Emails returning HTTP 401 are confirmed valid accounts (correct email, wrong password)
4. Emails returning HTTP 404 are not registered
5. Attacker now has a list of valid accounts to target

**Recommended fix:**

Use a single generic error message regardless of whether the account exists:

```typescript
// auth.ts mock mode
if (!account || account.password !== credentials.password) {
  throw new ApiError(401, "Unauthorized", "Invalid email or password.");
}

// LoginForm.tsx — simplified error handling
if (err.status === 401) {
  setFormError("Invalid email or password.");
}
```

The Django backend must also return a generic auth failure for both cases.

**Verification steps after fix:**
- Attempt login with `nonexistent@example.com` → see "Invalid email or password" (same as wrong password)
- Attempt login with valid email + wrong password → see "Invalid email or password" (identical message)
- HTTP status codes should be identical (both 401)

---

### Finding #7 — WebSocket Auth Token in URL Query String

- **Severity:** HIGH
- **Files:** `src/lib/hooks/useWebSocket.ts:37`

**Evidence:**

```typescript
function connect() {
  const token = getAccessToken();
  const url = `${WS_BASE}/ws/chat/${conversationId}/?token=${token ?? ""}`;
  const ws = new WebSocket(url);
  // ...
}
```

The JWT access token is appended to the WebSocket URL as a query parameter.

**Why it matters:** Tokens in URL query strings are logged in multiple places:
- Server access logs (nginx, Django)
- Proxy logs (Cloudflare, Vercel)
- Browser history (if the URL is navigable)
- Referrer headers (if the WebSocket URL leaks into an HTTP request)

If any of these log sources are inadvertently exposed, tokens are compromised.

**Realistic attack scenario:**

1. A security incident causes server access logs to be shared with a third party for investigation
2. The nginx logs contain WebSocket upgrade URLs with `?token=eyJ...` query parameters
3. The third party (or an attacker who compromises the log storage) extracts valid JWT tokens
4. Tokens are used to access victim accounts

**Recommended fix:**

Send the token as an authentication message after the WebSocket connection opens:

```typescript
function connect() {
  const url = `${WS_BASE}/ws/chat/${conversationId}/`;
  const ws = new WebSocket(url);

  ws.onopen = () => {
    // Authenticate after connection — token never appears in URL
    const token = getAccessToken();
    if (token) {
      ws.send(JSON.stringify({ type: "authenticate", token }));
    }
  };
  // ...
}
```

This requires the Django Channels backend to support authentication via a message rather than a query parameter. Alternatively, use cookie-based auth if WebSocket connections carry cookies.

**Verification steps after fix:**
- Open browser DevTools → Network → WS tab
- Verify the initial WebSocket connection URL does NOT contain `?token=`
- Verify an authentication message is sent immediately after connection opens
- Verify the WebSocket connection fails if no valid token is sent

---

### Finding #8 — Missing Security Headers

- **Severity:** MEDIUM
- **Files:** `next.config.ts` (no `headers()` config), `src/app/layout.tsx` (no metadata headers)

**Evidence:**

No `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`, or `Permissions-Policy` headers are configured anywhere in the project. A grep for these header names across the entire codebase returns zero results.

**Why it matters:**

| Missing Header | Risk |
|----------------|------|
| `Content-Security-Policy` | No protection against XSS, data exfiltration |
| `X-Frame-Options` | Site can be embedded in iframes (clickjacking) |
| `X-Content-Type-Options` | Browser may MIME-sniff and execute files as scripts |
| `Strict-Transport-Security` | MITM downgrade attacks possible if user types HTTP |
| `Referrer-Policy` | Internal URLs may leak via Referer header |
| `Permissions-Policy` | No restriction on browser feature abuse |

**Recommended fix:**

Add headers to `next.config.ts`:

```typescript
// next.config.ts — add headers() function
async headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
      ],
    },
  ];
},
```

If the site is served over HTTPS (which Vercel provides by default), also add:

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

**CSP note:** Add a Content-Security-Policy in a separate iteration. It requires thorough testing with all existing inline styles and scripts. Start with:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; connect-src 'self' https://api.sanganai.co.zw wss://api.sanganai.co.zw;
```

**Verification steps after fix:**
- Deploy and check response headers with `curl -I https://sanganai.co.zw`
- Use https://securityheaders.com to verify all headers are present
- Verify the site still functions with headers enabled

---

### Finding #9 — No Rate Limiting on Auth Endpoints (Client-Side)

- **Severity:** MEDIUM
- **Files:** `src/components/auth/LoginForm.tsx` (no throttle/debounce), `src/lib/api/auth.ts:99-119`

**Evidence:**

The login form disables the submit button during `isSubmitting` to prevent double-submit, but there is no mechanism to prevent rapid repeated login attempts:

```typescript
// LoginForm.tsx — isSubmitting only prevents double-click on same submission
const { formState: { errors, isSubmitting } } = useForm<LoginInput>({
  resolver: zodResolver(loginSchema),
});

// After an error, the button is immediately re-enabled
// An attacker can hammer the endpoint with a script
```

**Why it matters:** If the Django backend lacks rate limiting on `/api/v1/auth/login/`, attackers can brute-force passwords at network speed. Even if the backend has rate limiting, aggressive client retries waste resources and can trigger backend rate limit blocks for legitimate users sharing the same IP.

**Recommended fix:**

Add client-side attempt counting with exponential backoff as a defense-in-depth measure:

```typescript
// In LoginForm.tsx
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30000;
const [attempts, setAttempts] = useState(0);

async function onSubmit(data: LoginInput) {
  if (attempts >= MAX_ATTEMPTS) {
    setFormError("Too many attempts. Please wait 30 seconds.");
    return;
  }

  setFormError(null);
  try {
    await login(data);
    setAttempts(0); // reset on success
    router.push(redirectTo);
  } catch (err) {
    setAttempts((a) => a + 1);
    // ... error handling
  }
}

// Reset attempts after lockout period
useEffect(() => {
  if (attempts >= MAX_ATTEMPTS) {
    const timer = setTimeout(() => setAttempts(0), LOCKOUT_MS);
    return () => clearTimeout(timer);
  }
}, [attempts]);
```

The primary defense must be backend rate limiting — this client-side measure is supplementary only and can be bypassed.

**Verification steps after fix:**
- Submit wrong password 5 times → button should be disabled for 30 seconds
- After 30 seconds → button should re-enable
- Successful login should reset the counter

---

### Finding #10 — Mock OTP Generation & Verification on Client-Side

- **Severity:** MEDIUM
- **Files:** `src/lib/auth/auth.ts:164-204`, `src/components/auth/RegisterForm.tsx:576-581`

**Evidence:**

```typescript
// auth.ts:173-174 — OTP generated client-side with Math.random()
export function generateAndStoreOtp(contact: string, method: "email" | "phone"): string {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const entry: StoredOtp = { code, contact, method, expiresAt: Date.now() + 10 * 60 * 1000 };
  if (typeof window !== "undefined") {
    localStorage.setItem(OTP_KEY, JSON.stringify(entry));
  }
  return code;
}

// auth.ts:182-199 — OTP verified entirely client-side
export function verifyOtp(code: string): { valid: boolean; reason?: string } {
  const raw = localStorage.getItem(OTP_KEY);
  // ... compares against localStorage value
}
```

The OTP code is displayed to the user in mock mode:

```typescript
// RegisterForm.tsx:576-581
{USE_MOCK && sentCode && (
  <Alert type="info"
    message={`Demo mode: your code is ${sentCode}.
      In production this is sent by ${verifyMethod === "email" ? "email" : "SMS"}.`}
  />
)}
```

**Why it matters:** Mock mode OTP verification provides no security. The code is visible in the UI and stored in localStorage. However, this code is guarded by `USE_MOCK` check and will not execute in production.

**Recommended fix:**

This is acceptable for development/demo purposes since the `USE_MOCK` flag prevents it from running in production. However:

1. **Confirm `NEXT_PUBLIC_USE_MOCK=false` is set in production deployment** (verified in `.env.production` — confirm this is the actual deployment config)
2. Add a build-time assertion to fail the build if mock mode is accidentally enabled in production
3. Never copy this mock OTP pattern to real API code

**Verification steps after fix:**
- Deploy to staging with `NEXT_PUBLIC_USE_MOCK=false`
- Attempt registration → OTP should be sent via actual email/SMS, not shown in UI
- Check DevTools → localStorage → no `sanganai_otp` key should exist in production mode

---

### Finding #11 — Debug Console Logging in Production

- **Severity:** LOW
- **Files:** `src/lib/auth/AuthProvider.tsx:77`, `src/app/(marketplace)/listings/error.tsx:13`, `src/app/(marketplace)/categories/error.tsx:14`

**Evidence:**

```typescript
// AuthProvider.tsx:77
console.error("[auth] unexpected error fetching profile:", err);

// listings/error.tsx:13
console.error("[listings] fetch error:", error);

// categories/error.tsx:14
console.error("[categories] fetch error:", error);
```

**Why it matters:** Console errors in production can leak internal details including API paths, error objects with stack traces, and potentially user-related data in the error objects.

**Recommended fix:**

Guard with environment check or use a structured logger:

```typescript
if (process.env.NODE_ENV !== "production") {
  console.error("[auth] unexpected error fetching profile:", err);
}
```

Or implement a production-safe logger that sends errors to a monitoring service (Sentry, etc.) rather than the browser console.

---

### Finding #12 — PostCSS XSS Vulnerability

- **Severity:** LOW
- **Evidence:** `npm audit` reports GHSA-qx2v-qp2m-jg93 in PostCSS < 8.5.10 (moderate, CVSS 6.1).

```
postcss  <8.5.10
PostCSS has XSS via Unescaped </style> in its CSS Stringify Output
https://github.com/advisories/GHSA-qx2v-qp2m-jg93
```

**Why it matters:** PostCSS is a build-time dependency used by Tailwind CSS. The vulnerability is in PostCSS's stringify output with unescaped `</style>` tags in CSS. Since Next.js processes CSS at build time and serves static CSS files, the attack surface is minimal. However, it should still be patched.

**Recommended fix:**

Check if a newer version of Next.js (16.2.5+) or PostCSS (8.5.10+) is available, or add an override:

```json
// package.json
"overrides": {
  "postcss": ">=8.5.10"
}
```

Then run `npm install` and `npm audit` to verify.

---

## 4. Chained Vulnerability Analysis

### Chain #1: Open Redirect + localStorage Token Storage

```
┌─────────────────────────────────────────────────────────────┐
│  Open redirect (/login?redirect=https://evil.com)            │
│                          +                                  │
│  JWT stored in localStorage                                 │
│                          =                                  │
│  Attacker sends phishing link → victim logs in →            │
│  redirected to attacker site                                 │
│                                                             │
│  MITIGATING FACTOR: Same-origin policy prevents             │
│  cross-origin localStorage access. This chain is NOT        │
│  exploitable cross-origin for token theft.                  │
│                                                             │
│  HOWEVER: If the redirect target is a compromised           │
│  subdomain (e.g. evil.sanganai.co.zw via DNS takeover),     │
│  tokens ARE accessible.                                     │
└─────────────────────────────────────────────────────────────┘
```

**Verdict:** Medium risk cross-origin. High risk same-origin. Fix the open redirect regardless — it enables credential phishing even without token theft.

### Chain #2: Client-Only Admin Check + Direct API Access = Privilege Escalation

```
┌─────────────────────────────────────────────────────────────┐
│  No middleware.ts + client-only role check                  │
│                          +                                  │
│  API endpoints callable with any valid Bearer token        │
│                          =                                  │
│  Any BUYER user can:                                       │
│    1. Extract JWT from localStorage                        │
│    2. Call POST /api/v1/categories/ to create categories   │
│    3. Call DELETE /api/v1/categories/:id/ to delete cats   │
│    4. Modify any listing they don't own                    │
│                                                             │
│  EXPLOITABLE: YES — this chain works if the backend        │
│  also lacks RBAC enforcement.                             │
└─────────────────────────────────────────────────────────────┘
```

**Verdict:** This chain IS exploitable. The critical dependency is on the Django backend enforcing RBAC. **This must be verified before production.**

### Chain #3: Account Enumeration + No Rate Limiting = Credential Brute-Force

```
┌─────────────────────────────────────────────────────────────┐
│  Different error messages (404 vs 401)                      │
│                          +                                  │
│  No client-side rate limiting                                │
│                          +                                  │
│  No observable server-side rate limiting in client code     │
│                          =                                  │
│  1. Enumerate valid emails (404 vs 401 response)            │
│  2. Brute-force passwords on known accounts                 │
│  3. Automated attack possible via direct API calls          │
│                                                             │
│  EXPLOITABLE: YES — if backend lacks rate limiting and      │
│  returns differentiated errors.                             │
└─────────────────────────────────────────────────────────────┘
```

**Verdict:** Exploitability depends on the Django backend's rate limiting and error responses. Fix the client-side error differentiation anyway — it eliminates the enumeration vector.

---

## 5. Quick Wins

### Changes you can make in under 1 hour:

1. **Fix the open redirect** — add `safeRedirect()` function to `src/lib/utils.ts`, apply in `LoginForm.tsx:43` and `RegisterForm.tsx:175`
2. **Fix account enumeration** — change `lib/api/auth.ts:99-107` to use generic "Invalid email or password" for both cases
3. **Add security headers** — add `headers()` config to `next.config.ts` with X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
4. **Remove plain-text password from localStorage** — change `StoredAccount` interface to exclude `password`, use single hardcoded mock password
5. **Guard `console.error` calls** — wrap with `NODE_ENV !== "production"` check

### Changes you should make before production:

1. **Move tokens from localStorage to HTTP-only cookies** (requires backend coordination)
2. **Implement `src/middleware.ts`** with JWT validation for all `/dashboard/*` routes
3. **Ensure backend enforces RBAC** on all admin endpoints independently — verify with penetration testing
4. **Fix WebSocket auth** — send token as connection message, not URL query parameter
5. **Upgrade Next.js** to resolve PostCSS vulnerability or add override
6. **Add CSP headers** (start with report-only mode, transition to enforcement after testing)

### Changes requiring deeper redesign:

1. **Migrate to server-side session management** instead of JWT-in-browser
2. **Implement proper audit logging** for all admin actions and auth events
3. **Add request signing for webhook endpoints** when webhook integrations are added
4. **Implement CSRF tokens** if moving to cookie-based auth (browser sends cookies automatically)
5. **Add server-side rate limiting middleware** at the Next.js level as defense-in-depth

---

## 6. Secure Patch Plan

### Prioritized Remediation Checklist

| Order | Task | Effort | Impact |
|-------|------|--------|--------|
| 1 | Fix open redirect — validate `redirect` param | 15 min | Blocks phishing vector |
| 2 | Add `middleware.ts` to protect `/dashboard/*` routes | 1 hr | Blocks unauthorized dashboard access |
| 3 | Add security headers in `next.config.ts` | 15 min | Hardens against clickjacking, MIME sniffing |
| 4 | Fix login error message differentiation | 5 min | Blocks email harvesting |
| 5 | Remove password from localStorage (mock mode) | 15 min | Prevents password exposure in dev/staging |
| 6 | Move token from WebSocket URL to connection message | 1 hr | Prevents token logging in server logs |
| 7 | Migrate tokens to HTTP-only cookies (backend + frontend) | 4-8 hr | Eliminates XSS token theft vector |
| 8 | Add CSP headers (report-only → enforced) | 2-4 hr | Defense-in-depth against XSS |
| 9 | Upgrade Next.js / override postcss | 1 hr | Fixes npm audit vulnerability |
| 10 | Add client-side rate limiting on login form | 30 min | Supplementary brute-force protection |

### Tests to add

- Unit test: `safeRedirect()` URL validation (blocks absolute URLs, protocol-relative URLs, backslash tricks)
- Unit test: login error handler returns same message for "user not found" and "wrong password"
- Integration test: `GET /dashboard/categories` returns 401 without auth
- Integration test: `POST /api/v1/categories/` returns 403 for BUYER role
- E2E test: login as BUYER → navigate directly to `/dashboard/categories` → see 403 or redirect
- E2E test: visit `/login?redirect=https://evil.com` → login → verify redirect stays on-site
- CI check: verify security headers present in production build
- CI check: verify no `console.error` calls in production bundle (use ESLint rule `no-console`)

### Monitoring/logging to add

- Log all failed login attempts with timestamp and IP (server-side)
- Log all admin actions: create, update, delete categories (server-side)
- Alert on >10 failed login attempts from same IP within 5 minutes
- Log token refresh failures (may indicate stolen refresh token)
- Log any attempts to access admin routes with non-admin role
- Alert on WebSocket authentication failures

---

## 7. Questions and Assumptions

### Could not verify from codebase (requires backend audit):

1. Does the Django backend enforce RBAC on `POST/PATCH/DELETE /api/v1/categories/`?
2. Does the Django backend enforce ownership checks on `PATCH/DELETE /api/v1/listings/:id/`?
3. Does the Django backend validate JWT audience (`aud`) and issuer (`iss`) claims?
4. Does the Django backend have rate limiting on `/api/v1/auth/login/`?
5. Are refresh tokens single-use and rotated on each refresh (`POST /api/v1/auth/token/refresh/`)?
6. Does the Django backend validate the `role` field on registration — or can a user submit `"role": "ADMIN"`?
7. What is the JWT access token expiration time? Is there a mechanism to revoke tokens before expiry?
8. Are file uploads validated server-side for content type, size, and malware scanning?
9. Does the Django backend strip sensitive fields from API responses (password hashes, internal IDs)?
10. Are there any DEBUG endpoints or Django Debug Toolbar exposed in production?

### Security assumptions that must be confirmed before launch:

1. **`NEXT_PUBLIC_USE_MOCK=false` is set in the Vercel/Cloudflare deployment environment** — confirmed in `.env.production` file, but verify the actual deployment configuration
2. **The Django backend independently enforces RBAC** — the frontend provides zero server-side security
3. **HTTPS is enforced in production** — Vercel typically handles this; confirm SSL certificate is valid and auto-renews
4. **The Django API does NOT trust the `role` field sent during registration** — it should assign a default role (`BUYER`) server-side
5. **Refresh tokens are invalidated on logout** — confirm Django blacklists them (not just deleted from client)
6. **File upload size and type limits exist server-side** — the 5MB/JPEG+PNG+WebP client-side check is trivially bypassable
7. **The WebSocket server (Django Channels) validates the auth token** on connection and rejects unauthenticated connections
8. **The Django API does not expose stack traces** in error responses to the client (DEBUG=False in Django settings)
9. **Database credentials and JWT signing keys** are stored in environment variables or secrets manager, not in source code
10. **CORS is configured on the Django backend** to only allow requests from `https://sanganai.co.zw` (not `*`)

---

*This audit was conducted on 2026-04-26 against commit history ending at `97fb0b0`. All findings are based on static code analysis of the frontend repository only. The Django backend was not in scope and was not audited.*
