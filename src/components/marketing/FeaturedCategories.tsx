import Link from "next/link";
import { CategoryCard } from "@/components/marketplace/CategoryCard";
import { MOCK_CATEGORIES } from "@/lib/mock/categories";

export function FeaturedCategories() {
  const categories = MOCK_CATEGORIES.slice(0, 8);

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-apple-blue mb-1">Shop by type</p>
            <h2 className="text-2xl font-semibold text-near-black sm:text-[32px] tracking-tight">Browse Categories</h2>
            <p className="mt-1.5 text-sm text-[rgba(0,0,0,0.48)]">Find exactly what you&apos;re looking for</p>
          </div>
          <Link
            href="/categories"
            className="inline-flex items-center gap-1 text-sm font-semibold text-apple-blue hover:opacity-80 transition-opacity shrink-0"
          >
            All categories
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
}
