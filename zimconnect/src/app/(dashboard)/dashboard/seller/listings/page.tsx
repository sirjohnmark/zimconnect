"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { useRequireAuth } from "@/lib/auth/requireAuth";
import { getSellerListings, type SellerDashboardListingPreview } from "@/lib/api/sellers";
import { ApiError } from "@/lib/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusTab = "ALL" | "DRAFT" | "ACTIVE" | "SOLD" | "REJECTED";

const TABS: { label: string; value: StatusTab }[] = [
  { label: "All",      value: "ALL"      },
  { label: "Active",   value: "ACTIVE"   },
  { label: "Draft",    value: "DRAFT"    },
  { label: "Sold",     value: "SOLD"     },
  { label: "Rejected", value: "REJECTED" },
];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:   "bg-green-100 text-green-700",
  DRAFT:    "bg-gray-100 text-gray-600",
  SOLD:     "bg-blue-100 text-blue-700",
  REJECTED: "bg-red-100 text-red-700",
  PENDING:  "bg-amber-100 text-amber-700",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ListingCard({ listing }: { listing: SellerDashboardListingPreview }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
        {listing.primary_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.primary_image.image}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-gray-900">{listing.title}</p>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
              STATUS_COLORS[listing.status] ?? "bg-gray-100 text-gray-600",
            )}
          >
            {listing.status}
          </span>
        </div>
        <p className="mt-0.5 text-sm font-bold text-apple-blue">
          {listing.currency} {parseFloat(listing.price).toLocaleString()}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">
          {new Date(listing.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

function ListingsSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-2xl" />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SellerListingsPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<StatusTab>("ALL");
  const [listings, setListings] = useState<SellerDashboardListingPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    (status: StatusTab) => {
      setLoading(true);
      setError(null);
      getSellerListings(status === "ALL" ? undefined : status)
        .then(setListings)
        .catch((err: unknown) => {
          if (err instanceof ApiError && err.status === 403) {
            router.replace("/dashboard/buyer");
          } else {
            setError(err instanceof Error ? err.message : "Failed to load listings.");
          }
        })
        .finally(() => setLoading(false));
    },
    [router],
  );

  useEffect(() => {
    if (authLoading || !user) return;
    if (user.role !== "SELLER" && user.role !== "ADMIN" && user.role !== "MODERATOR") {
      router.replace("/dashboard/buyer");
      return;
    }
    load(tab);
  }, [authLoading, user, tab, load, router]);

  const isSeller = user?.role === "SELLER" || user?.role === "ADMIN" || user?.role === "MODERATOR";

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/seller"
            className="mb-1 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
              <path fillRule="evenodd" d="M9.78 4.22a.75.75 0 0 1 0 1.06L7.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L5.47 8.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
            </svg>
            Seller Dashboard
          </Link>
          <h1 className="text-xl font-bold text-gray-900">My Listings</h1>
        </div>

        {isSeller && (
          <Link
            href="/dashboard/listings/create"
            className="rounded-xl bg-apple-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98]"
          >
            + New Listing
          </Link>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-100 bg-gray-50 p-1">
        {TABS.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              "shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              tab === value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <ListingsSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-14 text-center">
          <p className="text-sm font-semibold text-gray-700">Something went wrong</p>
          <p className="mt-1 text-xs text-gray-400">{error}</p>
          <button
            type="button"
            onClick={() => load(tab)}
            className="mt-4 rounded-lg bg-apple-blue px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Retry
          </button>
        </div>
      ) : listings.length > 0 ? (
        <div className="space-y-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-16 text-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="mb-3 h-10 w-10 text-gray-300"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
          <p className="text-sm font-semibold text-gray-600">
            {tab === "ALL" ? "No listings yet" : `No ${tab.toLowerCase()} listings`}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {tab === "ALL"
              ? "Create your first listing to start selling."
              : `You have no listings with status "${tab}".`}
          </p>
          {tab === "ALL" && isSeller && (
            <Link
              href="/dashboard/listings/create"
              className="mt-4 rounded-lg bg-apple-blue px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              + Post Listing
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
