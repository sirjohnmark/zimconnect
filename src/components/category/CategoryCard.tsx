import Link from "next/link";
import Image from "next/image";
import type { Category } from "@/types";

interface CategoryCardProps {
  category: Category;
  className?: string;
}

export default function CategoryCard({ category, className }: CategoryCardProps) {
  const isUrl = category.icon?.startsWith("http") ?? false;

  return (
    <Link
      href={`/category/${category.slug}`}
      className={`group flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 hover:border-green-300 hover:shadow-md transition-all ${className ?? ""}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 group-hover:bg-green-100 transition-colors">
        {isUrl ? (
          <Image
            src={category.icon!}
            alt=""
            width={28}
            height={28}
            className="object-contain"
          />
        ) : (
          <span className="text-2xl leading-none" aria-hidden="true">
            {category.icon ?? "📦"}
          </span>
        )}
      </div>

      <span className="text-sm font-medium text-gray-700 group-hover:text-green-700 text-center leading-snug transition-colors">
        {category.name}
      </span>

      {category.listings_count > 0 && (
        <span className="text-xs text-gray-400">
          {category.listings_count.toLocaleString()}
        </span>
      )}
    </Link>
  );
}
