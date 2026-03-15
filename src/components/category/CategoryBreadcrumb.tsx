import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Category } from "@/types";

interface CategoryBreadcrumbProps {
  category: Category;
  className?: string;
}

export default function CategoryBreadcrumb({ category, className }: CategoryBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-1 text-sm text-gray-500">
        <li>
          <Link href="/" className="hover:text-green-600 transition-colors">
            Home
          </Link>
        </li>
        <li aria-hidden="true">
          <ChevronRight className="w-4 h-4" />
        </li>
        <li>
          <Link href="/category" className="hover:text-green-600 transition-colors">
            Categories
          </Link>
        </li>
        <li aria-hidden="true">
          <ChevronRight className="w-4 h-4" />
        </li>
        <li aria-current="page" className="font-medium text-gray-900 truncate max-w-[200px]">
          {category.name}
        </li>
      </ol>
    </nav>
  );
}
