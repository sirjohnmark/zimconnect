"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { useRequireAuth } from "@/lib/auth/requireAuth";
import { getSellerDashboard, type SellerDashboard, type SellerDashboardListingPreview } from "@/lib/api/sellers";
import { ApiError } from "@/lib/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <p className={cn("mt-2 text-3xl font-bold", color)}>{value}</p>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:   "bg-green-100 text-green-700",
  DRAFT:    "bg-gray-100 text-gray-600",
  SOLD:     "bg-blue-100 text-blue-700",
  REJECTED: "bg-red-100 text-red-700",
  PENDING:  "bg-amber-100 text-amber-700",
};

function ListingRow({ listing }: { listing: SellerDashboardListingPreview }) {
  return (
    <Link
      href={`/listings/${listing.slug || listing.id}`}
      className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-gray-50"
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100">
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
        <p className="truncate text-sm font-medium text-gray-900">{listing.title}</p>
        <p className="text-xs text-gray-400">
          {listing.currency} {parseFloat(listing.price).toLocaleString()}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
          STATUS_COLORS[listing.status] ?? "bg-gray-100 text-gray-600",
        )}
      >
        {listing.status}
      </span>
    </Link>
  );
}

function SellerDashboardSkeleton() {
  return (
    <div className="space-y-8 pb-10">
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SellerDashboardPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<SellerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getSellerDashboard()
      .then(setData)
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 403) {
          router.replace("/dashboard/buyer");
        } else {
          setError(err instanceof Error ? err.message : "Failed to load seller dashboard.");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (authLoading || !user) return;
    if (user.role !== "SELLER" && user.role !== "ADMIN" && user.role !== "MODERATOR") {
      router.replace("/dashboard/buyer");
      return;
    }
    load();
  }, [authLoading, user, load, router]);

  if (authLoading || loading) return <SellerDashboardSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-20 text-center">
        <p className="text-sm font-semibold text-gray-700">Something went wrong</p>
        <p className="mt-1 text-xs text-gray-400">{error}</p>
        <button
          type="button"
          onClick={load}
          className="mt-4 rounded-lg bg-apple-blue px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const firstName = user?.first_name || user?.username || "there";
  const { seller_profile, listing_stats, recent_listings } = data;
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome banner */}
      <div className="rounded-2xl bg-apple-blue px-5 py-7 text-white shadow-md sm:px-10 sm:py-10">
        <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-white/50">
          {greeting}, seller
        </p>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{firstName} 👋</h1>
        <p className="mt-1 text-sm text-white/70">{seller_profile.shop_name}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard/listings/create"
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-apple-blue shadow transition-all duration-75 hover:bg-light-gray active:scale-[0.97]"
          >
            + Post a Listing
          </Link>
          <Link
            href="/dashboard/seller/listings"
            className="rounded-lg border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-75 hover:bg-white/20 active:scale-[0.97]"
          >
            Manage Listings
          </Link>
          <Link
            href="/dashboard/buyer"
            className="rounded-lg border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/80 transition-all duration-75 hover:bg-white/10 active:scale-[0.97]"
          >
            Buyer View
          </Link>
        </div>
      </div>

      {/* Seller profile summary */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-apple-blue">
              Shop Profile
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-gray-900">{seller_profile.shop_name}</h2>
            {seller_profile.shop_description && (
              <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                {seller_profile.shop_description}
              </p>
            )}
          </div>
          <Link
            href="/dashboard/seller-profile"
            className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Edit Shop
          </Link>
        </div>
        {seller_profile.response_time_hours != null && (
          <p className="mt-3 text-xs text-gray-400">
            Typical response time: {seller_profile.response_time_hours}h
          </p>
        )}
      </div>

      {/* Listing stats */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Listing Stats
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatPill label="Total" value={listing_stats.total} color="text-gray-900" />
          <StatPill label="Active" value={listing_stats.active} color="text-green-600" />
          <StatPill label="Draft" value={listing_stats.draft} color="text-gray-500" />
          <StatPill label="Sold" value={listing_stats.sold} color="text-apple-blue" />
        </div>
      </div>

      {/* Recent listings */}
      <div>
        <div className="mb-3 flex items-end justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Recent Listings
          </p>
          <Link
            href="/dashboard/seller/listings"
            className="text-sm font-semibold text-apple-blue hover:underline"
          >
            View all
          </Link>
        </div>

        {recent_listings.length > 0 ? (
          <div className="divide-y divide-gray-50 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {recent_listings.map((listing) => (
              <ListingRow key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-14 text-center">
            <p className="text-sm font-semibold text-gray-600">No listings yet</p>
            <p className="mt-1 text-xs text-gray-400">
              Create your first listing to start selling.
            </p>
            <Link
              href="/dashboard/listings/create"
              className="mt-4 rounded-lg bg-apple-blue px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              + Post Listing
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
