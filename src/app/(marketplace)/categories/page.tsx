"use client";

import { useCallback, useEffect, useState } from "react";
import { CategoryCard } from "@/components/marketplace/CategoryCard";
import { getCategories } from "@/lib/api/categories";
import { NetworkError } from "@/lib/api/client";
import type { Category } from "@/types/category";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<"" | "network" | "error">("");

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getCategories({ page_size: 100 });
      setCategories(res);
    } catch (err: unknown) {
      setError(err instanceof NetworkError ? "network" : "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

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
      ) : error === "network" ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 py-16 text-center">
          <p className="text-sm font-semibold text-amber-800">Unable to connect to server.</p>
          <p className="mt-1 text-xs text-amber-600">Check your connection and try again.</p>
          <button onClick={fetchCategories} className="mt-3 text-xs font-semibold text-apple-blue hover:underline">↻ Retry</button>
        </div>
      ) : error === "error" ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50 py-16 text-center">
          <p className="text-sm font-semibold text-red-700">Failed to load categories.</p>
          <button onClick={fetchCategories} className="mt-3 text-xs font-semibold text-apple-blue hover:underline">↻ Retry</button>
        </div>
      ) : categories.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-400">No categories yet.</p>
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
