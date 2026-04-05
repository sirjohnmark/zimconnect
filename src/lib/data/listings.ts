import type { Listing } from "@/types/listing";
import type { PaginatedListings, GetListingsParams, CreateListingBody, UploadedImage } from "@/lib/api/listings";

// ── Switch ────────────────────────────────────────────────────────────────────

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

// ── Mock listings store (localStorage) ───────────────────────────────────────
// Seed listings come from the static array below.
// Listings created via the form are appended to localStorage and merged on read.

const STORAGE_KEY = "zimconnect_listings";

const SEED_LISTINGS: Listing[] = [
  {
    id: "1",
    title: "iPhone 13 Pro Max",
    price: 900,
    location: "Harare",
    category: "electronics",
    condition: "like-new",
    images: [{ url: "https://picsum.photos/seed/zc-1/600/400" }],
    seller: { name: "Tinashe Moyo", phone: "0771234567" },
  },
  {
    id: "2",
    title: "Toyota Aqua 2015",
    price: 8500,
    location: "Bulawayo",
    category: "vehicles",
    condition: "good",
    images: [{ url: "https://picsum.photos/seed/zc-2/600/400" }],
    seller: { name: "Farai Ncube", phone: "0782345678" },
  },
  {
    id: "3",
    title: "Samsung Galaxy S24 Ultra — 256GB",
    price: 650,
    location: "Harare",
    category: "electronics",
    condition: "like-new",
    description: "Pristine condition, used 3 months. Original box included.",
    images: [{ url: "https://picsum.photos/seed/zc-3/600/400" }],
    seller: { name: "Kudzi Tech", phone: "0714567890" },
  },
  {
    id: "4",
    title: "2-Bedroom Apartment — Avondale",
    price: 450,
    location: "Harare",
    sublocation: "Avondale",
    category: "property",
    condition: "new",
    description: "Modern finishing, 24-hour security, all-inclusive.",
    images: [{ url: "https://picsum.photos/seed/zc-4/600/400" }],
    seller: { name: "Chiedza Estates", phone: "0773456789" },
  },
  {
    id: "5",
    title: "Honda Fit 2017 — 62,000km, Manual",
    price: 8500,
    location: "Mutare",
    sublocation: "Chikanga",
    category: "vehicles",
    condition: "good",
    images: [{ url: "https://picsum.photos/seed/zc-5/600/400" }],
    seller: { name: "Blessing Chirwa", phone: "0785678901" },
  },
  {
    id: "6",
    title: "PlayStation 5 — Disc Edition + 2 controllers",
    price: 480,
    location: "Bulawayo",
    category: "electronics",
    condition: "like-new",
    description: "Barely used, perfect working order. Comes with FIFA 24.",
    images: [{ url: "https://picsum.photos/seed/zc-6/600/400" }],
    seller: { name: "Munyaradzi Games", phone: "0732345678" },
  },
];

function getStoredListings(): Listing[] {
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
  existing.unshift(listing); // newest first
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

// ── Mock implementations ──────────────────────────────────────────────────────

/** Convert a File to a base64 data URL so it survives page navigation in mock mode. */
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

async function fromMock(params: GetListingsParams): Promise<PaginatedListings> {
  const { q = "", category = "", loc = "", page = 1, limit = 20 } = params;

  // Merge user-created (from localStorage) with seed data, newest first
  const stored = getStoredListings();
  const seedIds = new Set(SEED_LISTINGS.map((l) => l.id));
  const userListings = stored.filter((l) => !seedIds.has(l.id));
  let results = [...userListings, ...SEED_LISTINGS];

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

// ── Public functions ──────────────────────────────────────────────────────────

export async function getListings(params: GetListingsParams = {}): Promise<PaginatedListings> {
  if (USE_MOCK) return fromMock(params);
  const { getListings: apiGetListings } = await import("@/lib/api/listings");
  return apiGetListings(params);
}

export async function getListingById(id: string): Promise<Listing> {
  if (USE_MOCK) {
    const all = [...getStoredListings(), ...SEED_LISTINGS];
    const listing = all.find((l) => l.id === id);
    if (!listing) throw new Error(`Listing "${id}" not found`);
    return listing;
  }
  const { getListing } = await import("@/lib/api/listings");
  return getListing(id);
}

export async function getListingBySlug(slug: string): Promise<Listing> {
  if (USE_MOCK) {
    const all = [...getStoredListings(), ...SEED_LISTINGS];
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
