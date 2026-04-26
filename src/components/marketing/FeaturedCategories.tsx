import Link from "next/link";
import { CategoryCard } from "@/components/marketplace/CategoryCard";
import { getCategories } from "@/lib/api/categories";

export async function FeaturedCategories() {
  const categories = await getCategories({ page_size: 8 }).catch(() => []);

  return (
    <section className="bg-light-gray py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-apple-blue mb-1">Shop by type</p>
            <h2 className="text-2xl font-semibold text-near-black sm:text-[32px] tracking-tight">Browse Categories</h2>
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

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
}
