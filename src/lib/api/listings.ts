import { z } from "zod";

import { api, ApiError, NetworkError } from "./client";
import { getMemoryToken, getStoredUser } from "@/lib/auth/auth";
import { assertPermission } from "@/lib/auth/permissions";
import type { Listing, ListingCondition, ListingCurrency, ListingImage } from "@/types/listing";

export const LISTING_CONDITIONS = [
  "NEW",
  "LIKE_NEW",
  "GOOD",
  "FAIR",
  "POOR",
] as const;

export const ZIMBABWE_CITIES = [
  "HARARE",
  "BULAWAYO",
  "MUTARE",
  "GWERU",
  "KWEKWE",
  "KADOMA",
  "MASVINGO",
  "CHINHOYI",
  "BINDURA",
  "CHEGUTU",
  "MARONDERA",
  "KAROI",
  "VICTORIA_FALLS",
  "HWANGE",
  "BEITBRIDGE",
  "CHITUNGWIZA",
  "EPWORTH",
  "NORTON",
  "RUWA",
  "ZVISHAVANE",
  "CHIREDZI",
  "CHIPINGE",
  "RUSAPE",
  "PLUMTREE",
  "GWANDA",
  "SHURUGWI",
  "REDCLIFF",
  "KARIBA",
  "NYANGA",
  "MVURWI",
  "GOKWE",
  "LUPANE",
  "TRIANGLE",
  "OTHER",
] as const;

export const CITY_LABELS: Record<(typeof ZIMBABWE_CITIES)[number], string> = {
  HARARE: "Harare",
  BULAWAYO: "Bulawayo",
  MUTARE: "Mutare",
  GWERU: "Gweru",
  KWEKWE: "Kwekwe",
  KADOMA: "Kadoma",
  MASVINGO: "Masvingo",
  CHINHOYI: "Chinhoyi",
  BINDURA: "Bindura",
  CHEGUTU: "Chegutu",
  MARONDERA: "Marondera",
  KAROI: "Karoi",
  VICTORIA_FALLS: "Victoria Falls",
  HWANGE: "Hwange",
  BEITBRIDGE: "Beitbridge",
  CHITUNGWIZA: "Chitungwiza",
  EPWORTH: "Epworth",
  NORTON: "Norton",
  RUWA: "Ruwa",
  ZVISHAVANE: "Zvishavane",
  CHIREDZI: "Chiredzi",
  CHIPINGE: "Chipinge",
  RUSAPE: "Rusape",
  PLUMTREE: "Plumtree",
  GWANDA: "Gwanda",
  SHURUGWI: "Shurugwi",
  REDCLIFF: "Redcliff",
  KARIBA: "Kariba",
  NYANGA: "Nyanga",
  MVURWI: "Mvurwi",
  GOKWE: "Gokwe",
  LUPANE: "Lupane",
  TRIANGLE: "Triangle",
  OTHER: "Other",
};

export const CONDITION_LABELS: Record<(typeof LISTING_CONDITIONS)[number], string> = {
  NEW: "New",
  LIKE_NEW: "Like new",
  GOOD: "Good",
  FAIR: "Fair",
  POOR: "Poor",
};

export const createListingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Add a clearer title")
    .max(100, "Keep the title under 100 characters"),

  description: z
    .string()
    .trim()
    .min(20, "Add more detail about the item")
    .max(2000, "Keep the description under 2000 characters"),

  price: z
    .string()
    .trim()
    .min(1, "Enter a price")
    .refine(
      (value) => {
        const price = Number(value);
        return Number.isFinite(price) && price > 0;
      },
      "Enter a valid price",
    ),

  currency: z.enum(["USD", "ZWL"], {
    error: "Choose a currency",
  }),

  condition: z.enum(LISTING_CONDITIONS, {
    error: "Choose the item condition",
  }),

  category_id: z
    .number({
      error: "Choose a category",
    })
    .int("Choose a category")
    .positive("Choose a category"),

  location: z.enum(ZIMBABWE_CITIES, {
    error: "Choose a location",
  }),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;

// ─── API types ────────────────────────────────────────────────────────────────

export interface PaginatedListings {
  count: number;
  next: string | null;
  previous: string | null;
  results: Listing[];
}

export interface GetListingsParams {
  page?: number;
  page_size?: number;
  search?: string;
  category?: number | string;
  condition?: string;
  location?: string;
  currency?: string;
  min_price?: number;
  max_price?: number;
  ordering?: string;
  featured?: boolean;
  status?: string;
}

export interface CreateListingPayload {
  title: string;
  description: string;
  price: string;
  currency: ListingCurrency;
  condition: ListingCondition;
  category_id: number;
  location: string;
}

/** Alias for CreateListingPayload — used by the mock/data layer */
export type CreateListingBody = CreateListingPayload;

export interface AdminListingsParams {
  page?: number;
  page_size?: number;
  status?: string;
  search?: string;
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

export async function getListings(
  params: GetListingsParams = {},
): Promise<PaginatedListings> {
  return api.get<PaginatedListings>("/api/v1/listings/", {
    params: params as Record<string, string | number | boolean | undefined | null>,
  });
}

export async function getListing(id: number): Promise<Listing> {
  return api.get<Listing>(`/api/v1/listings/${id}/`);
}

export async function getListingBySlug(slug: string): Promise<Listing> {
  return api.get<Listing>(`/api/v1/listings/${slug}/`);
}

export async function getMyListings(
  params: GetListingsParams = {},
): Promise<PaginatedListings> {
  return api.get<PaginatedListings>("/api/v1/listings/my/", {
    params: params as Record<string, string | number | boolean | undefined | null>,
  });
}

export async function createListing(
  data: CreateListingPayload,
): Promise<Listing> {
  assertPermission(getStoredUser(), "manage:own-listings");
  return api.post<Listing>("/api/v1/listings/", data);
}

export async function uploadImages(
  listingId: number,
  files: File[],
): Promise<ListingImage[]> {
  const url = `/api/v1/listings/${listingId}/upload-images/`;

  const formData = new FormData();
  for (const file of files) {
    formData.append("images", file);
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const token = getMemoryToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000); // 60 s for uploads

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new NetworkError("Upload timed out. Please try again.", err);
    }
    throw new NetworkError("Unable to connect to server.", err);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (typeof data?.detail === "string") message = data.detail;
      else if (typeof data?.message === "string") message = data.message;
    } catch { /* use default */ }
    throw new ApiError(res.status, res.statusText, message);
  }

  return res.json() as Promise<ListingImage[]>;
}

export async function publishListing(id: number): Promise<Listing> {
  assertPermission(getStoredUser(), "manage:own-listings");
  return api.post<Listing>(`/api/v1/listings/${id}/publish/`, {});
}

export async function deleteListing(id: number): Promise<void> {
  assertPermission(getStoredUser(), "manage:own-listings");
  await api.delete<void>(`/api/v1/listings/${id}/`);
}

// ─── Admin endpoints ──────────────────────────────────────────────────────────

export async function getAllListingsAdmin(
  params: AdminListingsParams = {},
): Promise<PaginatedListings> {
  assertPermission(getStoredUser(), "moderate:listings");
  return api.get<PaginatedListings>("/api/v1/admin/listings/moderation/", {
    params: params as Record<string, string | number | boolean | undefined | null>,
  });
}

export async function approveListing(id: number): Promise<void> {
  assertPermission(getStoredUser(), "moderate:listings");
  await api.post<void>(`/api/v1/admin/listings/moderation/${id}/approve/`, {});
}

export async function rejectListing(id: number, reason: string): Promise<void> {
  assertPermission(getStoredUser(), "moderate:listings");
  await api.post<void>(`/api/v1/admin/listings/moderation/${id}/reject/`, { reason });
}

export async function featureListing(
  id: number,
  featured: boolean,
): Promise<void> {
  assertPermission(getStoredUser(), "moderate:listings");
  await api.post<void>(`/api/v1/admin/listings/${id}/feature/`, {
    is_featured: featured,
  });
}

// ─── Trash endpoints ──────────────────────────────────────────────────────────

export interface DeletedListing {
  id: number;
  title: string;
  owner: { email: string; username: string };
  category: { name: string; slug: string } | null;
  location: string;
  price: string;
  currency: string;
  status: string;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: { id: number; email: string; username: string } | null;
  created_at: string;
}

export interface PaginatedDeletedListings {
  count: number;
  next: string | null;
  previous: string | null;
  results: DeletedListing[];
}

export async function getDeletedListings(page = 1): Promise<PaginatedDeletedListings> {
  assertPermission(getStoredUser(), "manage:users");
  return api.get<PaginatedDeletedListings>("/api/v1/admin/listings/deleted/", {
    params: { page },
  });
}

export async function restoreListing(id: number): Promise<DeletedListing> {
  assertPermission(getStoredUser(), "manage:users");
  return api.post<DeletedListing>(`/api/v1/admin/listings/${id}/restore/`, {});
}