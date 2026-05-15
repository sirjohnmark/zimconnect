"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BackButton } from "@/components/ui/BackButton";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { getSavedListings, unsaveListing, type SavedListingDetail } from "@/lib/api/buyers";
import type { Listing } from "@/types/listing";

function toListingShape(detail: SavedListingDetail): Listing {
  return {
    id: detail.id,
    title: detail.title,
    slug: detail.slug,
    description: "",
    price: detail.price,
    currency: detail.currency as Listing["currency"],
    condition: detail.condition as Listing["condition"],
    status: detail.status as Listing["status"],
    location: detail.location,
    category: {
      id: detail.category.id,
      name: detail.category.name,
      slug: detail.category.name.toLowerCase().replace(/\s+/g, "-"),
    },
    owner: {
      id: detail.owner.id,
      username: detail.owner.username,
      profile_picture: null,
    },
    images: [],
    primary_image: detail.primary_image?.image ?? null,
    is_featured: detail.is_featured,
    views_count: detail.views_count,
    rejection_reason: null,
    created_at: detail.created_at,
    updated_at: detail.created_at,
    published_at: null,
  };
}

export default function SavedPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSavedListings()
      .then((saved) => setListings(saved.map((s) => toListingShape(s.listing))))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleRemove(id: number) {
    setListings((prev) => prev.filter((l) => l.id !== id)); // optimistic
    try {
      await unsaveListing(id);
    } catch {
      // Revert is complex without refetch; rely on next page load to reconcile
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 animate-pulse rounded-md bg-gray-200" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="aspect-[3/4] animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <BackButton href="/dashboard" label="Dashboard" className="-ml-1 mb-1" />
          <h1 className="text-xl font-semibold text-gray-900">Saved Listings</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {listings.length} saved item{listings.length !== 1 ? "s" : ""}
          </p>
        </div>
        {listings.length > 0 && (
          <Link href="/listings" className="text-sm font-semibold text-apple-blue hover:text-apple-blue transition-colors">
            Browse more →
          </Link>
        )}
      </div>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-20 text-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-12 w-12 text-gray-300 mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
          <p className="text-sm font-semibold text-gray-600">No saved listings yet</p>
          <p className="mt-1 text-xs text-gray-400">Tap the heart icon on any listing to save it here.</p>
          <Link href="/listings" className="mt-5 rounded-lg bg-apple-blue px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
            Browse Listings
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing) => (
            <div key={listing.id} className="flex flex-col gap-2">
              <ListingCard listing={listing} />
              <button
                onClick={() => handleRemove(listing.id)}
                className="w-full rounded-lg border border-rose-200 py-1.5 text-xs font-medium text-rose-500 hover:bg-rose-50 transition-colors"
              >
                Remove from saved
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
