import { api, ApiError, NetworkError } from "./client";
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
  national_id?: File;           // at least one of national_id / passport is required
  passport?: File;
  company_registration?: File;
}

export interface AdminUpgradeRequest extends SellerUpgradeRequest {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  national_id_url:          string | null;
  passport_url:             string | null;
  company_registration_url: string | null;
}

export interface PaginatedUpgradeRequests {
  count:    number;
  next:     string | null;
  previous: string | null;
  results:  AdminUpgradeRequest[];
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
    _mockAdminRequests.push({
      ..._mockRequest,
      user_id: 1,
      username: "mock-buyer",
      email: "buyer@mock.local",
      full_name: "Mock Buyer",
      national_id_url: null,
      passport_url: null,
      company_registration_url: null,
    });
    return _mockRequest;
  }

  const token = getAccessToken();
  const form  = new FormData();
  form.append("business_type",        data.business_type);
  form.append("business_name",        data.business_name);
  if (data.business_description) {
    form.append("business_description", data.business_description);
  }
  if (data.national_id)  form.append("national_id", data.national_id);
  if (data.passport)     form.append("passport",    data.passport);
  if (data.company_registration) {
    form.append("company_registration", data.company_registration);
  }

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(`/api/v1/auth/upgrade-to-seller/`, {
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
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new NetworkError("Upload timed out. Please try again.", err);
    }
    throw new NetworkError("Unable to connect to server.", err);
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

// ─── Admin API functions ──────────────────────────────────────────────────────

let _mockAdminRequests: AdminUpgradeRequest[] = [];

export async function getAdminUpgradeRequests(params?: {
  status?: "PENDING" | "APPROVED" | "REJECTED";
  page?: number;
  page_size?: number;
}): Promise<PaginatedUpgradeRequests> {
  if (USE_MOCK) {
    let results = [..._mockAdminRequests];
    if (params?.status) results = results.filter((r) => r.status === params.status);
    return { count: results.length, next: null, previous: null, results };
  }
  return api.get<PaginatedUpgradeRequests>("/api/v1/admin/upgrade-requests/", { params });
}

export async function approveUpgradeRequest(id: number): Promise<AdminUpgradeRequest> {
  if (USE_MOCK) {
    const req = _mockAdminRequests.find((r) => r.id === id);
    if (!req) throw new ApiError(404, "Not Found", "Request not found");
    req.status = "APPROVED";
    req.reviewed_at = new Date().toISOString();
    return { ...req };
  }
  return api.post<AdminUpgradeRequest>(`/api/v1/admin/upgrade-requests/${id}/approve/`, {});
}

export async function rejectUpgradeRequest(id: number, reason: string): Promise<AdminUpgradeRequest> {
  if (USE_MOCK) {
    const req = _mockAdminRequests.find((r) => r.id === id);
    if (!req) throw new ApiError(404, "Not Found", "Request not found");
    req.status = "REJECTED";
    req.rejection_reason = reason;
    req.reviewed_at = new Date().toISOString();
    return { ...req };
  }
  return api.post<AdminUpgradeRequest>(`/api/v1/admin/upgrade-requests/${id}/reject/`, { reason });
}
