import { api } from "./client";
import { getAccessToken } from "@/lib/auth/auth";

// ─── File validation ──────────────────────────────────────────────────────────

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES      = 10 * 1024 * 1024; // 10 MB per image for listings

function validateImageFiles(files: File[]): void {
  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type))
      throw new Error(`"${file.name}" is not a supported image type. Use JPEG, PNG, or WebP.`);
    if (file.size > MAX_IMAGE_BYTES)
      throw new Error(`"${file.name}" exceeds the 10 MB size limit.`);
  }
}
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
  return api.get<PaginatedListings>("/api/v1/listings", {
    params: params as Record<string, string | number | boolean | undefined | null>,
    next: { revalidate: 60 },
  });
}

export async function getListing(id: number): Promise<Listing> {
  return api.get<Listing>(`/api/v1/listings/${id}`, {
    next: { revalidate: 60, tags: [`listing-${id}`] },
  });
}

export async function getListingBySlug(slug: string): Promise<Listing> {
  // The API doesn't have a slug endpoint; search by slug in the listings list
  const res = await api.get<PaginatedListings>("/api/v1/listings", {
    params: { search: slug },
    next: { revalidate: 60, tags: [`listing-slug-${slug}`] },
  });
  const match = res.results.find((l) => l.slug === slug);
  if (!match) throw new Error(`Listing with slug "${slug}" not found`);
  return match;
}

export async function getMyListings(params: GetListingsParams = {}): Promise<PaginatedListings> {
  return api.get<PaginatedListings>("/api/v1/listings/my-listings", {
    params: params as Record<string, string | number | boolean | undefined | null>,
  });
}

export async function createListing(body: CreateListingBody): Promise<Listing> {
  return api.post<Listing>("/api/v1/listings", body);
}

export async function updateListing(id: number, body: Partial<CreateListingBody>): Promise<Listing> {
  return api.patch<Listing>(`/api/v1/listings/${id}`, body);
}

export async function publishListing(id: number): Promise<void> {
  await api.post<{ message: string }>(`/api/v1/listings/${id}/publish`, {});
}

export async function deleteListing(id: number): Promise<void> {
  return api.delete<void>(`/api/v1/listings/${id}`);
}

export async function uploadImages(listingId: number, files: File[]): Promise<ListingImage[]> {
  // Validate types and sizes before uploading (VULN-08 fix)
  validateImageFiles(files);

  // Require the API URL to be explicitly configured — no http://localhost fallback (VULN-09 fix)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured");

  const form = new FormData();
  files.forEach((file) => form.append("images", file));

  const token   = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 60_000); // 60 s for batch upload
  try {
    const res = await fetch(`${apiUrl}/api/v1/listings/${listingId}/images/`, {
      method: "POST",
      headers,
      body:   form,
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Image upload failed (${res.status}). Please try again.`);
      void text; // prevent unused warning
    }

    const data = await res.json() as { images: ListingImage[] };
    return data.images;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function deleteImage(imageId: number): Promise<void> {
  return api.delete<void>(`/api/v1/listings/images/${imageId}`);
}
