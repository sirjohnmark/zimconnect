import type { Listing, ListingImage } from "@/types/listing";
import type { PaginatedListings, GetListingsParams, CreateListingBody } from "@/lib/api/listings";
import { MOCK_LISTINGS } from "@/lib/mock/listings";
import { USE_MOCK } from "./use-mock";

// ── Mock listings store (localStorage) ───────────────────────────────────────

const STORAGE_KEY = "sanganai_listings";

export function getStoredListings(): Listing[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Listing[]) : [];
  } catch {
    return [];
  }
}

function saveListingToStore(listing: Listing): void {
  if (typeof window === "undefined") return;
  const existing = getStoredListings();
  existing.unshift(listing);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

// ── Mock implementations ──────────────────────────────────────────────────────

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function mockUploadImages(files: File[]): Promise<ListingImage[]> {
  const urls = await Promise.all(files.map(fileToDataUrl));
  return urls.map((url, index) => ({
    id: Date.now() + index,
    image: url,
    caption: "",
    display_order: index,
    is_primary: index === 0,
  }));
}

async function mockCreateListing(body: CreateListingBody): Promise<Listing> {
  const listing: Listing = {
    id: Date.now(),
    title: body.title,
    slug: body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
    description: body.description,
    price: body.price,
    currency: body.currency,
    location: body.location,
    condition: body.condition,
    status: "DRAFT",
    category: {
      name: `Category ${body.category_id}`,
      slug: String(body.category_id),
    },
    owner: {
      id: 0,
      username: "you",
      profile_picture: null,
    },
    images: [],
    primary_image: null,
    is_featured: false,
    views_count: 0,
    rejection_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    published_at: null,
  };
  saveListingToStore(listing);
  return listing;
}

/** Score a listing against query words — counts how many words appear in the haystack. */
function scoreListingMatch(l: Listing, words: string[]): number {
  if (words.length === 0) return 1;
  const hay = [l.title, l.location, l.description ?? "", l.category.name, l.category.slug]
    .join(" ").toLowerCase();
  return words.filter((w) => hay.includes(w)).length;
}

/** All listings: user-created first, then seeds. Filters applied synchronously.
 *  When an exact search yields 0 results, falls back to nearest partial matches. */
export function getAllListingsSync(
  params: GetListingsParams = {},
): PaginatedListings & { isFallback?: boolean } {
  const { search = "", category = "", location = "", page = 1, page_size = 60 } = params;

  const stored = getStoredListings();
  const seedIds = new Set(MOCK_LISTINGS.map((l) => String(l.id)));
  const userListings = stored.filter((l) => !seedIds.has(String(l.id)));
  let pool = [...userListings, ...MOCK_LISTINGS];

  // Category filter always hard
  if (category) pool = pool.filter((l) => l.category.slug === category || l.category.name === category);

  // Location filter always hard
  if (location.trim()) {
    const locTerm = location.trim().toLowerCase();
    pool = pool.filter(
      (l) =>
        l.location.toLowerCase().includes(locTerm) ||
        l.category.name.toLowerCase().includes(locTerm),
    );
  }

  const qWords = search.trim().toLowerCase().split(/\s+/).filter(Boolean);

  // Score all items
  const scored = pool.map((l) => ({ l, score: scoreListingMatch(l, qWords) }));

  // Exact matches: every word must appear somewhere
  let results = scored.filter(({ score }) => qWords.length === 0 || score === qWords.length);
  let isFallback = false;

  // Fallback: partial word matches, sorted by score desc
  if (results.length === 0 && qWords.length > 0) {
    results = scored.filter(({ score }) => score > 0).sort((a, b) => b.score - a.score);
    isFallback = true;
  }

  const data = results.map(({ l }) => l);
  const total = data.length;
  const start = (page - 1) * page_size;
  const end = start + page_size;
  return {
    count: total,
    next: end < total ? `page=${page + 1}` : null,
    previous: page > 1 ? `page=${page - 1}` : null,
    results: data.slice(start, end),
    isFallback,
  };
}

async function fromMock(params: GetListingsParams): Promise<PaginatedListings> {
  return getAllListingsSync(params);
}

// ── Public functions ──────────────────────────────────────────────────────────

export async function getListings(params: GetListingsParams = {}): Promise<PaginatedListings> {
  if (USE_MOCK) return fromMock(params);
  try {
    const { getListings: apiGetListings } = await import("@/lib/api/listings");
    return await apiGetListings(params);
  } catch {
    return fromMock(params);
  }
}

export async function getListingById(id: string): Promise<Listing> {
  const all = [...getStoredListings(), ...MOCK_LISTINGS];
  if (USE_MOCK) {
    const listing = all.find((l) => String(l.id) === id);
    if (!listing) throw new Error(`Listing "${id}" not found`);
    return listing;
  }
  try {
    const { getListing } = await import("@/lib/api/listings");
    return await getListing(Number(id));
  } catch {
    const listing = all.find((l) => String(l.id) === id);
    if (!listing) throw new Error(`Listing "${id}" not found`);
    return listing;
  }
}

export async function getListingBySlug(slug: string): Promise<Listing> {
  const all = [...getStoredListings(), ...MOCK_LISTINGS];
  const mockMatch = all.find(
    (l) => l.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") === slug,
  );
  if (USE_MOCK) {
    if (!mockMatch) throw new Error(`Listing with slug "${slug}" not found`);
    return mockMatch;
  }
  try {
    const { getListingBySlug: apiGetBySlug } = await import("@/lib/api/listings");
    return await apiGetBySlug(slug);
  } catch {
    if (!mockMatch) throw new Error(`Listing with slug "${slug}" not found`);
    return mockMatch;
  }
}

export async function createListing(body: CreateListingBody): Promise<Listing> {
  if (USE_MOCK) return mockCreateListing(body);
  try {
    const { createListing: apiCreate } = await import("@/lib/api/listings");
    return await apiCreate(body);
  } catch {
    return mockCreateListing(body);
  }
}

export async function uploadImages(listingId: number, files: File[]): Promise<ListingImage[]> {
  if (USE_MOCK) return mockUploadImages(files);
  try {
    const { uploadImages: apiUpload } = await import("@/lib/api/listings");
    return await apiUpload(listingId, files);
  } catch {
    return mockUploadImages(files);
  }
}
