"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { getAllListingsSync } from "@/lib/data/listings";
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

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ q, loc, category }: { q: string; loc: string; category: string }) {
  const reason =
    q && loc ? `No listings for "${q}" in "${loc}"`
    : q ? `No listings found for "${q}"`
    : loc ? `No listings found in "${loc}"`
    : category ? `No listings in this category yet`
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

  const urlQ = searchParams.get("q") ?? "";
  const urlLoc = searchParams.get("loc") ?? "";
  const urlCategory = searchParams.get("category") ?? "";

  // Draft inputs — only committed on submit
  const [draftQ, setDraftQ] = useState(urlQ);
  const [draftLoc, setDraftLoc] = useState(urlLoc);

  // Sync drafts when URL changes (e.g. from category pills)
  useEffect(() => { setDraftQ(urlQ); }, [urlQ]);
  useEffect(() => { setDraftLoc(urlLoc); }, [urlLoc]);

  // ── Instant client-side filtering ──────────────────────────────────────────
  const { data: listings, total } = useMemo(
    () => getAllListingsSync({ q: urlQ, loc: urlLoc, category: urlCategory }),
    [urlQ, urlLoc, urlCategory],
  );

  function navigate(q: string, loc: string, category?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q); else params.delete("q");
    if (loc) params.set("loc", loc); else params.delete("loc");
    if (category !== undefined) {
      if (category) params.set("category", category); else params.delete("category");
    }
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    navigate(draftQ.trim(), draftLoc.trim());
  }

  function clearQ() { setDraftQ(""); navigate("", draftLoc.trim()); }
  function clearLoc() { setDraftLoc(""); navigate(draftQ.trim(), ""); }

  const headingText = urlCategory
    ? urlCategory.charAt(0).toUpperCase() + urlCategory.slice(1).replace(/-/g, " ")
    : "All Listings";

  return (
    <div>
      {/* Back to categories */}
      {urlCategory && (
        <Link
          href="/categories"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 mb-4 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:scale-[0.97] transition-all"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
          </svg>
          All Categories
        </Link>
      )}

      {/* Heading */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-gray-900">
          {headingText}
          <span className="ml-2 text-sm font-normal text-gray-400">
            {total} result{total !== 1 ? "s" : ""}
          </span>
        </h1>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-2" role="search">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Keyword */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <SearchIcon className="text-gray-400" />
            </div>
            <input
              type="search"
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              placeholder="Search listings…"
              aria-label="Search by keyword"
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-colors"
            />
            {draftQ && (
              <button type="button" onClick={clearQ} aria-label="Clear keyword" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <ClearIcon />
              </button>
            )}
          </div>

          {/* Location */}
          <div className="relative sm:w-52">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <PinIcon className="text-gray-400" />
            </div>
            <input
              type="search"
              value={draftLoc}
              onChange={(e) => setDraftLoc(e.target.value)}
              placeholder="Location or area…"
              aria-label="Filter by location"
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-colors"
            />
            {draftLoc && (
              <button type="button" onClick={clearLoc} aria-label="Clear location" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <ClearIcon />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.97] transition-all sm:w-auto"
          >
            <SearchIcon className="text-white" />
            Search
          </button>
        </div>

        {/* Active filter chips */}
        {(urlQ || urlLoc) && (
          <div className="flex flex-wrap gap-1.5">
            {urlQ && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                <SearchIcon className="h-3 w-3" />
                {urlQ}
                <button type="button" onClick={clearQ} aria-label="Remove keyword filter"><ClearIcon className="h-3 w-3" /></button>
              </span>
            )}
            {urlLoc && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                <PinIcon className="h-3 w-3" />
                {urlLoc}
                <button type="button" onClick={clearLoc} aria-label="Remove location filter"><ClearIcon className="h-3 w-3" /></button>
              </span>
            )}
          </div>
        )}
      </form>

      {/* Grid or empty state */}
      {listings.length === 0 ? (
        <EmptyState q={urlQ} loc={urlLoc} category={urlCategory} />
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
