"use client";

import { useState, useEffect } from "react";

export interface SearchSuggestion {
  slug: string;
  title: string;
  category_name: string;
  price: number | null;
  price_type: string;
}

export function useInstantSearch(initialQuery = "") {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        if (!res.ok) {
          setResults([]);
          return;
        }
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return { query, setQuery, results, setResults, isSearching };
}
