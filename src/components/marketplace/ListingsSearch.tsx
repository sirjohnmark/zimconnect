"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

// ─── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
    </svg>
  );
}

function ClearIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clipRule="evenodd" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface ListingsSearchProps {
  placeholder?: string;
  className?: string;
}

export function ListingsSearch({
  placeholder = "Search listings…",
  className,
}: ListingsSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [draftQ, setDraftQ] = useState(searchParams.get("q") ?? "");
  const [draftLoc, setDraftLoc] = useState(searchParams.get("loc") ?? "");

  function navigate(q: string, loc: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q); else params.delete("q");
    if (loc) params.set("loc", loc); else params.delete("loc");
    params.delete("page");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    navigate(draftQ.trim(), draftLoc.trim());
  }

  function handleClearQ() {
    setDraftQ("");
    navigate("", draftLoc.trim());
  }

  function handleClearLoc() {
    setDraftLoc("");
    navigate(draftQ.trim(), "");
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-2", className)} role="search">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Keyword search */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
            <SearchIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="search"
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            placeholder={placeholder}
            aria-label="Search by keyword"
            className={cn(
              "w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm text-gray-900",
              "placeholder:text-gray-400 shadow-sm",
              "focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-apple-blue transition-colors duration-150",
            )}
          />
          {draftQ && (
            <button
              type="button"
              onClick={handleClearQ}
              aria-label="Clear keyword"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue"
            >
              <ClearIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Location / sublocation filter */}
        <div className="relative sm:w-52">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
            <PinIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="search"
            value={draftLoc}
            onChange={(e) => setDraftLoc(e.target.value)}
            placeholder="Location or area…"
            aria-label="Filter by location or area"
            className={cn(
              "w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm text-gray-900",
              "placeholder:text-gray-400 shadow-sm",
              "focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-apple-blue transition-colors duration-150",
            )}
          />
          {draftLoc && (
            <button
              type="button"
              onClick={handleClearLoc}
              aria-label="Clear location"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue"
            >
              <ClearIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search button */}
        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-apple-blue px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-apple-blue active:scale-[0.97] disabled:opacity-70 transition-all duration-75 sm:w-auto"
        >
          {isPending ? <Spinner /> : <SearchIcon className="h-4 w-4" />}
          {isPending ? "Searching…" : "Search"}
        </button>
      </div>

      {/* Active filter chips */}
      {(searchParams.get("q") || searchParams.get("loc")) && (
        <div className="flex flex-wrap gap-1.5">
          {searchParams.get("q") && (
            <span className="inline-flex items-center gap-1 rounded-full bg-light-gray border border-apple-blue/20 px-2.5 py-0.5 text-xs font-medium text-apple-blue">
              <SearchIcon className="h-3 w-3" />
              {searchParams.get("q")}
              <button type="button" onClick={handleClearQ} aria-label="Remove keyword filter" className="ml-0.5 hover:text-near-black">
                <ClearIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          {searchParams.get("loc") && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              <PinIcon className="h-3 w-3" />
              {searchParams.get("loc")}
              <button type="button" onClick={handleClearLoc} aria-label="Remove location filter" className="ml-0.5 hover:text-blue-900">
                <ClearIcon className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </form>
  );
}
