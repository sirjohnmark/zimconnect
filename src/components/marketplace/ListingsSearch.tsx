"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { cn } from "@/lib/utils";

// ─── Search icon ──────────────────────────────────────────────────────────────

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ─── Clear icon ───────────────────────────────────────────────────────────────

function ClearIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

  const query = searchParams.get("q") ?? "";

  // Merge a new param into the current search string
  const createQueryString = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Always reset to page 1 on new search
      params.delete("page");
      return params.toString();
    },
    [searchParams],
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const qs = createQueryString("q", e.target.value);
    startTransition(() => {
      router.replace(`${pathname}?${qs}`, { scroll: false });
    });
  }

  function handleClear() {
    const qs = createQueryString("q", "");
    startTransition(() => {
      router.replace(`${pathname}?${qs}`, { scroll: false });
    });
  }

  return (
    <div className={cn("relative flex items-center", className)}>
      {/* Left icon — spinner while navigating, search icon otherwise */}
      <div className="pointer-events-none absolute left-3">
        {isPending ? <Spinner /> : <SearchIcon className="h-4 w-4 text-gray-400" />}
      </div>

      <input
        type="search"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label="Search listings"
        className={cn(
          "w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm text-gray-900",
          "placeholder:text-gray-400 shadow-sm",
          "transition-colors duration-150",
          "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400",
        )}
      />

      {/* Clear button */}
      {query && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-3 rounded-sm text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <ClearIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
