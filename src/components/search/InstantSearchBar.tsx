"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { useInstantSearch } from "@/hooks/useInstantSearch";
import type { SearchSuggestion } from "@/hooks/useInstantSearch";

interface InstantSearchBarProps {
  initialQuery?: string;
  placeholder?: string;
  /** Extra Tailwind classes applied to the input */
  inputClassName?: string;
}

function formatSuggestionPrice(price: number | null, priceType: string): string {
  if (priceType === "free") return "Free";
  if (priceType === "contact" || price === null) return "Contact";
  return `$${price.toLocaleString()}`;
}

/**
 * Splits `text` by `term` (case-insensitive) and wraps matches in <strong>.
 */
function HighlightMatch({ text, term }: { text: string; term: string }) {
  if (!term.trim()) return <>{text}</>;
  const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <strong key={i} className="font-semibold text-slate-900">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default function InstantSearchBar({
  initialQuery = "",
  placeholder = "Search listings in Zimbabwe…",
  inputClassName = "",
}: InstantSearchBarProps) {
  const router = useRouter();
  const { query, setQuery, results, setResults, isSearching } =
    useInstantSearch(initialQuery);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset highlighted row when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setResults([]);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [setResults]);

  const navigateToListing = useCallback(
    (slug: string) => {
      setResults([]);
      router.push(`/listing/${slug}`);
    },
    [router, setResults]
  );

  const navigateToSearch = useCallback(
    (q: string) => {
      setResults([]);
      if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      else router.push("/search");
    },
    [router, setResults]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (results.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        navigateToSearch(query);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && results[activeIndex]) {
          navigateToListing(results[activeIndex].slug);
        } else {
          navigateToSearch(query);
        }
        break;
      case "Escape":
        e.preventDefault();
        setResults([]);
        inputRef.current?.blur();
        break;
    }
  }

  const showResults = results.length > 0;
  const showNoResults =
    !isSearching && query.length >= 2 && results.length === 0;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input */}
      <div className="relative flex items-center">
        <span
          className="pointer-events-none absolute left-4 text-slate-400"
          aria-hidden="true"
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          aria-label="Search listings"
          aria-autocomplete="list"
          aria-expanded={showResults}
          aria-controls="search-suggestions"
          role="combobox"
          className={`w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition ${inputClassName}`}
        />
      </div>

      {/* Dropdown */}
      {(showResults || showNoResults) && (
        <ul
          id="search-suggestions"
          role="listbox"
          className="absolute z-50 mt-1.5 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden"
        >
          {showNoResults ? (
            <li className="px-4 py-3 text-sm text-slate-500 text-center">
              No results for &ldquo;{query}&rdquo;
            </li>
          ) : (
            results.map((item: SearchSuggestion, idx) => (
              <li
                key={item.slug}
                role="option"
                aria-selected={activeIndex === idx}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent input blur before click
                  navigateToListing(item.slug);
                }}
                className={`flex items-center justify-between gap-3 px-4 py-3 cursor-pointer border-b border-slate-100 last:border-0 transition-colors ${
                  activeIndex === idx ? "bg-brand-50" : "hover:bg-slate-50"
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm text-slate-700 truncate">
                    <HighlightMatch text={item.title} term={query} />
                  </p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {item.category_name}
                  </p>
                </div>
                <span className="text-xs font-semibold text-green-700 shrink-0">
                  {formatSuggestionPrice(item.price, item.price_type)}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
