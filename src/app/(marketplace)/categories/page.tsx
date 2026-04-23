"use client";

import { useEffect, useState } from "react";
import { CategoryCard } from "@/components/marketplace/CategoryCard";
import type { Category } from "@/types/category";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchCategories() {
      try {
        const { getCategories } = await import("@/lib/api/categories");
        const res = await getCategories({ page_size: 100 });
        if (!cancelled) setCategories(res.results);
      } catch {
        if (!cancelled) setUnavailable(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCategories();
    return () => { cancelled = true; };
  }, []);

  const totalListings = categories.reduce((sum, c) => sum + (c.count ?? 0), 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Browse Categories</h1>
        <p className="mt-1 text-sm text-gray-500">
          {categories.length} {categories.length === 1 ? "category" : "categories"}
          {totalListings > 0 && <> · {totalListings.toLocaleString()} total listings</>}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : unavailable ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 py-16 text-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="mb-4 h-10 w-10 text-amber-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <p className="text-sm font-semibold text-amber-800">We are currently unavailable</p>
          <p className="mt-1 text-xs text-amber-600">Please come back in a few minutes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}
