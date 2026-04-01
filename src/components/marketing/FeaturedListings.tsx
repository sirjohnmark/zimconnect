import Link from "next/link";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { MOCK_LISTINGS } from "@/lib/mock/listings";

export function FeaturedListings() {
  // Show first 6 — replace with API call when backend is ready
  const listings = MOCK_LISTINGS.slice(0, 6);

  return (
    <section className="bg-gray-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Featured Listings</h2>
            <p className="mt-1 text-sm text-gray-500">Fresh picks from across Zimbabwe</p>
          </div>
          <Link href="/listings" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
            View all →
          </Link>
        </div>

        {/* Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>
    </section>
  );
}
