"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function HeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/listings?q=${encodeURIComponent(q)}` : "/listings");
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-20 sm:py-28">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-emerald-100/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-0 h-96 w-96 rounded-full bg-teal-100/40 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1.5 text-xs font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Zimbabwe&apos;s #1 Marketplace
        </span>

        {/* Headline */}
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
          Buy and Sell{" "}
          <span className="text-emerald-600">Anything</span>
          <br className="hidden sm:block" /> in Zimbabwe
        </h1>

        {/* Sub-headline */}
        <p className="mt-5 max-w-2xl mx-auto text-lg text-gray-500 leading-relaxed">
          From electronics to property — ZimConnect connects buyers and sellers
          across Zimbabwe with ease and confidence.
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="mt-8 mx-auto flex max-w-xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search listings — phones, cars, apartments…"
            className="flex-1 px-5 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
          <button
            type="submit"
            className="shrink-0 bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            Search
          </button>
        </form>

        {/* CTA buttons */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row justify-center">
          <Link
            href="/listings"
            className="rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
          >
            Browse Listings
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-gray-300 bg-white px-8 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            Start Selling
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-14 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            { stat: "50K+",  label: "Active Listings" },
            { stat: "12K+",  label: "Verified Sellers" },
            { stat: "8",     label: "Categories" },
            { stat: "10+",   label: "Cities Covered" },
          ].map(({ stat, label }) => (
            <div key={label} className="flex flex-col items-center">
              <p className="text-3xl font-extrabold text-gray-900">{stat}</p>
              <p className="mt-1 text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
