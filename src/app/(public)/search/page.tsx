import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import type { Metadata } from "next";
import { searchListings, sanitizeQuery, SEARCH_PER_PAGE } from "@/lib/queries/search";
import { getListings } from "@/lib/queries/listings";
import InstantSearchBar from "@/components/search/InstantSearchBar";
import ListingGrid from "@/components/listings/ListingGrid";
import type { PageProps } from "@/types";

// ─── Metadata ─────────────────────────────────────────────────────────────

export function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  return searchParams?.then((sp) => {
    const q = typeof sp.q === "string" ? sp.q.trim() : "";
    return {
      title: q ? `"${q}" — Search ZimConnect` : "Browse listings — ZimConnect",
    };
  }) ?? Promise.resolve({ title: "Browse listings — ZimConnect" });
}

// ─── Pagination link helper ────────────────────────────────────────────────

function pageUrl(q: string, page: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("page", String(page));
  return `/search?${params.toString()}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = await (searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>));

  const rawQ = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);
  const sanitized = sanitizeQuery(rawQ);

  // ── Fetch ──────────────────────────────────────────────────────────────
  let listings: Awaited<ReturnType<typeof getListings>>["listings"] = [];
  let total = 0;
  let isSearch = false;

  if (rawQ && sanitized) {
    // Full-text search
    const result = await searchListings(rawQ, page);
    listings = result.listings;
    total = result.total;
    isSearch = true;
  } else if (rawQ && !sanitized) {
    // Query became empty after sanitizing special chars — treat as no results
    listings = [];
    total = 0;
    isSearch = true;
  } else {
    // No query — show most recent active listings
    const result = await getListings({ page, limit: SEARCH_PER_PAGE });
    listings = result.listings;
    total = result.total;
  }

  const totalPages = Math.ceil(total / SEARCH_PER_PAGE);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Search bar ── */}
        <div className="max-w-2xl">
          <InstantSearchBar
            initialQuery={rawQ}
            placeholder="Search listings in Zimbabwe…"
          />
        </div>

        {/* ── Header row ── */}
        <div className="flex items-center justify-between gap-4">
          <div>
            {isSearch && rawQ ? (
              <h1 className="text-lg font-semibold text-slate-800">
                {total > 0 ? (
                  <>
                    <span className="text-brand-600">{total.toLocaleString()}</span>
                    {" result"}
                    {total !== 1 ? "s" : ""} for{" "}
                    <span className="italic">"{rawQ}"</span>
                  </>
                ) : (
                  <>
                    No results for <span className="italic">"{rawQ}"</span>
                  </>
                )}
              </h1>
            ) : (
              <h1 className="text-lg font-semibold text-slate-800">
                {total > 0
                  ? `${total.toLocaleString()} listing${total !== 1 ? "s" : ""}`
                  : "No listings yet"}
              </h1>
            )}
            {total > 0 && totalPages > 1 && (
              <p className="text-sm text-slate-500 mt-0.5">
                Page {page} of {totalPages}
              </p>
            )}
          </div>

          {/* Placeholder for future filters button */}
          <button
            disabled
            className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-500 opacity-50 cursor-not-allowed"
            aria-label="Filters (coming soon)"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* ── Results grid ── */}
        {listings.length > 0 ? (
          <ListingGrid listings={listings} />
        ) : (
          <div className="flex flex-col items-center justify-center py-24 rounded-xl border-2 border-dashed border-slate-200 bg-white text-center">
            <span className="text-5xl mb-4" aria-hidden="true">🔍</span>
            <h2 className="text-base font-semibold text-slate-700">
              {isSearch && rawQ ? `No listings match "${rawQ}"` : "No listings yet"}
            </h2>
            <p className="mt-1 text-sm text-slate-400 max-w-xs">
              {isSearch && rawQ
                ? "Try different keywords or browse all categories below."
                : "Be the first to post a listing on ZimConnect."}
            </p>
            <div className="mt-6 flex items-center gap-3">
              {isSearch && rawQ && (
                <Link
                  href="/search"
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Browse all listings
                </Link>
              )}
              <Link
                href="/sell"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
              >
                Post a listing
              </Link>
            </div>
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <nav
            className="flex items-center justify-center gap-2 pt-4"
            aria-label="Search results pagination"
          >
            {hasPrev ? (
              <Link
                href={pageUrl(rawQ, page - 1)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                ← Previous
              </Link>
            ) : (
              <span className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-400 cursor-not-allowed">
                ← Previous
              </span>
            )}

            <span className="px-3 text-sm text-slate-500">
              {page} / {totalPages}
            </span>

            {hasNext ? (
              <Link
                href={pageUrl(rawQ, page + 1)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Next →
              </Link>
            ) : (
              <span className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-400 cursor-not-allowed">
                Next →
              </span>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
