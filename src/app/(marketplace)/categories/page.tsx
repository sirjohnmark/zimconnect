import type { Metadata } from "next";
import { CategoryCard } from "@/components/marketplace/CategoryCard";
import { getCategories } from "@/lib/data/categories";
import type { Category } from "@/types/category";

export const metadata: Metadata = { title: "Categories" };

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 py-20 text-center">
      <svg
        className="mb-4 h-10 w-10 text-gray-300"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
        />
      </svg>
      <p className="text-sm font-semibold text-gray-700">No categories yet</p>
      <p className="mt-1 text-xs text-gray-400">Categories will appear here once added.</p>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
// Server Component — fetch happens on the server, no client JS needed.
// Errors bubble to error.tsx. Loading state is handled by loading.tsx (Suspense).

export default async function CategoriesPage() {
  const categories: Category[] = await getCategories({ includeCount: true });

  const totalListings = categories.reduce((sum, c) => sum + (c.count ?? 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Browse Categories</h1>
        <p className="mt-1 text-sm text-gray-500">
          {categories.length} {categories.length === 1 ? "category" : "categories"}
          {totalListings > 0 && (
            <> · {totalListings.toLocaleString()} total listings</>
          )}
        </p>
      </div>

      {categories.length === 0 ? (
        <EmptyState />
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
