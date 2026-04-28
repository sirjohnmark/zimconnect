import { api, ApiError } from "./client";
import { isSaved, toggleSaved, getSavedIds, removeSaved } from "@/lib/mock/saved";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SavedListingOwner {
  id: number;
  username: string;
}

export interface SavedListingImage {
  id: number;
  image: string;
  is_primary: boolean;
}

export interface SavedListingDetail {
  id: number;
  title: string;
  slug: string;
  price: string;
  currency: string;
  condition: string;
  status: string;
  location: string;
  category: { id: number; name: string };
  owner: SavedListingOwner;
  primary_image: SavedListingImage | null;
  is_featured: boolean;
  views_count: number;
  created_at: string;
}

export interface SavedListing {
  id: number;
  listing: SavedListingDetail;
  saved_at: string;
}

interface PaginatedSaved {
  count: number;
  next: string | null;
  previous: string | null;
  results: SavedListing[];
}

// ─── Mock helpers ─────────────────────────────────────────────────────────────

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

function mockSavedListing(listingId: number, savedId: number): SavedListing {
  return {
    id: savedId,
    listing: {
      id: listingId,
      title: `Saved listing #${listingId}`,
      slug: `listing-${listingId}`,
      price: "0.00",
      currency: "USD",
      condition: "GOOD",
      status: "PUBLISHED",
      location: "HARARE",
      category: { id: 1, name: "General" },
      owner: { id: 1, username: "mock_seller" },
      primary_image: null,
      is_featured: false,
      views_count: 0,
      created_at: new Date().toISOString(),
    },
    saved_at: new Date().toISOString(),
  };
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function getSavedListings(): Promise<SavedListing[]> {
  if (USE_MOCK) {
    return getSavedIds().map((id, idx) =>
      mockSavedListing(Number(id), idx + 1),
    );
  }
  // Unpaginate: follow next links
  const results: SavedListing[] = [];
  let url: string | null = "/api/v1/buyers/saved";
  while (url) {
    const page: PaginatedSaved = await api.get<PaginatedSaved>(url);
    results.push(...page.results);
    url = page.next;
  }
  return results;
}

export async function saveListing(listingId: number): Promise<SavedListing> {
  if (USE_MOCK) {
    const id = String(listingId);
    if (!isSaved(id)) toggleSaved(id);
    return mockSavedListing(listingId, Date.now());
  }
  try {
    return await api.post<SavedListing>("/api/v1/buyers/saved", { listing_id: listingId });
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      const all = await getSavedListings();
      const existing = all.find((s) => s.listing.id === listingId);
      if (existing) return existing;
    }
    throw err;
  }
}

export async function unsaveListing(listingId: number): Promise<void> {
  if (USE_MOCK) {
    removeSaved(String(listingId));
    return;
  }
  await api.delete<void>(`/api/v1/buyers/saved/${listingId}`);
}

export async function isSavedRemote(listingId: number): Promise<boolean> {
  if (USE_MOCK) return isSaved(String(listingId));
  const all = await getSavedListings();
  return all.some((s) => s.listing.id === listingId);
}
