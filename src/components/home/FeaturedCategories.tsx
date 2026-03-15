import Link from "next/link";
import CategoryCard from "@/components/category/CategoryCard";
import type { Category } from "@/types";

interface FeaturedCategoriesProps {
  categories: Category[];
}

export default function FeaturedCategories({ categories }: FeaturedCategoriesProps) {
  const top8 = categories.slice(0, 8);

  if (top8.length === 0) return null;

  return (
    <section className="py-14 bg-slate-50" id="categories">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Browse by category</h2>
            <p className="mt-1 text-sm text-slate-500">Find exactly what you need</p>
          </div>
          <Link
            href="/search"
            className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {top8.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
}
