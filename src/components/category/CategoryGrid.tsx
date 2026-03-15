import CategoryCard from "@/components/category/CategoryCard";
import type { Category } from "@/types";

interface CategoryGridProps {
  categories: Category[];
  className?: string;
}

export default function CategoryGrid({ categories, className }: CategoryGridProps) {
  if (categories.length === 0) {
    return (
      <p className="text-center text-sm text-gray-500 py-8">No categories found.</p>
    );
  }

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 ${className ?? ""}`}
    >
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
}
