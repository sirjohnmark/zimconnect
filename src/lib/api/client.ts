// ─── Config ───────────────────────────────────────────────────────────────────

// Browser: relative paths — Next.js rewrite proxy forwards to the backend (no CORS).
// Server (SSR/ISR): absolute URL so fetch bypasses the proxy entirely.
const BASE_URL =
  typeof window === "undefined"
    ? (process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "")
    : "";

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
   * Pass `{ revalidate: 60 }` or `{ tags: ["listings"] }` for ISR / on-demand revalidation.
   */
  next?: NextFetchRequestConfig;
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { params, body, next, headers: extraHeaders, ...rest } = options;

  // Build URL — on the server use absolute URL, in the browser use relative path (proxied by Next.js)
  const rawUrl = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const url = new URL(rawUrl, typeof window !== "undefined" ? window.location.href : "http://localhost");
  if (params) {
    for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(extraHeaders as Record<string, string>),
  };

  // Inject Bearer token when available (client-side only)
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("sanganai_access");
    if (token) headers["Authorization"] = `Bearer ${token}`;
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
      "Unable to reach the server. Check your connection or try again later.",
      err,
    );
  }

  // Parse body — always attempt JSON, fall back to text
  let data: unknown;
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  // Don't follow redirects — surface them as errors to avoid loops
  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get("location") ?? "(no location header)";
    throw new ApiError(
      res.status,
      res.statusText,
      `Unexpected redirect to ${location}. The API endpoint may be misconfigured.`,
      data,
    );
  }

  if (!res.ok) {
    // Parse DRF and custom API error envelopes:
    // { error: { message } } | { message } | { detail } | { field: [msg, ...] }
    let message = `${res.status} ${res.statusText}`;
    if (typeof data === "object" && data !== null) {
      const d = data as Record<string, unknown>;
      const errObj = d["error"] as Record<string, unknown> | undefined;
      if (typeof errObj?.["message"] === "string") {
        message = errObj["message"] as string;
      } else if (typeof d["message"] === "string") {
        message = d["message"] as string;
      } else if (typeof d["detail"] === "string") {
        message = d["detail"] as string;
      } else {
        // Collect DRF field-level errors: { email: ["...", ...], ... }
        const fieldErrors = Object.entries(d)
          .filter(([, v]) => Array.isArray(v))
          .map(([k, v]) => `${k}: ${(v as unknown[]).join(", ")}`)
          .join(" | ");
        if (fieldErrors) message = fieldErrors;
      }
    }
    throw new ApiError(res.status, res.statusText, message, data);
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
