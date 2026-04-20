"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getListings } from "@/lib/api/listings";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { CITY_LABELS } from "@/lib/validations/listing";
import type { Listing } from "@/types/listing";
import { cn } from "@/lib/utils";

// ─── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4", className)} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4", className)} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clipRule="evenodd" />
    </svg>
  );
}

function ClearIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4", className)} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function GridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-100 overflow-hidden">
          <div className="aspect-[4/3] w-full animate-pulse bg-gray-100" />
          <div className="p-4 space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ search, location, category }: { search: string; location: string; category: string }) {
  const reason =
    search && location ? `No listings for "${search}" in ${CITY_LABELS[location] ?? location}`
    : search   ? `No listings found for "${search}"`
    : location ? `No listings found in ${CITY_LABELS[location] ?? location}`
    : category ? "No listings in this category yet"
    : "No listings yet";

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 py-20 text-center">
      <svg className="mb-4 h-10 w-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0 0 12.016 15a4.486 4.486 0 0 0-3.198 1.318M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
      </svg>
      <p className="text-sm font-semibold text-gray-700">{reason}</p>
      <p className="mt-1 text-xs text-gray-400">Try a different search or browse all categories.</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ListingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlSearch   = searchParams.get("search") ?? "";
  const urlLocation = searchParams.get("location") ?? "";
  const urlCategory = searchParams.get("category") ?? "";
  const urlPage     = parseInt(searchParams.get("page") ?? "1", 10);

  const [draftSearch,   setDraftSearch]   = useState(urlSearch);
  const [draftLocation, setDraftLocation] = useState(urlLocation);

  const [listings, setListings] = useState<Listing[]>([]);
  const [total,    setTotal]    = useState(0);
  const [hasNext,  setHasNext]  = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getListings({
        search:   urlSearch   || undefined,
        location: urlLocation || undefined,
        category: urlCategory || undefined,
        page:     urlPage,
        page_size: 24,
      });
      setListings(res.results);
      setTotal(res.count);
      setHasNext(res.next !== null);
    } catch {
      setError("Failed to load listings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [urlSearch, urlLocation, urlCategory, urlPage]);

  useEffect(() => { fetchListings(); }, [fetchListings]);
  useEffect(() => { setDraftSearch(urlSearch); },   [urlSearch]);
  useEffect(() => { setDraftLocation(urlLocation); }, [urlLocation]);

  function navigate(params: { search?: string; location?: string; category?: string; page?: number }) {
    const p = new URLSearchParams(searchParams.toString());
    const set = (k: string, v?: string) => v ? p.set(k, v) : p.delete(k);
    set("search",   params.search);
    set("location", params.location);
    if (params.category !== undefined) set("category", params.category);
    if (params.page && params.page > 1) p.set("page", String(params.page)); else p.delete("page");
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate({ search: draftSearch.trim(), location: draftLocation.trim() });
  }

  const headingText = urlCategory
    ? urlCategory.charAt(0).toUpperCase() + urlCategory.slice(1).replace(/-/g, " ")
    : "All Listings";

  return (
    <div>
      {urlCategory && (
        <Link href="/categories" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 mb-4 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:scale-[0.97] transition-all">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
          </svg>
          All Categories
        </Link>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-gray-900">
          {headingText}
          {!loading && (
            <span className="ml-2 text-sm font-normal text-gray-400">
              {total} result{total !== 1 ? "s" : ""}
            </span>
          )}
        </h1>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-2" role="search">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <SearchIcon className="text-gray-400" />
            </div>
            <input
              type="search"
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
              placeholder="Search listings…"
              aria-label="Search by keyword"
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-colors"
            />
            {draftSearch && (
              <button type="button" onClick={() => { setDraftSearch(""); navigate({ search: "", location: draftLocation }); }} aria-label="Clear keyword" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <ClearIcon />
              </button>
            )}
          </div>

          <div className="relative sm:w-52">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <PinIcon className="text-gray-400" />
            </div>
            <input
              type="search"
              value={draftLocation}
              onChange={(e) => setDraftLocation(e.target.value)}
              placeholder="City or location…"
              aria-label="Filter by location"
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-colors"
            />
            {draftLocation && (
              <button type="button" onClick={() => { setDraftLocation(""); navigate({ search: draftSearch, location: "" }); }} aria-label="Clear location" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <ClearIcon />
              </button>
            )}
          </div>

          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.97] transition-all sm:w-auto">
            <SearchIcon className="text-white" />
            Search
          </button>
        </div>

        {(urlSearch || urlLocation) && (
          <div className="flex flex-wrap gap-1.5">
            {urlSearch && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                <SearchIcon className="h-3 w-3" />{urlSearch}
                <button type="button" onClick={() => navigate({ search: "", location: urlLocation })} aria-label="Remove keyword filter"><ClearIcon className="h-3 w-3" /></button>
              </span>
            )}
            {urlLocation && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                <PinIcon className="h-3 w-3" />{CITY_LABELS[urlLocation] ?? urlLocation}
                <button type="button" onClick={() => navigate({ search: urlSearch, location: "" })} aria-label="Remove location filter"><ClearIcon className="h-3 w-3" /></button>
              </span>
            )}
          </div>
        )}
      </form>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button type="button" onClick={fetchListings} className="ml-auto text-xs font-medium underline">Retry</button>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <GridSkeleton />
      ) : listings.length === 0 ? (
        <EmptyState search={urlSearch} location={urlLocation} category={urlCategory} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-8 flex items-center justify-center gap-3">
            {urlPage > 1 && (
              <button
                type="button"
                onClick={() => navigate({ search: urlSearch, location: urlLocation, page: urlPage - 1 })}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                ← Previous
              </button>
            )}
            <span className="text-sm text-gray-500">Page {urlPage}</span>
            {hasNext && (
              <button
                type="button"
                onClick={() => navigate({ search: urlSearch, location: urlLocation, page: urlPage + 1 })}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Next →
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
