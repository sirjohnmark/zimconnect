import { api, ApiError } from "./client";
import { getAccessToken } from "@/lib/auth/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BusinessType = "individual" | "company";

export interface SellerUpgradeRequest {
  id: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  business_type: BusinessType;
  business_name: string;
  business_description: string | null;
  rejection_reason: string | null;
  requested_at: string;
  reviewed_at: string | null;
}

export interface SubmitUpgradeData {
  business_type: BusinessType;
  business_name: string;
  business_description?: string;
  national_id: File;
  passport: File;
  company_registration?: File;
}

// ─── Mock helpers ─────────────────────────────────────────────────────────────

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

let _mockRequest: SellerUpgradeRequest | null = null;

// ─── API functions ────────────────────────────────────────────────────────────

export async function submitUpgradeRequest(
  data: SubmitUpgradeData,
): Promise<SellerUpgradeRequest> {
  if (USE_MOCK) {
    if (_mockRequest?.status === "PENDING") {
      throw new ApiError(409, "Conflict", "You already have a pending upgrade request.");
    }
    await new Promise((r) => setTimeout(r, 800));
    _mockRequest = {
      id: Date.now(),
      status: "PENDING",
      business_type: data.business_type,
      business_name: data.business_name,
      business_description: data.business_description ?? null,
      rejection_reason: null,
      requested_at: new Date().toISOString(),
      reviewed_at: null,
    };
    return _mockRequest;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured");

  const token = getAccessToken();
  const form  = new FormData();
  form.append("business_type",        data.business_type);
  form.append("business_name",        data.business_name);
  if (data.business_description) {
    form.append("business_description", data.business_description);
  }
  form.append("national_id",  data.national_id);
  form.append("passport",     data.passport);
  if (data.company_registration) {
    form.append("company_registration", data.company_registration);
  }

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(`${apiUrl}/api/v1/auth/upgrade-to-seller/`, {
      method:  "POST",
      headers,
      body:    form,
      signal:  controller.signal,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as Record<string, unknown>;
      const msg  = (body.detail as string) || (body.message as string) || "Submission failed";
      throw new ApiError(res.status, res.statusText, msg);
    }
    return res.json() as Promise<SellerUpgradeRequest>;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getUpgradeStatus(): Promise<SellerUpgradeRequest | null> {
  if (USE_MOCK) return _mockRequest;
  try {
    return await api.get<SellerUpgradeRequest>("/api/v1/auth/upgrade-status");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
