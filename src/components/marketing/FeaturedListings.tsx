import Link from "next/link";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { getListings } from "@/lib/api/listings";

export async function FeaturedListings() {
  let listings: Awaited<ReturnType<typeof getListings>>["results"] = [];
  try {
    const res = await getListings({ featured: true, page_size: 8, ordering: "-created_at" });
    listings = res.results;
    // fallback: if no featured listings, show latest
    if (listings.length === 0) {
      const fallback = await getListings({ page_size: 8, ordering: "-created_at" });
      listings = fallback.results;
    }
  } catch {
    // silently skip — section just won't render
  }

  if (listings.length === 0) return null;

  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-apple-blue mb-1">Fresh picks</p>
            <h2 className="text-2xl font-semibold text-near-black sm:text-[32px] tracking-tight">Featured Listings</h2>
            <p className="mt-1.5 text-sm text-[rgba(0,0,0,0.48)]">Handpicked deals from across Zimbabwe</p>
          </div>
          <Link
            href="/listings"
            className="inline-flex items-center gap-1 text-sm font-semibold text-apple-blue hover:text-apple-blue transition-colors shrink-0"
          >
            View all listings
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>

        {/* Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>

        {/* Mobile view-all */}
        <div className="mt-10 text-center sm:hidden">
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            See all listings
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
