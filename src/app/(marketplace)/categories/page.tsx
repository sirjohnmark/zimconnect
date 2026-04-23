"use client";

import { useEffect, useState } from "react";
import { CategoryCard } from "@/components/marketplace/CategoryCard";
import type { Category } from "@/types/category";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchCategories() {
      try {
        const { getCategories } = await import("@/lib/api/categories");
        const res = await getCategories({ page_size: 100 });
        if (!cancelled) setCategories(res.results);
      } catch {
        // API unavailable — show empty state
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

      {loading || categories.length === 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
          ))}
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
