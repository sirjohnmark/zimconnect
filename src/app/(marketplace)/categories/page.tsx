"use client";

import { useEffect, useState } from "react";
import { CategoryCard } from "@/components/marketplace/CategoryCard";
import { getCategories } from "@/lib/api/categories";
import type { Category } from "@/types/category";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getCategories({ page_size: 100 })
      .then((res) => setCategories(res.results))
      .catch(() => setCategories([]));
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

      {categories.length === 0 ? (
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
