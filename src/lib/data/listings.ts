import type { Listing } from "@/types/listing";
import type { PaginatedListings, GetListingsParams } from "@/lib/api/listings";

// ── Switch ────────────────────────────────────────────────────────────────────

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

// ── Mock implementation ───────────────────────────────────────────────────────

const MOCK_LISTINGS: Listing[] = [
  {
    id: "1",
    title: "iPhone 13 Pro Max",
    price: 900,
    location: "Harare",
    category: "electronics",
    condition: "like-new",
    images: [{ url: "https://via.placeholder.com/300" }],
  },
  {
    id: "2",
    title: "Toyota Aqua 2015",
    price: 8500,
    location: "Bulawayo",
    category: "vehicles",
    condition: "good",
    images: [{ url: "https://via.placeholder.com/300" }],
  },
  {
    id: "3",
    title: "Samsung Galaxy S24 Ultra — 256GB",
    price: 650,
    location: "Harare",
    category: "electronics",
    condition: "like-new",
    description: "Pristine condition, used 3 months. Original box included.",
    images: [],
  },
  {
    id: "4",
    title: "2-Bedroom Apartment — Avondale",
    price: 450,
    location: "Harare",
    category: "property",
    condition: "new",
    description: "Modern finishing, 24-hour security, all-inclusive.",
    images: [],
  },
  {
    id: "5",
    title: "Honda Fit 2017 — 62,000km, Manual",
    price: 8500,
    location: "Mutare",
    category: "vehicles",
    condition: "good",
    images: [],
  },
  {
    id: "6",
    title: "PlayStation 5 — Disc Edition + 2 controllers",
    price: 480,
    location: "Bulawayo",
    category: "electronics",
    condition: "like-new",
    description: "Barely used, perfect working order. Comes with FIFA 24.",
    images: [],
  },
];

async function fromMock(params: GetListingsParams): Promise<PaginatedListings> {
  const { q = "", category = "", page = 1, limit = 20 } = params;
  let results = [...MOCK_LISTINGS];

  if (category) {
    results = results.filter((l) => l.category === category);
  }

  if (q.trim()) {
    const term = q.trim().toLowerCase();
    results = results.filter(
      (l) =>
        l.title.toLowerCase().includes(term) ||
        l.location.toLowerCase().includes(term) ||
        l.description?.toLowerCase().includes(term),
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
    const listing = MOCK_LISTINGS.find((l) => l.id === id);
    if (!listing) throw new Error(`Listing "${id}" not found`);
    return listing;
  }
  const { getListing } = await import("@/lib/api/listings");
  return getListing(id);
}

export async function getListingBySlug(slug: string): Promise<Listing> {
  if (USE_MOCK) {
    const listing = MOCK_LISTINGS.find(
      (l) => l.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") === slug,
    );
    if (!listing) throw new Error(`Listing with slug "${slug}" not found`);
    return listing;
  }
  const { getListingBySlug: apiGetBySlug } = await import("@/lib/api/listings");
  return apiGetBySlug(slug);
}
