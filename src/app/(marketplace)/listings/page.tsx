import type { Metadata } from "next";
import { Suspense } from "react";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { ListingsSearch } from "@/components/marketplace/ListingsSearch";
import type { Listing } from "@/types/listing";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Listings" };

// ── Mock data ─────────────────────────────────────────────────────────────────
// In production: replace with `await db.listing.findMany(...)` or `fetch("/api/listings")`

const ALL_LISTINGS: Listing[] = [
  {
    id: "1",
    title: "Samsung Galaxy S24 Ultra — 256GB, Phantom Black",
    price: 650,
    location: "Harare",
    condition: "like-new",
    category: "electronics",
    description: "Pristine condition, used 3 months. Original box and all accessories included.",
    images: [{ url: "/placeholder-listing.jpg" }],
  },
  {
    id: "2",
    title: "Toyota Corolla 2019 — 45,000km, Full Service History",
    price: 12500,
    location: "Bulawayo",
    condition: "good",
    category: "vehicles",
    description: "One owner, accident-free. New tyres fitted March 2024.",
    images: [],
  },
  {
    id: "3",
    title: "2-Bedroom Apartment — Avondale, all-inclusive",
    price: 450,
    location: "Harare",
    condition: "new",
    category: "property",
    description: "Modern finishing, 24-hour security, water and electricity included.",
    images: [],
  },
  {
    id: "4",
    title: "MacBook Pro M3 14\" — 16GB RAM, 512GB SSD",
    price: 1800,
    location: "Harare",
    condition: "new",
    category: "electronics",
    description: "Sealed in box, space grey. Receipt and 1-year Apple warranty.",
    images: [],
  },
  {
    id: "5",
    title: "Honda Fit 2017 — 62,000km, Manual",
    price: 8500,
    location: "Mutare",
    condition: "good",
    category: "vehicles",
    images: [],
  },
  {
    id: "6",
    title: "Office Space — Samora Machel CBD, 120m²",
    price: 900,
    location: "Harare",
    condition: "good",
    category: "property",
    description: "Open plan, fibre-ready, parking included. Available immediately.",
    images: [],
  },
  {
    id: "7",
    title: "iPhone 15 Pro — 128GB, Natural Titanium",
    price: 950,
    location: "Harare",
    condition: "like-new",
    category: "electronics",
    images: [],
  },
  {
    id: "8",
    title: "Software Engineer — Remote, USD salary",
    price: 1200,
    location: "Remote",
    condition: "new",
    category: "jobs",
    description: "3+ years React/Node. Competitive salary. Full-time remote.",
    images: [],
  },
  {
    id: "9",
    title: "Mazda CX-5 2021 — AWD, Sunroof",
    price: 22000,
    location: "Harare",
    condition: "good",
    category: "vehicles",
    images: [],
  },
  {
    id: "10",
    title: "Plumbing Services — Emergency & Routine",
    price: 30,
    location: "Harare",
    condition: "new",
    category: "services",
    description: "Licensed plumber, 10 years experience. Available 7 days.",
    images: [],
  },
  {
    id: "11",
    title: "Studio Apartment — Borrowdale, furnished",
    price: 380,
    location: "Harare",
    condition: "good",
    category: "property",
    images: [],
  },
  {
    id: "12",
    title: "PlayStation 5 — Disc Edition + 2 controllers",
    price: 480,
    location: "Bulawayo",
    condition: "like-new",
    category: "electronics",
    description: "Barely used, perfect working order. Comes with FIFA 24.",
    images: [],
  },
];

// ── Data layer ────────────────────────────────────────────────────────────────
// Isolated function — swap body for a real fetch/db call without touching the page.

interface GetListingsParams {
  query?: string;
  category?: string;
}

function getListings({ query = "", category = "" }: GetListingsParams): Listing[] {
  let results = ALL_LISTINGS;

  if (category) {
    results = results.filter((l) => l.category === category);
  }

  if (query.trim()) {
    const q = query.trim().toLowerCase();
    results = results.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q),
    );
  }

  return results;
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ query, category }: { query: string; category: string }) {
  const reason = query
    ? `No listings found for "${query}"`
    : category
      ? `No listings in this category yet`
      : "No listings yet";

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 py-20 text-center">
      <svg
        className="mb-4 h-10 w-10 text-gray-300"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.182 16.318A4.486 4.486 0 0 0 12.016 15a4.486 4.486 0 0 0-3.198 1.318M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z"
        />
      </svg>
      <p className="text-sm font-semibold text-gray-700">{reason}</p>
      <p className="mt-1 text-xs text-gray-400">Try a different search or browse all categories.</p>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

interface ListingsPageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const { q = "", category = "" } = await searchParams;
  const listings = getListings({ query: q, category });

  const headingText = category
    ? `${category.charAt(0).toUpperCase()}${category.slice(1)}`
    : "All Listings";

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-gray-900">
          {headingText}
          <span className="ml-2 text-sm font-normal text-gray-400">
            {listings.length} result{listings.length !== 1 ? "s" : ""}
          </span>
        </h1>
      </div>

      {/* Search — inside Suspense because it reads useSearchParams */}
      <Suspense>
        <ListingsSearch className="mb-6" />
      </Suspense>

      {/* Grid or empty state */}
      {listings.length === 0 ? (
        <EmptyState query={q} category={category} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
