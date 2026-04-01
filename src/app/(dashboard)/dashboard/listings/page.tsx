"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ListingCard } from "@/components/marketplace/ListingCard";
import type { Listing } from "@/types/listing";

const STORAGE_KEY = "zimconnect_listings";

function getMyListings(): Listing[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Listing[]) : [];
  } catch {
    return [];
  }
}

export default function DashboardListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setListings(getMyListings());
    setMounted(true);
  }, []);

  function deleteListing(id: string) {
    const updated = listings.filter((l) => l.id !== id);
    setListings(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-7 w-32 animate-pulse rounded-md bg-gray-200" />
          <div className="h-9 w-36 animate-pulse rounded-lg bg-gray-200" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-72 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">My Listings</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {listings.length} listing{listings.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/dashboard/listings/create"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-[0.96] active:bg-emerald-800 transition-all duration-75"
        >
          + New Listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 py-20 text-center">
          <svg className="mb-4 h-10 w-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
          </svg>
          <p className="text-sm font-semibold text-gray-700">No listings yet</p>
          <p className="mt-1 text-xs text-gray-400">Post your first listing and start selling today.</p>
          <Link
            href="/dashboard/listings/create"
            className="mt-5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            Create Your First Listing
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => (
            <div key={listing.id} className="flex flex-col gap-2">
              <ListingCard listing={listing} />
              <button
                onClick={() => deleteListing(listing.id)}
                className="w-full rounded-lg border border-red-200 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                Delete listing
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
