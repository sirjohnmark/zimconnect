import Link from "next/link";
import ListingCard from "@/components/listings/ListingCard";
import type { Listing } from "@/types";

interface FeaturedListingsProps {
  listings: Listing[];
}

export default function FeaturedListings({ listings }: FeaturedListingsProps) {
  if (listings.length === 0) return null;

  return (
    <section className="py-14 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Latest listings</h2>
            <p className="mt-1 text-sm text-slate-500">Fresh items posted by sellers near you</p>
          </div>
          <Link
            href="/search"
            className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-brand-400 transition-all"
          >
            Browse all listings →
          </Link>
        </div>
      </div>
    </section>
  );
}
