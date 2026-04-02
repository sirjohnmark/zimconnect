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

  // Local draft — only committed to URL on submit
  const [draft, setDraft] = useState(searchParams.get("q") ?? "");

  function navigate(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    params.delete("page");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate(draft.trim());
  }

  function handleClear() {
    setDraft("");
    navigate("");
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-2 sm:flex-row sm:items-center", className)} role="search">
      {/* Input */}
      <div className="relative flex-1">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          <SearchIcon className="h-4 w-4 text-gray-400" />
        </div>

        <input
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          aria-label="Search listings"
          className={cn(
            "w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm text-gray-900",
            "placeholder:text-gray-400 shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-colors duration-150",
          )}
        />

        {/* Clear button — only when there's a draft */}
        {draft && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <ClearIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search button */}
      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.97] disabled:opacity-70 transition-all duration-75 sm:w-auto"
      >
        {isPending ? <Spinner /> : <SearchIcon className="h-4 w-4" />}
        {isPending ? "Searching…" : "Search"}
      </button>
    </form>
  );
}
