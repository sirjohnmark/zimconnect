import type { Listing } from "@/types/listing";
import type { PaginatedListings, GetListingsParams, CreateListingBody, UploadedImage } from "@/lib/api/listings";
import { MOCK_LISTINGS } from "@/lib/mock/listings";

// ── Switch ────────────────────────────────────────────────────────────────────

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

// ── Mock listings store (localStorage) ───────────────────────────────────────

const STORAGE_KEY = "zimconnect_listings";

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

async function mockUploadImages(files: File[]): Promise<UploadedImage[]> {
  const urls = await Promise.all(files.map(fileToDataUrl));
  return urls.map((url) => ({ url }));
}

async function mockCreateListing(body: CreateListingBody): Promise<Listing> {
  const listing: Listing = {
    id: `local-${Date.now()}`,
    title: body.title,
    price: body.price,
    location: body.location,
    sublocation: body.sublocation,
    condition: body.condition,
    category: body.category,
    description: body.description,
    images: body.images,
    seller: body.seller,
    delivery: body.delivery,
  };
  saveListingToStore(listing);
  return listing;
}

/** All listings: user-created first, then seeds. Filters applied synchronously. */
export function getAllListingsSync(params: GetListingsParams = {}): PaginatedListings {
  const { q = "", category = "", loc = "", page = 1, limit = 60 } = params;

  const stored = getStoredListings();
  const seedIds = new Set(MOCK_LISTINGS.map((l) => l.id));
  const userListings = stored.filter((l) => !seedIds.has(l.id));
  let results = [...userListings, ...MOCK_LISTINGS];

  if (category) {
    results = results.filter((l) => l.category === category);
  }
  if (q.trim()) {
    const term = q.trim().toLowerCase();
    results = results.filter(
      (l) =>
        l.title.toLowerCase().includes(term) ||
        l.location.toLowerCase().includes(term) ||
        l.sublocation?.toLowerCase().includes(term) ||
        l.description?.toLowerCase().includes(term),
    );
  }
  if (loc.trim()) {
    const locTerm = loc.trim().toLowerCase();
    results = results.filter(
      (l) =>
        l.location.toLowerCase().includes(locTerm) ||
        l.sublocation?.toLowerCase().includes(locTerm),
    );
  }

  const total = results.length;
  const start = (page - 1) * limit;
  return { data: results.slice(start, start + limit), total, page, limit };
}

async function fromMock(params: GetListingsParams): Promise<PaginatedListings> {
  return getAllListingsSync(params);
}

// ── Public functions ──────────────────────────────────────────────────────────

export async function getListings(params: GetListingsParams = {}): Promise<PaginatedListings> {
  if (USE_MOCK) return fromMock(params);
  const { getListings: apiGetListings } = await import("@/lib/api/listings");
  return apiGetListings(params);
}

export async function getListingById(id: string): Promise<Listing> {
  if (USE_MOCK) {
    const all = [...getStoredListings(), ...MOCK_LISTINGS];
    const listing = all.find((l) => l.id === id);
    if (!listing) throw new Error(`Listing "${id}" not found`);
    return listing;
  }
  const { getListing } = await import("@/lib/api/listings");
  return getListing(id);
}

export async function getListingBySlug(slug: string): Promise<Listing> {
  if (USE_MOCK) {
    const all = [...getStoredListings(), ...MOCK_LISTINGS];
    const listing = all.find(
      (l) => l.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") === slug,
    );
    if (!listing) throw new Error(`Listing with slug "${slug}" not found`);
    return listing;
  }
  const { getListingBySlug: apiGetBySlug } = await import("@/lib/api/listings");
  return apiGetBySlug(slug);
}

export async function createListing(body: CreateListingBody): Promise<Listing> {
  if (USE_MOCK) return mockCreateListing(body);
  const { createListing: apiCreate } = await import("@/lib/api/listings");
  return apiCreate(body);
}

export async function uploadImages(files: File[]): Promise<UploadedImage[]> {
  if (USE_MOCK) return mockUploadImages(files);
  const { uploadImages: apiUpload } = await import("@/lib/api/listings");
  return apiUpload(files);
}
