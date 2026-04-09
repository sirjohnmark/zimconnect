"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const POPULAR = ["Phones", "Cars", "Apartments", "Laptops", "Jobs", "Furniture"];

const STATS = [
  { value: "50K+", label: "Active Listings" },
  { value: "12K+", label: "Verified Sellers" },
  { value: "8",    label: "Categories" },
  { value: "10+",  label: "Cities" },
];

export function HeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/listings?q=${encodeURIComponent(q)}` : "/listings");
  }

  function handleChip(label: string) {
    router.push(`/listings?q=${encodeURIComponent(label)}`);
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white">
      {/* Subtle grid pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black_40%,transparent_100%)] opacity-40"
      />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-28 text-center">

        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Zimbabwe&apos;s #1 Marketplace
        </div>

        {/* Headline */}
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
          Buy and Sell{" "}
          <span className="relative text-emerald-600">
            Anything
            {/* Underline squiggle */}
            <svg
              aria-hidden="true"
              viewBox="0 0 418 42"
              className="absolute -bottom-2 left-0 h-[0.4em] w-full fill-emerald-300/60"
              preserveAspectRatio="none"
            >
              <path d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.780 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.540-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z" />
            </svg>
          </span>
          {" "}in Zimbabwe
        </h1>

        {/* Sub-headline */}
        <p className="mt-5 max-w-2xl mx-auto text-lg text-gray-500 leading-relaxed">
          From electronics to property — Sanganai connects buyers and sellers
          across Zimbabwe. Free to list, fast to sell.
        </p>

        {/* Search bar */}
        <form
          onSubmit={handleSearch}
          className="mt-8 mx-auto flex max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md shadow-gray-100 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 transition-all"
        >
          {/* Search icon */}
          <span className="flex items-center pl-4 text-gray-400" aria-hidden="true">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search — phones, cars, apartments…"
            className="flex-1 min-w-0 bg-transparent px-3 py-3.5 sm:px-4 sm:py-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
          <button
            type="submit"
            className="m-1.5 shrink-0 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 active:bg-emerald-800 transition-all duration-75"
          >
            Search
          </button>
        </form>

        {/* Popular chips */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <span className="text-xs text-gray-400 self-center">Popular:</span>
          {POPULAR.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleChip(chip)}
              className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row justify-center">
          <Link
            href="/listings"
            className="rounded-xl bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.97] active:bg-emerald-800 transition-all duration-75"
          >
            Browse Listings
          </Link>
          <Link
            href="/register"
            className="rounded-xl border border-gray-200 bg-white px-8 py-3.5 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 active:scale-[0.97] active:bg-gray-100 transition-all duration-75"
          >
            Get Started →
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
          {STATS.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center">
              <p className="text-3xl font-extrabold text-gray-900">{value}</p>
              <p className="mt-1 text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
