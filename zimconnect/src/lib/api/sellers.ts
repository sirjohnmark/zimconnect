import { api, ApiError } from "./client";
import { getStoredUser } from "@/lib/auth/auth";
import type { AuthUser } from "./auth";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SellerProfile {
  id: number;
  user: {
    username: string;
    profile_picture: string | null;
    location: string;
    member_since: string;
  };
  shop_name: string;
  shop_description: string | null;
  response_time_hours: number | null;
  active_listings_count: number;
  created_at: string;
  updated_at?: string;
}

export interface SellerProfileUpdate {
  shop_name?: string;
  shop_description?: string;
  response_time_hours?: number;
}

export interface SellerApplication {
  id: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  business_name: string;
  business_description: string;
  rejection_reason: string;
  requested_at: string;
  reviewed_at: string | null;
}

export interface SellerDashboardListingPreview {
  id: number;
  title: string;
  slug: string;
  status: string;
  price: string;
  currency: string;
  primary_image: { image: string; is_primary: boolean } | null;
  created_at: string;
}

export interface SellerDashboard {
  user: AuthUser;
  seller_profile: {
    id: number;
    user: AuthUser;
    shop_name: string;
    shop_description: string;
    response_time_hours: number | null;
    active_listings_count: number;
    created_at: string;
    updated_at: string;
  };
  listing_stats: {
    total: number;
    draft: number;
    active: number;
    sold: number;
    rejected: number;
  };
  recent_listings: SellerDashboardListingPreview[];
}

export interface AdminSellerRequest {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  status: "PENDING" | "APPROVED" | "REJECTED";
  business_name: string;
  business_description: string;
  rejection_reason: string | null;
  requested_at: string;
  reviewed_at: string | null;
}

// ─── Mock helpers ─────────────────────────────────────────────────────────────

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

let _mockSellerProfile: SellerProfile = {
  id: 1,
  user: {
    username: "mock_seller",
    profile_picture: null,
    location: "HARARE",
    member_since: new Date().toISOString(),
  },
  shop_name: "My Shop",
  shop_description: null,
  response_time_hours: null,
  active_listings_count: 0,
  created_at: new Date().toISOString(),
};

let _mockApplication: SellerApplication | null = null;
const _mockAdminRequests: AdminSellerRequest[] = [];

function mockStoredUser(): AuthUser {
  return getStoredUser() as unknown as AuthUser;
}

// ─── Existing public profile functions ────────────────────────────────────────

export async function getPublicSellerProfile(username: string): Promise<SellerProfile> {
  if (USE_MOCK) return { ..._mockSellerProfile, user: { ..._mockSellerProfile.user, username } };
  return api.get<SellerProfile>(`/api/v1/sellers/${username}`, {
    next: { revalidate: 60 },
  });
}

export async function getMySellerProfile(): Promise<SellerProfile> {
  if (USE_MOCK) return _mockSellerProfile;
  return api.get<SellerProfile>("/api/v1/sellers/me");
}

export async function updateMySellerProfile(data: SellerProfileUpdate): Promise<SellerProfile> {
  if (USE_MOCK) {
    _mockSellerProfile = {
      ..._mockSellerProfile,
      ...data,
      updated_at: new Date().toISOString(),
    };
    return _mockSellerProfile;
  }
  return api.patch<SellerProfile>("/api/v1/sellers/me", data);
}

// ─── Seller application ───────────────────────────────────────────────────────

export async function applyToSell(data: {
  business_name: string;
  business_description: string;
}): Promise<SellerApplication> {
  if (USE_MOCK) {
    if (_mockApplication?.status === "PENDING") {
      throw new ApiError(409, "Conflict", "You already have a pending application.");
    }
    const stored = mockStoredUser();
    _mockApplication = {
      id: Date.now(),
      status: "PENDING",
      business_name: data.business_name,
      business_description: data.business_description,
      rejection_reason: "",
      requested_at: new Date().toISOString(),
      reviewed_at: null,
    };
    _mockAdminRequests.push({
      id: _mockApplication.id,
      user: {
        id: stored?.id ?? 1,
        username: stored?.username ?? "user",
        email: stored?.email ?? "",
        first_name: stored?.first_name ?? "",
        last_name: stored?.last_name ?? "",
      },
      status: "PENDING",
      business_name: data.business_name,
      business_description: data.business_description,
      rejection_reason: null,
      requested_at: _mockApplication.requested_at,
      reviewed_at: null,
    });
    return _mockApplication;
  }
  return api.post<SellerApplication>("/api/v1/sellers/apply", data);
}

export async function getSellerApplicationStatus(): Promise<SellerApplication | null> {
  if (USE_MOCK) return _mockApplication;
  try {
    return await api.get<SellerApplication>("/api/v1/sellers/application-status");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

// ─── Seller dashboard ─────────────────────────────────────────────────────────

export async function getSellerDashboard(): Promise<SellerDashboard> {
  if (USE_MOCK) {
    const stored = mockStoredUser();
    return {
      user: stored,
      seller_profile: {
        id: 1,
        user: stored,
        shop_name: _mockSellerProfile.shop_name,
        shop_description: _mockSellerProfile.shop_description ?? "",
        response_time_hours: _mockSellerProfile.response_time_hours,
        active_listings_count: _mockSellerProfile.active_listings_count,
        created_at: _mockSellerProfile.created_at,
        updated_at: new Date().toISOString(),
      },
      listing_stats: { total: 0, draft: 0, active: 0, sold: 0, rejected: 0 },
      recent_listings: [],
    };
  }
  return api.get<SellerDashboard>("/api/v1/sellers/dashboard");
}

// ─── Seller listings ──────────────────────────────────────────────────────────

export async function getSellerListings(
  status?: string,
): Promise<SellerDashboardListingPreview[]> {
  if (USE_MOCK) return [];
  const params = status ? { status } : undefined;
  const response = await api.get<
    { count: number; results: SellerDashboardListingPreview[] } | SellerDashboardListingPreview[]
  >("/api/v1/sellers/listings", { params });
  return Array.isArray(response) ? response : (response.results ?? []);
}

// ─── Admin seller requests ────────────────────────────────────────────────────

export async function getAdminSellerRequests(
  status?: "PENDING" | "APPROVED" | "REJECTED",
): Promise<AdminSellerRequest[]> {
  if (USE_MOCK) {
    return status
      ? _mockAdminRequests.filter((r) => r.status === status)
      : _mockAdminRequests;
  }
  const params = status ? { status } : undefined;
  const response = await api.get<
    { count: number; results: AdminSellerRequest[] } | AdminSellerRequest[]
  >("/api/v1/admin/seller-requests", { params });
  return Array.isArray(response) ? response : (response.results ?? []);
}

export async function approveSellerRequest(id: number): Promise<void> {
  if (USE_MOCK) {
    const req = _mockAdminRequests.find((r) => r.id === id);
    if (req) {
      req.status = "APPROVED";
      req.reviewed_at = new Date().toISOString();
    }
    if (_mockApplication?.id === id) {
      _mockApplication.status = "APPROVED";
      _mockApplication.reviewed_at = new Date().toISOString();
    }
    return;
  }
  await api.post<void>(`/api/v1/admin/seller-requests/${id}/approve`, {});
}

export async function rejectSellerRequest(id: number, reason: string): Promise<void> {
  if (USE_MOCK) {
    const req = _mockAdminRequests.find((r) => r.id === id);
    if (req) {
      req.status = "REJECTED";
      req.rejection_reason = reason;
      req.reviewed_at = new Date().toISOString();
    }
    if (_mockApplication?.id === id) {
      _mockApplication.status = "REJECTED";
      _mockApplication.rejection_reason = reason;
      _mockApplication.reviewed_at = new Date().toISOString();
    }
    return;
  }
  await api.post<void>(`/api/v1/admin/seller-requests/${id}/reject`, { reason });
}
