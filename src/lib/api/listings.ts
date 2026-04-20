import { api } from "./client";
import { getAccessToken } from "@/lib/auth/auth";
import type { Listing, ListingCondition, ListingCurrency, ListingImage } from "@/types/listing";

// ─── Param / response types ───────────────────────────────────────────────────

export interface GetListingsParams {
  search?: string;
  category?: string;      // category slug
  location?: string;      // Zimbabwe city code e.g. "HARARE"
  min_price?: number;
  max_price?: number;
  condition?: ListingCondition;
  featured?: boolean;
  ordering?: string;      // e.g. "-created_at", "price", "-views_count"
  page?: number;
  page_size?: number;     // max 100
}

export interface PaginatedListings {
  count: number;
  next: string | null;
  previous: string | null;
  results: Listing[];
}

export interface CreateListingBody {
  title: string;
  description: string;
  price: string;          // decimal string e.g. "5000.00"
  currency: ListingCurrency;
  condition: ListingCondition;
  category_id: number;
  location: string;       // Zimbabwe city code
}

export interface UploadedImage {
  images: ListingImage[];
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

export async function getListings(params: GetListingsParams = {}): Promise<PaginatedListings> {
  return api.get<PaginatedListings>("/api/v1/listings/", {
    params: params as Record<string, string | number | boolean | undefined | null>,
    next: { revalidate: 60 },
  });
}

export async function getListing(id: number): Promise<Listing> {
  return api.get<Listing>(`/api/v1/listings/${id}/`, {
    next: { revalidate: 60, tags: [`listing-${id}`] },
  });
}

export async function getListingBySlug(slug: string): Promise<Listing> {
  // The API doesn't have a slug endpoint; search by slug in the listings list
  const res = await api.get<PaginatedListings>("/api/v1/listings/", {
    params: { search: slug },
    next: { revalidate: 60, tags: [`listing-slug-${slug}`] },
  });
  const match = res.results.find((l) => l.slug === slug);
  if (!match) throw new Error(`Listing with slug "${slug}" not found`);
  return match;
}

export async function getMyListings(params: GetListingsParams = {}): Promise<PaginatedListings> {
  return api.get<PaginatedListings>("/api/v1/listings/my-listings/", {
    params: params as Record<string, string | number | boolean | undefined | null>,
  });
}

export async function createListing(body: CreateListingBody): Promise<Listing> {
  return api.post<Listing>("/api/v1/listings/", body);
}

export async function updateListing(id: number, body: Partial<CreateListingBody>): Promise<Listing> {
  return api.patch<Listing>(`/api/v1/listings/${id}/`, body);
}

export async function publishListing(id: number): Promise<void> {
  await api.post<{ message: string }>(`/api/v1/listings/${id}/publish/`, {});
}

export async function deleteListing(id: number): Promise<void> {
  return api.delete<void>(`/api/v1/listings/${id}/`);
}

export async function uploadImages(listingId: number, files: File[]): Promise<ListingImage[]> {
  const form = new FormData();
  files.forEach((file) => form.append("images", file));

  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/listings/${listingId}/images/`,
    { method: "POST", headers, body: form },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Image upload failed: ${res.status} ${text}`);
  }

  const data = await res.json() as { images: ListingImage[] };
  return data.images;
}

export async function deleteImage(imageId: number): Promise<void> {
  return api.delete<void>(`/api/v1/listings/images/${imageId}/`);
}
