import type { Metadata } from "next";
import { Suspense } from "react";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { ListingsSearch } from "@/components/marketplace/ListingsSearch";
import { getListings } from "@/lib/data/listings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Listings" };

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
// Server Component — filtering is delegated to Django via query params.
// Search, category, and pagination all pass through to the API cleanly.

interface ListingsPageProps {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const { q = "", category = "", page = "1" } = await searchParams;

  const { data: listings, total } = await getListings({
    q,
    category,
    page: Number(page),
  });

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
            {total} result{total !== 1 ? "s" : ""}
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
