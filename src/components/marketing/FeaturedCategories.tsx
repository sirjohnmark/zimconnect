import Link from "next/link";
import { CategoryCard } from "@/components/marketplace/CategoryCard";
import { MOCK_CATEGORIES } from "@/lib/mock/categories";

export function FeaturedCategories() {
  // Show first 8 — replace slice with API call when backend is ready
  const categories = MOCK_CATEGORIES.slice(0, 8);

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Browse Categories</h2>
            <p className="mt-1 text-sm text-gray-500">Find exactly what you&apos;re looking for</p>
          </div>
          <Link href="/categories" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
            View all →
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
