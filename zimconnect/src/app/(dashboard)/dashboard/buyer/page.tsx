"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { useRequireAuth } from "@/lib/auth/requireAuth";
import { getBuyerDashboard, type BuyerDashboard, type SellerApplicationSummary } from "@/lib/api/buyers";
import { ApiError } from "@/lib/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  href,
  color,
}: {
  label: string;
  value: number;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <p className={cn("mt-2 text-3xl font-bold", color)}>{value}</p>
    </Link>
  );
}

function SellerCTA() {
  return (
    <div className="rounded-2xl border border-dashed border-apple-blue/30 bg-blue-50/50 p-6">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-apple-blue/10 text-apple-blue">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
            <path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 4.636v8.614Z" />
            <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
          </svg>
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">Start selling on Sanganai</h3>
          <p className="mt-1 text-sm text-gray-500">
            Apply to become a seller and reach buyers across Zimbabwe.
          </p>
          <Link
            href="/dashboard/upgrade"
            className="mt-3 inline-block rounded-lg bg-apple-blue px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Become a Seller
          </Link>
        </div>
      </div>
    </div>
  );
}

function ApplicationPending({ app }: { app: SellerApplicationSummary }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
          </svg>
        </span>
        <div>
          <p className="font-semibold text-gray-900">Seller application under review</p>
          <p className="mt-1 text-sm text-gray-600">
            Your application for <strong>{app.business_name}</strong> is being reviewed. We&apos;ll
            notify you once a decision is made.
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Submitted {new Date(app.requested_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}

function ApplicationRejected({ app }: { app: SellerApplicationSummary }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" />
            </svg>
          </span>
          <div>
            <p className="font-semibold text-gray-900">Application not approved</p>
            {app.rejection_reason && (
              <p className="mt-1 text-sm text-gray-600">Reason: {app.rejection_reason}</p>
            )}
            <p className="mt-1 text-xs text-gray-400">
              You can submit a new application to address the feedback.
            </p>
          </div>
        </div>
      </div>
      <Link
        href="/dashboard/upgrade"
        className="inline-block rounded-lg bg-apple-blue px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Reapply to Become a Seller
      </Link>
    </div>
  );
}

function SellerModeBanner() {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-600">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-semibold text-gray-900">You&apos;re also a seller</p>
          <p className="text-xs text-gray-500">Switch to your seller dashboard to manage listings.</p>
        </div>
      </div>
      <Link
        href="/dashboard/seller"
        className="rounded-lg border border-green-300 bg-white px-3 py-1.5 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50"
      >
        Seller Dashboard
      </Link>
    </div>
  );
}

function BuyerDashboardSkeleton() {
  return (
    <div className="space-y-8 pb-10">
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <Skeleton className="h-28 w-full rounded-2xl" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BuyerDashboardPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<BuyerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getBuyerDashboard()
      .then(setData)
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 403) {
          router.replace("/dashboard");
        } else {
          setError(err instanceof Error ? err.message : "Failed to load dashboard.");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (authLoading || !user) return;
    load();
  }, [authLoading, user, load]);

  if (authLoading || loading) return <BuyerDashboardSkeleton />;

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
  const isSeller = user?.role === "SELLER";
  const app = data.seller_application;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome banner */}
      <div className="rounded-2xl bg-apple-blue px-5 py-7 text-white shadow-md sm:px-10 sm:py-10">
        <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-white/50">
          {greeting}
        </p>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{firstName} 👋</h1>
        <p className="mt-2 max-w-md text-sm text-white/70">
          Browse, save, and buy from Zimbabwe&apos;s best marketplace.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/listings"
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-apple-blue shadow transition-all duration-75 hover:bg-light-gray active:scale-[0.97]"
          >
            Browse Listings
          </Link>
          <Link
            href="/dashboard/messages"
            className="rounded-lg border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-75 hover:bg-white/20 active:scale-[0.97]"
          >
            My Messages
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Saved Items"
          value={data.saved_listings_count}
          href="/dashboard/saved"
          color="text-purple-600"
        />
        <StatCard
          label="Messages"
          value={data.conversations_count}
          href="/dashboard/messages"
          color="text-apple-blue"
        />
      </div>

      {/* Seller mode banner (if user is already a SELLER) */}
      {isSeller && <SellerModeBanner />}

      {/* Seller application section (for BUYER) */}
      {!isSeller && (
        <>
          {!app && data.can_apply_to_sell && <SellerCTA />}
          {app?.status === "PENDING" && <ApplicationPending app={app} />}
          {app?.status === "REJECTED" && <ApplicationRejected app={app} />}
          {app?.status === "APPROVED" && <SellerModeBanner />}
        </>
      )}

      {/* Quick links */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Quick Links
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: "Saved Listings", href: "/dashboard/saved" },
            { label: "My Orders", href: "/dashboard/orders" },
            { label: "Profile", href: "/dashboard/profile" },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-center rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-shadow hover:shadow-md"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
