import { getMemoryToken, setMemoryToken as _setMemoryToken } from "@/lib/auth/auth";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.BACKEND_URL ??
  "";

// ─── Error types ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status:     number,
    public readonly statusText: string,
    message: string,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "NetworkError";
  }
}

// ─── Request options ──────────────────────────────────────────────────────────

export interface RequestOptions extends Omit<RequestInit, "body"> {
  params?: Record<string, string | number | boolean | undefined | null> | object;
  body?:   unknown;
  next?:   NextFetchRequestConfig;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function joinUrl(baseUrl: string, path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (!baseUrl) {
    throw new NetworkError(
      "Missing NEXT_PUBLIC_API_URL. Set it to your Django backend URL.",
    );
  }
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

function ensureTrailingSlash(url: string): string {
  const parsed = new URL(url);
  if (!parsed.pathname.endsWith("/")) parsed.pathname += "/";
  return parsed.toString();
}

function getClientAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  // Token lives in memory only — never in localStorage (VULN-01 fix)
  return getMemoryToken();
}

// ─── Error message sanitisation ───────────────────────────────────────────────
// Map raw backend messages to user-friendly strings so internal details
// (field names, stack hints, endpoint shapes) are never shown in the UI.

const SAFE_MESSAGES: Record<string, string> = {
  "No active account found with the given credentials": "Incorrect email or password.",
  "Token is invalid or expired":                        "Your session has expired. Please log in again.",
  "This field may not be blank.":                       "Please fill in all required fields.",
  "This field is required.":                            "Please fill in all required fields.",
};

function sanitiseMessage(status: number, raw: string): string {
  if (SAFE_MESSAGES[raw]) return SAFE_MESSAGES[raw];
  if (status >= 500) return "Something went wrong on our end. Please try again later.";
  if (status === 429) return "Too many requests. Please wait a moment and try again.";
  if (status === 404) return "The requested resource was not found.";
  // For other 4xx pass through — these are typically validation messages safe to show
  return raw;
}

// ─── Singleton refresh (prevents concurrent 401s from each firing a new refresh) ─

let _refreshPromise: Promise<string> | null = null;

async function doRefresh(): Promise<string> {
  const { refreshAccessToken } = await import("@/lib/api/auth");
  const token = await refreshAccessToken();
  _setMemoryToken(token);
  return token;
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestOptions = {},
  isRetry = false,
): Promise<T> {
  const { params, body, next, headers: extraHeaders, ...rest } = options;

  let rawUrl = joinUrl(BASE_URL, path);
  rawUrl = ensureTrailingSlash(rawUrl);

  const url = new URL(rawUrl);
  if (params) {
    for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(extraHeaders as Record<string, string>),
  };

  const token = getClientAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  // Abort after 15 s — prevents requests hanging forever (VULN-12 fix)
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 15_000);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      ...rest,
      headers,
      body:     body !== undefined ? JSON.stringify(body) : undefined,
      redirect: "manual",
      signal:   controller.signal,
      ...(next ? { next } : {}),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new NetworkError("Request timed out. Please check your connection and try again.", err);
    }
    throw new NetworkError(
      "Unable to reach the server. Check your connection, backend URL, or CORS settings.",
      err,
    );
  } finally {
    clearTimeout(timeoutId);
  }

  let data: unknown = null;
  const contentType = res.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) data = await res.json();
    else data = await res.text();
  } catch {
    data = null;
  }

  // Surface redirects as errors
  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get("location") ?? "(no location header)";
    throw new ApiError(
      res.status,
      res.statusText,
      `Unexpected redirect to ${location}. Check your API URL and Django settings.`,
      data,
    );
  }

  // 401 → try token refresh once (singleton — all concurrent callers share the same promise)
  if (res.status === 401 && !isRetry) {
    try {
      if (!_refreshPromise) {
        _refreshPromise = doRefresh().finally(() => { _refreshPromise = null; });
      }
      await _refreshPromise;
      return request<T>(path, options, true); // retry with new token
    } catch {
      throw new ApiError(401, "Unauthorized", "Your session has expired. Please log in again.");
    }
  }

  // 403 → clear permission error so admin pages can distinguish it from a network failure
  if (res.status === 403) {
    throw new ApiError(403, "Forbidden", "You do not have permission to perform this action.", data);
  }

  if (!res.ok) {
    let rawMessage = `${res.status} ${res.statusText}`;

    if (typeof data === "object" && data !== null) {
      const d = data as Record<string, unknown>;
      const errObj = d.error as Record<string, unknown> | undefined;
      if (typeof errObj?.message === "string")        rawMessage = errObj.message;
      else if (typeof d.message === "string")          rawMessage = d.message;
      else if (typeof d.detail === "string")           rawMessage = d.detail;
      else {
        const fieldErrors = Object.entries(d)
          .filter(([, v]) => Array.isArray(v))
          .map(([k, v]) => `${k}: ${(v as unknown[]).join(", ")}`)
          .join(" | ");
        if (fieldErrors) rawMessage = fieldErrors;
      }
    } else if (typeof data === "string" && data.trim()) {
      rawMessage = data;
    }

    throw new ApiError(res.status, res.statusText, sanitiseMessage(res.status, rawMessage), data);
  }

  return data as T;
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

export const api = {
  get<T>(path: string, options?: Omit<RequestOptions, "body">): Promise<T> {
    return request<T>(path, { ...options, method: "GET" });
  },
  post<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(path, { ...options, method: "POST", body });
  },
  put<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(path, { ...options, method: "PUT", body });
  },
  patch<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(path, { ...options, method: "PATCH", body });
  },
  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>(path, { ...options, method: "DELETE" });
  },
};
