import Link from "next/link";
import { TrendingUp, Flame, Search } from "lucide-react";
import ListingCard from "@/components/listings/ListingCard";
import type { Listing } from "@/types";

/** Static trending search terms relevant to Zimbabwean marketplace */
const TRENDING_SEARCHES = [
  { label: "iPhone", q: "iphone" },
  { label: "Toyota", q: "toyota" },
  { label: "Laptop", q: "laptop" },
  { label: "Sofa", q: "sofa" },
  { label: "Samsung TV", q: "samsung tv" },
  { label: "Generator", q: "generator" },
  { label: "Honda Fit", q: "honda fit" },
  { label: "MacBook", q: "macbook" },
  { label: "Fridge", q: "fridge" },
  { label: "Land Cruiser", q: "land cruiser" },
  { label: "PlayStation", q: "playstation" },
  { label: "Solar Panel", q: "solar panel" },
];

interface TopDealsProps {
  listings: Listing[];
}

export default function TopDeals({ listings }: TopDealsProps) {
  return (
    <section className="py-14 bg-slate-50" id="top-deals">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* ── Section header ── */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500" aria-hidden="true" />
            <h2 className="text-2xl font-bold text-slate-900">Top Deals</h2>
          </div>
          <Link
            href="/search?sort=popular"
            className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            View all →
          </Link>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          Most popular listings right now — high demand, don&apos;t miss out
        </p>

        {/* ── Trending searches ── */}
        <div className="mb-8">
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp className="w-4 h-4 text-brand-600" />
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Hot searches
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {TRENDING_SEARCHES.map((item) => (
              <Link
                key={item.q}
                href={`/search?q=${encodeURIComponent(item.q)}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50 transition-all"
              >
                <Search className="w-3 h-3 text-slate-400" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* ── Top deal listings grid ── */}
        {listings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {listings.map((listing, i) => (
                <div key={listing.id} className={i < 2 ? "sm:col-span-1 lg:col-span-2" : ""}>
                  <ListingCard listing={listing} />
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Fallback when no listings yet */
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
            <Flame className="mx-auto w-8 h-8 text-orange-300 mb-3" />
            <p className="text-sm text-slate-500">
              Top deals will appear here as listings get views.
            </p>
            <Link
              href="/search"
              className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
            >
              Browse all listings
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
