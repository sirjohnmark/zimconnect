import { api, ApiError } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SellerUpgradeRequest {
  id: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  business_name: string;
  business_description: string | null;
  rejection_reason: string | null;
  requested_at: string;
  reviewed_at: string | null;
}

// ─── Mock helpers ─────────────────────────────────────────────────────────────

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

let _mockRequest: SellerUpgradeRequest | null = null;

// ─── API functions ────────────────────────────────────────────────────────────

export async function submitUpgradeRequest(
  business_name: string,
  business_description?: string,
): Promise<SellerUpgradeRequest> {
  if (USE_MOCK) {
    if (_mockRequest?.status === "PENDING") {
      throw new ApiError(409, "Conflict", "You already have a pending upgrade request.");
    }
    _mockRequest = {
      id: Date.now(),
      status: "PENDING",
      business_name,
      business_description: business_description ?? null,
      rejection_reason: null,
      requested_at: new Date().toISOString(),
      reviewed_at: null,
    };
    return _mockRequest;
  }
  return api.post<SellerUpgradeRequest>("/api/v1/auth/upgrade-to-seller", {
    business_name,
    business_description,
  });
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
