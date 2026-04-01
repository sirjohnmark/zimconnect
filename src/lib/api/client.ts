// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

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

  // Build URL
  const url = new URL(path.startsWith("http") ? path : `${BASE_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  // Build headers
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...extraHeaders,
  };

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      credentials: "include",
      ...rest,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      // Next.js-specific cache config
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

  if (!res.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as Record<string, unknown>).message === "string"
        ? (data as { message: string }).message
        : `${res.status} ${res.statusText}`;

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
