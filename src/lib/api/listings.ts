import { api } from "./client";
import type { Listing } from "@/types/listing";

// ─── Image upload ─────────────────────────────────────────────────────────────

export interface UploadedImage {
  url: string;
}

/**
 * Uploads image files to the backend storage endpoint.
 * Returns the permanent URLs to attach to the listing.
 */
export async function uploadImages(files: File[]): Promise<UploadedImage[]> {
  const form = new FormData();
  files.forEach((file) => form.append("images", file));

  // Bypass the JSON client — multipart/form-data, no Content-Type header (browser sets boundary)
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"}/uploads/images`,
    { method: "POST", credentials: "include", body: form },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Image upload failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<UploadedImage[]>;
}

// ─── Param / response types ───────────────────────────────────────────────────

export interface GetListingsParams {
  q?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedListings {
  data: Listing[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateListingBody {
  title: string;
  price: number;
  location: string;
  condition: Listing["condition"];
  category: string;
  description?: string;
  images: { url: string }[];
  seller?: { name?: string; phone?: string };
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

export async function getListings(params: GetListingsParams = {}): Promise<PaginatedListings> {
  return api.get<PaginatedListings>("/listings", {
    params,
    // ISR: new listings appear within 60s without a full rebuild
    next: { revalidate: 60 },
  });
}

export async function getListing(id: string): Promise<Listing> {
  return api.get<Listing>(`/listings/${id}`, {
    next: { revalidate: 60, tags: [`listing-${id}`] },
  });
}

export async function getListingBySlug(slug: string): Promise<Listing> {
  return api.get<Listing>(`/listings/slug/${slug}`, {
    next: { revalidate: 60, tags: [`listing-slug-${slug}`] },
  });
}

export async function createListing(body: CreateListingBody): Promise<Listing> {
  return api.post<Listing>("/listings", body);
}

export async function updateListing(
  id: string,
  body: Partial<CreateListingBody>,
): Promise<Listing> {
  return api.patch<Listing>(`/listings/${id}`, body);
}

export async function deleteListing(id: string): Promise<void> {
  return api.delete<void>(`/listings/${id}`);
}
