"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

const POPULAR = ["Phones", "Cars", "Apartments", "Laptops", "Jobs", "Furniture"];

const STATS = [
  { value: "50K+", label: "Active Listings" },
  { value: "12K+", label: "Sellers" },
  { value: "10+",  label: "Cities" },
  { value: "Free", label: "To List" },
];

// ─── Decorative preview cards (UI chrome, not API data) ───────────────────────

const PREVIEW_CARDS = [
  {
    id: 1,
    title: "iPhone 15 Pro Max",
    price: "USD 950",
    location: "Harare",
    tag: "New",
    tagClass: "bg-apple-blue",
    from: "#1e3a8a",
    to: "#0f172a",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.25} className="h-14 w-14 text-white/25">
        <rect x="5" y="2" width="14" height="20" rx="3" />
        <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
        <line x1="10" y1="5" x2="14" y2="5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 2,
    title: "Luxury 3-Bed Apartment",
    price: "USD 480/mo",
    location: "Avondale, Harare",
    tag: "Featured",
    tagClass: "bg-amber-500",
    from: "#065f46",
    to: "#0f172a",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.25} className="h-14 w-14 text-white/25">
        <path d="M3 12L12 3l9 9" />
        <path d="M9 21V12h6v9" />
        <path d="M3 12v9h18v-9" />
      </svg>
    ),
  },
  {
    id: 3,
    title: "Toyota Hilux GD6 2021",
    price: "USD 18,500",
    location: "Bulawayo",
    tag: "Like New",
    tagClass: "bg-teal-600",
    from: "#312e81",
    to: "#0f172a",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.25} className="h-14 w-14 text-white/25">
        <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-4h10l2 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />
        <circle cx="7.5" cy="17.5" r="2.5" />
        <circle cx="16.5" cy="17.5" r="2.5" />
      </svg>
    ),
  },
] as const;

function PinIcon() {
  return (
    <svg className="h-3 w-3 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M8 1.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9ZM2 6a6 6 0 1 1 10.743 3.685l-3.45 4.6a1.6 1.6 0 0 1-2.586 0l-3.45-4.6A5.97 5.97 0 0 1 2 6Z" clipRule="evenodd" />
    </svg>
  );
}

interface PreviewCardProps {
  card: typeof PREVIEW_CARDS[number];
  className?: string;
}

function PreviewCard({ card, className }: PreviewCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-md overflow-hidden",
        "shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
        className,
      )}
    >
      {/* Image area */}
      <div
        className="relative flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${card.from}, ${card.to})`,
          height: 130,
        }}
      >
        {card.icon}
        <span
          className={cn(
            "absolute top-2.5 left-2.5 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white",
            card.tagClass,
          )}
        >
          {card.tag}
        </span>
      </div>
      {/* Content */}
      <div className="px-3.5 py-3">
        <p className="text-white text-sm font-semibold leading-snug line-clamp-1">{card.title}</p>
        <p className="text-apple-blue text-base font-bold mt-0.5 tracking-tight">{card.price}</p>
        <div className="flex items-center gap-1 mt-1.5 text-white/35 text-xs">
          <PinIcon />
          <span className="truncate">{card.location}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

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
    <section className="relative overflow-hidden bg-near-black">

      {/* ── Background layer ── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {/* Subtle dot grid */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:28px_28px]" />
        {/* Blue glow — top left */}
        <div className="absolute -top-32 -left-32 h-[600px] w-[600px] rounded-full bg-apple-blue opacity-[0.13] blur-[120px]" />
        {/* Indigo glow — bottom right */}
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] translate-x-1/4 translate-y-1/4 rounded-full bg-indigo-600 opacity-[0.09] blur-[100px]" />
        {/* Teal accent — mid right */}
        <div className="absolute top-1/2 right-1/3 h-[300px] w-[300px] -translate-y-1/2 rounded-full bg-cyan-500 opacity-[0.05] blur-[80px]" />
        {/* Bottom fade into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-near-black/60 to-transparent" />
      </div>

      {/* ── Content ── */}
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 py-24 lg:min-h-[90vh] lg:grid-cols-[1fr_460px] lg:gap-16 lg:py-0">

          {/* ──── Left: Main copy ──── */}
          <div className="flex flex-col">

            {/* Live badge */}
            <div className="mb-7 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-apple-blue opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-apple-blue" />
              </span>
              <span className="text-xs font-medium text-white/60">Zimbabwe&apos;s #1 Marketplace</span>
            </div>

            {/* Headline */}
            <h1 className="text-[clamp(2.75rem,6vw,4.5rem)] font-semibold leading-[1.05] tracking-tight text-white">
              Buy and sell
              <br />
              <span
                className="text-apple-blue"
                style={{ textShadow: "0 0 80px rgba(0,113,227,0.45)" }}
              >
                anything
              </span>
              <br />
              in Zimbabwe
            </h1>

            {/* Subheadline */}
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-white/50 font-normal">
              From electronics to property — Sanganai connects buyers and sellers
              across Zimbabwe. Free to list, fast to sell.
            </p>

            {/* Search bar */}
            <form
              onSubmit={handleSearch}
              className="mt-8 flex max-w-[520px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07] backdrop-blur-xl transition-all duration-200 focus-within:border-apple-blue/50 focus-within:bg-white/[0.10] focus-within:shadow-[0_0_0_3px_rgba(0,113,227,0.15)]"
            >
              <span className="flex shrink-0 items-center pl-5 text-white/30" aria-hidden="true">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search listings — phones, cars, apartments…"
                className="flex-1 min-w-0 bg-transparent px-4 py-4 text-sm text-white placeholder:text-white/30 focus:outline-none"
              />
              <div className="flex shrink-0 items-center p-2">
                <button
                  type="submit"
                  className="rounded-xl bg-apple-blue px-5 py-2.5 text-sm font-normal text-white hover:opacity-90 active:opacity-80 transition-opacity"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Popular chips */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-white/25">Popular:</span>
              {POPULAR.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChip(chip)}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/50 backdrop-blur-sm transition-colors hover:border-apple-blue/50 hover:text-white"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* CTA row */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/listings"
                className="rounded-full bg-apple-blue px-7 py-3 text-sm font-normal text-white hover:opacity-90 active:opacity-80 transition-opacity"
              >
                Browse Listings
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-white/15 px-7 py-3 text-sm font-normal text-white/70 transition-all hover:border-white/30 hover:text-white"
              >
                Start Selling Free →
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-12 flex flex-wrap gap-x-10 gap-y-5 border-t border-white/10 pt-8">
              {STATS.map(({ value, label }) => (
                <div key={label}>
                  <p className="text-2xl font-semibold text-white">{value}</p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-wider text-white/35">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ──── Right: Preview cards ──── */}
          <div className="hidden lg:grid grid-cols-2 gap-4">
            {/* Top-left card */}
            <PreviewCard card={PREVIEW_CARDS[0]} />
            {/* Top-right card — pushed down for masonry feel */}
            <PreviewCard card={PREVIEW_CARDS[1]} className="mt-10" />
            {/* Bottom — full-width wide card */}
            <div
              className={cn(
                "col-span-2 rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-md overflow-hidden",
                "shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
                "flex items-stretch",
              )}
            >
              {/* Image strip */}
              <div
                className="w-36 shrink-0 flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${PREVIEW_CARDS[2].from}, ${PREVIEW_CARDS[2].to})` }}
              >
                {PREVIEW_CARDS[2].icon}
              </div>
              {/* Details */}
              <div className="flex flex-col justify-center px-4 py-4 min-w-0">
                <span className={cn("mb-1.5 w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold text-white", PREVIEW_CARDS[2].tagClass)}>
                  {PREVIEW_CARDS[2].tag}
                </span>
                <p className="text-white text-sm font-semibold leading-snug line-clamp-1">{PREVIEW_CARDS[2].title}</p>
                <p className="text-apple-blue text-base font-bold mt-0.5 tracking-tight">{PREVIEW_CARDS[2].price}</p>
                <div className="flex items-center gap-1 mt-1.5 text-white/35 text-xs">
                  <PinIcon />
                  <span className="truncate">{PREVIEW_CARDS[2].location}</span>
                </div>
              </div>
            </div>

            {/* Activity toast */}
            <div className="col-span-2 flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 backdrop-blur-sm">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400" />
              </span>
              <p className="text-xs text-white/45 leading-snug">
                <span className="font-medium text-white/70">247 new listings</span> added in the last 24 hours across Zimbabwe
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ── Bottom edge blend into light section ── */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-24"
        aria-hidden="true"
        style={{ background: "linear-gradient(to top, #f5f5f7, transparent)" }}
      />
    </section>
  );
}
