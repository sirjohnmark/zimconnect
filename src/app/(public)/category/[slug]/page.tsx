import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCategoryBySlug } from "@/lib/queries/categories";
import { getListingsByCategory } from "@/lib/queries/listings";
import ListingCard from "@/components/listings/ListingCard";
import CategoryBreadcrumb from "@/components/category/CategoryBreadcrumb";
import { CATEGORY_LISTINGS_PER_PAGE } from "@/lib/constants";
import type { PageProps } from "@/types";

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps<{ slug: string }>) {
  const { slug } = await params;
  const sp = await searchParams;

  const rawPage = Number(sp?.page ?? "1");
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const { listings, total } = await getListingsByCategory(category.id, page);

  const totalPages = Math.ceil(total / CATEGORY_LISTINGS_PER_PAGE);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  function pageHref(p: number) {
    return `/category/${slug}?page=${p}`;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb */}
        <CategoryBreadcrumb category={category} />

        {/* Header */}
        <div className="flex items-center gap-3">
          {category.icon && (
            <span className="text-3xl leading-none" aria-hidden="true">
              {category.icon}
            </span>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
            {total > 0 && (
              <p className="text-sm text-gray-500 mt-0.5">
                {total.toLocaleString()} active listing{total !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>

        {/* Listings grid */}
        {listings.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-20 text-center">
            <p className="text-gray-500">No listings in this category yet.</p>
            <Link
              href="/sell"
              className="mt-4 inline-block rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
            >
              Be the first to post
            </Link>
          </div>
        ) : (
          <>
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {listings.map((listing) => (
                <li key={listing.id}>
                  <ListingCard listing={listing} />
                </li>
              ))}
            </ul>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav
                className="flex items-center justify-between border-t border-gray-200 pt-6"
                aria-label="Pagination"
              >
                {hasPrev ? (
                  <Link
                    href={pageHref(page - 1)}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Link>
                ) : (
                  <span />
                )}

                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>

                {hasNext ? (
                  <Link
                    href={pageHref(page + 1)}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  );
}
