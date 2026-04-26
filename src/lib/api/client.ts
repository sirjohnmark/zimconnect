// ─── Config ───────────────────────────────────────────────────────────────────
//
// Use the real backend URL in BOTH browser and server environments.
// Do NOT leave browser requests as relative "/api/..." unless your Next.js
// rewrite proxy is confirmed working.
//
// Required env vars:
//
// .env.local
// NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
// BACKEND_URL=http://127.0.0.1:8000
//
// Production
// NEXT_PUBLIC_API_URL=https://YOUR-DJANGO-BACKEND-DOMAIN
// BACKEND_URL=https://YOUR-DJANGO-BACKEND-DOMAIN

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.BACKEND_URL ??
  "";

// ─── Error types ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    message: string,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Thrown when fetch itself throws — no network, CORS block, DNS failure, etc. */
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
  /** Query string params — appended to the URL automatically. */
  params?: Record<string, string | number | boolean | undefined | null> | object;

  /** JSON body — serialised and Content-Type set automatically. */
  body?: unknown;

  /**
   * Next.js fetch cache option.
   * Pass `{ revalidate: 60 }` or `{ tags: ["listings"] }`
   * for ISR / on-demand revalidation.
   */
  next?: NextFetchRequestConfig;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function joinUrl(baseUrl: string, path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

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

  // Do not add trailing slash after file-like URLs.
  // API endpoints should normally get a slash for Django/DRF.
  if (!parsed.pathname.endsWith("/")) {
    parsed.pathname += "/";
  }

  return parsed.toString();
}

function getClientAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem("sanganai_access");
  } catch {
    return null;
  }
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    params,
    body,
    next,
    headers: extraHeaders,
    ...rest
  } = options;

  let rawUrl = joinUrl(BASE_URL, path);
  rawUrl = ensureTrailingSlash(rawUrl);

  const url = new URL(rawUrl);

  if (params) {
    for (const [key, value] of Object.entries(
      params as Record<string, unknown>,
    )) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(extraHeaders as Record<string, string>),
  };

  const token = getClientAccessToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;

  try {
    res = await fetch(url.toString(), {
      ...rest,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      redirect: "manual",
      ...(next ? { next } : {}),
    });
  } catch (err) {
    throw new NetworkError(
      "Unable to reach the server. Check your connection, backend URL, or CORS settings.",
      err,
    );
  }

  let data: unknown = null;
  const contentType = res.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      data = await res.text();
    }
  } catch {
    data = null;
  }

  // Surface redirects instead of silently following them into a loop.
  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get("location") ?? "(no location header)";

    throw new ApiError(
      res.status,
      res.statusText,
      `Unexpected redirect to ${location}. Check your API URL, Django slash settings, HTTPS settings, or domain redirects.`,
      data,
    );
  }

  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;

    if (typeof data === "object" && data !== null) {
      const d = data as Record<string, unknown>;
      const errObj = d.error as Record<string, unknown> | undefined;

      if (typeof errObj?.message === "string") {
        message = errObj.message;
      } else if (typeof d.message === "string") {
        message = d.message;
      } else if (typeof d.detail === "string") {
        message = d.detail;
      } else {
        const fieldErrors = Object.entries(d)
          .filter(([, value]) => Array.isArray(value))
          .map(([key, value]) => `${key}: ${(value as unknown[]).join(", ")}`)
          .join(" | ");

        if (fieldErrors) {
          message = fieldErrors;
        }
      }
    } else if (typeof data === "string" && data.trim()) {
      message = data;
    }

    throw new ApiError(res.status, res.statusText, message, data);
  }

  return data as T;
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

export const api = {
  get<T>(
    path: string,
    options?: Omit<RequestOptions, "body">,
  ): Promise<T> {
    return request<T>(path, {
      ...options,
      method: "GET",
    });
  },

  post<T>(
    path: string,
    body: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return request<T>(path, {
      ...options,
      method: "POST",
      body,
    });
  },

  put<T>(
    path: string,
    body: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return request<T>(path, {
      ...options,
      method: "PUT",
      body,
    });
  },

  patch<T>(
    path: string,
    body: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return request<T>(path, {
      ...options,
      method: "PATCH",
      body,
    });
  },

  delete<T>(
    path: string,
    options?: RequestOptions,
  ): Promise<T> {
    return request<T>(path, {
      ...options,
      method: "DELETE",
    });
  },
};