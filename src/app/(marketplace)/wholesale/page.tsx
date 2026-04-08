"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { BackButton } from "@/components/ui/BackButton";
import { getWholesaleListings } from "@/lib/mock/wholesale";
import type { WholesaleListing, WholesaleCategory } from "@/types/wholesale";
import { cn } from "@/lib/utils";

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORIES: { value: WholesaleCategory | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "agriculture", label: "Agriculture" },
  { value: "electronics", label: "Electronics" },
  { value: "hardware", label: "Hardware" },
  { value: "catering", label: "Catering" },
  { value: "fashion", label: "Fashion" },
  { value: "printing-machinery", label: "Printing & Paper" },
  { value: "mining-equipment", label: "Mining & Fuel" },
  { value: "transportation", label: "Transportation" },
  { value: "general", label: "General" },
];

// ─── WhatsApp helper ──────────────────────────────────────────────────────────

function toWhatsAppHref(phone: string, title: string) {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("263") ? digits : `263${digits.replace(/^0/, "")}`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(`Hi, I'm interested in your wholesale listing on ZimConnect: "${title}". Please send more details.`)}`;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function PinIcon() {
  return (
    <svg className="h-3 w-3 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M8 1.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9ZM2 6a6 6 0 1 1 10.743 3.685l-3.45 4.6a1.6 1.6 0 0 1-2.586 0l-3.45-4.6A5.97 5.97 0 0 1 2 6Zm6 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
    </svg>
  );
}

// ─── Wholesale card ───────────────────────────────────────────────────────────

function WholesaleCard({ listing }: { listing: WholesaleListing }) {
  const [expanded, setExpanded] = useState(false);
  const coverImage = listing.images[0]?.url ?? null;

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 overflow-hidden">
      {/* Image */}
      <div className="relative aspect-[16/9] w-full bg-gray-100">
        {coverImage ? (
          <Image src={coverImage} alt={listing.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg className="h-10 w-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5a1.5 1.5 0 001.5 1.5z" />
            </svg>
          </div>
        )}
        {/* Wholesale badge */}
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white uppercase tracking-wide">
            Wholesale
          </span>
        </div>
        {listing.category && (
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white capitalize">
              {listing.category.replace(/-/g, " ")}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2">{listing.title}</h3>
          {listing.description && (
            <div className="mt-1">
              <p className={cn("text-sm text-gray-500 leading-relaxed", !expanded && "line-clamp-2")}>
                {listing.description}
              </p>
              {listing.description.length > 100 && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-0.5 text-xs font-medium text-emerald-600 hover:text-emerald-700"
                >
                  {expanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Price + MOQ */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-1.5 text-center">
            <p className="text-xs text-emerald-600 font-medium">Unit Price</p>
            <p className="text-lg font-extrabold text-emerald-700">
              ${listing.price.toLocaleString()}
            </p>
            <p className="text-xs text-emerald-600">{listing.priceUnit}</p>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-1.5 text-center">
            <p className="text-xs text-amber-600 font-medium">Min. Order</p>
            <p className="text-lg font-extrabold text-amber-700">
              {listing.moq.toLocaleString()}
            </p>
            <p className="text-xs text-amber-600">{listing.moqUnit}</p>
          </div>
        </div>

        {/* Location + Delivery */}
        <div className="flex items-center justify-between gap-2 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <PinIcon />
            {listing.location}{listing.sublocation ? ` · ${listing.sublocation}` : ""}
          </span>
          {listing.delivery.available ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                <path d="M1.5 3.5A.5.5 0 0 1 2 3h8a.5.5 0 0 1 .5.5V5h1.2a.5.5 0 0 1 .4.2l1.8 2.4a.5.5 0 0 1 .1.3V10a.5.5 0 0 1-.5.5H13a2 2 0 0 1-4 0H5a2 2 0 0 1-4 0H.5A.5.5 0 0 1 0 10V4a.5.5 0 0 1 .5-.5h1v.5H1.5v-.5Zm1 7a1 1 0 1 0 2 0 1 1 0 0 0-2 0Zm7.5 0a1 1 0 1 0 2 0 1 1 0 0 0-2 0Z" />
              </svg>
              Delivery
            </span>
          ) : (
            <span className="text-gray-400">Collection only</span>
          )}
        </div>

        {listing.delivery.available && listing.delivery.note && (
          <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100">
            {listing.delivery.note}
          </p>
        )}
      </div>

      {/* Contact buttons */}
      {listing.seller.phone && (
        <div className="flex gap-2 border-t border-gray-100 px-4 py-3">
          <a
            href={`tel:${listing.seller.phone}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
            </svg>
            Call
          </a>
          <a
            href={toWhatsAppHref(listing.seller.phone, listing.title)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#25D366] py-2 text-xs font-semibold text-white hover:bg-[#1ebe5d] transition-colors"
          >
            <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WholesalePage() {
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("");
  const [category, setCategory] = useState<WholesaleCategory | "">("");
  const [submitted, setSubmitted] = useState({ q: "", loc: "", category: "" as WholesaleCategory | "" });

  const { listings, isFallback } = useMemo(
    () => getWholesaleListings({ q: submitted.q, loc: submitted.loc, category: submitted.category }),
    [submitted],
  );

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted({ q: q.trim(), loc: loc.trim(), category });
  }

  return (
    <div className="space-y-6">
      <BackButton href="/listings" label="Back to marketplace" className="-ml-1" />

      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25ZM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875h.375a3 3 0 1 1 6 0h3a.75.75 0 0 0 .75-.75V15Z" />
              <path d="M8.25 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0ZM15.75 6.75a.75.75 0 0 0-.75.75v11.25c0 .087.015.17.042.248a3 3 0 0 1 5.958.464c.853-.175 1.522-.935 1.464-1.883a18.659 18.659 0 0 0-3.732-10.104 1.837 1.837 0 0 0-1.47-.725H15.75Z" />
              <path d="M19.5 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" />
            </svg>
          </span>
          <div>
            <h1 className="text-2xl font-bold">Wholesale Marketplace</h1>
            <p className="text-amber-100 text-sm">Bulk prices · Direct from suppliers</p>
          </div>
        </div>
        <p className="text-amber-50 text-sm leading-relaxed">
          Browse verified wholesale suppliers across Zimbabwe. All listings show unit price and minimum order quantity (MOQ).
        </p>
      </div>

      {/* Search + filters */}
      <form onSubmit={handleSearch} className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          {/* Keyword */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <SearchIcon />
            </div>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search wholesale listings…"
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Location */}
          <div className="relative sm:w-48">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <PinIcon />
            </div>
            <input
              type="search"
              value={loc}
              onChange={(e) => setLoc(e.target.value)}
              placeholder="Location or area…"
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-8 pr-3 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-400 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 active:scale-[0.97] transition-all shadow-sm"
          >
            <SearchIcon />
            Search
          </button>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => {
                setCategory(cat.value as WholesaleCategory | "");
                setSubmitted((s) => ({ ...s, category: cat.value as WholesaleCategory | "" }));
              }}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors",
                category === cat.value
                  ? "border-amber-500 bg-amber-500 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-amber-300 hover:text-amber-700",
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </form>

      {/* Results header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-600">
          {listings.length} listing{listings.length !== 1 ? "s" : ""} found
        </p>
        <Link
          href="/dashboard/wholesale"
          className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
          </svg>
          Add Wholesale Listing
        </Link>
      </div>

      {/* Fallback notice */}
      {isFallback && submitted.q && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 mt-0.5 text-amber-500">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
          <span>No exact match for <strong>&ldquo;{submitted.q}&rdquo;</strong> — showing nearest results.</span>
        </div>
      )}

      {/* Grid */}
      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 py-20 text-center">
          <svg className="mb-4 h-10 w-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          <p className="text-sm font-semibold text-gray-700">No wholesale listings found</p>
          <p className="mt-1 text-xs text-gray-400">Try adjusting your search or category filter.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing: WholesaleListing) => (
            <WholesaleCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
