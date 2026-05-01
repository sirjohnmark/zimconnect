"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";
import { Loader } from "@/components/ui/Loader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { getMyListings, deleteListing } from "@/lib/api/listings";
import type { Listing } from "@/types/listing";

export default function DashboardListingsPage() {
  const router = useRouter();
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

      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchListings} />
      ) : listings.length === 0 ? (
        <EmptyState
          title="No listings yet"
          description="Post your first listing and start selling today."
          actionLabel="Create Listing"
          onAction={() => router.push("/dashboard/listings/create")}
        />
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
