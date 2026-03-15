import Link from "next/link";
import { getAllCategories } from "@/lib/queries/categories";
import CategoryCard from "@/components/category/CategoryCard";

export default async function FeaturedCategories() {
  const categories = await getAllCategories();
  const top8 = categories.slice(0, 8);

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Browse by category</h2>
          <Link
            href="/category"
            className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
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
