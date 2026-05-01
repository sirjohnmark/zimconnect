"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BackButton } from "@/components/ui/BackButton";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { getMyListings, deleteListing } from "@/lib/api/listings";
import type { Listing } from "@/types/listing";

function GridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3].map((n) => (
        <div key={n} className="h-72 animate-pulse rounded-xl bg-gray-100" />
      ))}
    </div>
  );
}

export default function DashboardListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyListings({ page_size: 100 });
      setListings(res.results);
      setTotal(res.count);
    } catch {
      setError("Failed to load your listings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  async function handleDelete(id: number) {
    if (!confirm("Delete this listing? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await deleteListing(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
      setTotal((t) => t - 1);
    } catch {
      alert("Failed to delete listing. Please try again.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <BackButton href="/dashboard" label="Dashboard" className="-ml-1 mb-1" />
          <h1 className="text-xl font-semibold text-gray-900">My Listings</h1>
          {!loading && (
            <p className="mt-0.5 text-sm text-gray-500">
              {total} listing{total !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <Link
          href="/dashboard/listings/create"
          className="rounded-lg bg-apple-blue px-4 py-2 text-sm font-semibold text-white hover:bg-apple-blue active:scale-[0.96] transition-all duration-75"
        >
          + New Listing
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button type="button" onClick={fetchListings} className="ml-auto text-xs font-medium underline">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <GridSkeleton />
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 py-20 text-center">
          <svg className="mb-4 h-10 w-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
          </svg>
          <p className="text-sm font-semibold text-gray-700">No listings yet</p>
          <p className="mt-1 text-xs text-gray-400">Post your first listing and start selling today.</p>
          <Link
            href="/dashboard/listings/create"
            className="mt-5 rounded-lg bg-apple-blue px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Create Your First Listing
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => (
            <div key={listing.id} className="flex flex-col gap-2">
              <ListingCard listing={listing} />
              <div className="flex gap-2">
                <Link
                  href={`/dashboard/listings/${listing.id}/edit`}
                  className="flex-1 rounded-lg border border-gray-200 py-1.5 text-center text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(listing.id)}
                  disabled={deleting === listing.id}
                  className="flex-1 rounded-lg border border-red-200 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting === listing.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
