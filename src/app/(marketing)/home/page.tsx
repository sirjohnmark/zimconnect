import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Home" };

export default function HomePage() {
  return (
    <section className="flex flex-col items-center justify-center py-28 text-center px-4">
      <span className="mb-4 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
        Zimbabwe&apos;s #1 Marketplace
      </span>
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
        Buy and Sell <br className="hidden sm:block" />
        <span className="text-blue-600">Anything in Zimbabwe</span>
      </h1>
      <p className="mt-5 max-w-xl text-lg text-gray-500">
        From electronics to property — ZimConnect brings buyers and sellers
        together with ease and confidence.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/listings"
          className="rounded-md bg-blue-600 px-7 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Browse Listings
        </Link>
        <Link
          href="/register"
          className="rounded-md border border-gray-300 px-7 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Start Selling
        </Link>
      </div>

      <div className="mt-20 grid grid-cols-2 gap-6 sm:grid-cols-4 text-center">
        {[
          { stat: "50K+", label: "Active Listings" },
          { stat: "12K+", label: "Verified Sellers" },
          { stat: "8", label: "Categories" },
          { stat: "10+", label: "Cities Covered" },
        ].map(({ stat, label }) => (
          <div key={label}>
            <p className="text-3xl font-bold text-gray-900">{stat}</p>
            <p className="mt-1 text-sm text-gray-500">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
