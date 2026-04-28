import { api } from "./client";

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

// ─── API functions ────────────────────────────────────────────────────────────

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
