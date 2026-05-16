"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth/useAuth";
import { getListings, getMyListings, getListing } from "@/lib/api/listings";
import { getConversations, getUnreadCount } from "@/lib/api/inbox";
import { getDashboardAnalytics } from "@/lib/api/analytics";
import { getAdminStats } from "@/lib/api/admin";
import type { AdminStats } from "@/lib/api/admin";
import { getSavedIds } from "@/lib/mock/saved";
import { EngagementChart, CategoryChart } from "@/components/dashboard/AnalyticsChart";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import type { Listing } from "@/types/listing";
import type { Conversation } from "@/lib/api/inbox";
import type { DashboardAnalytics } from "@/lib/api/analytics";

interface ConversationPreview {
  id: number;
  name: string;
  initial: string;
  preview: string;
  time: string;
  unread: number;
  listingTitle: string;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;

  const days = Math.floor(hrs / 24);
  return days === 1 ? "Yesterday" : `${days}d`;
}

function toPreview(conv: Conversation, myId: number): ConversationPreview {
  const other = conv.other_participant;
  const name = other?.username ?? "Unknown";

  return {
    id: conv.id,
    name,
    initial: (name[0] ?? "?").toUpperCase(),
    preview: conv.last_message?.content ?? "",
    time: formatRelativeTime(conv.updated_at),
    unread: conv.unread_count,
    listingTitle: conv.listing?.title ?? "",
  };
}

function SectionHeader({
  eyebrow,
  title,
  href,
  linkLabel,
}: {
  eyebrow: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <div>
        <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-apple-blue">
          {eyebrow}
        </p>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      </div>

      {href && linkLabel && (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-apple-blue hover:text-apple-blue"
        >
          {linkLabel}
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
            />
          </svg>
        </Link>
      )}
    </div>
  );
}

function CompactListingCard({ listing }: { listing: Listing }) {
  const image = listing.primary_image ?? listing.images?.[0]?.image;

  return (
    <Link
      href={`/dashboard/listings/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {image && (
          <Image
            src={image}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover transition-transform duration-150 group-hover:scale-105"
          />
        )}
      </div>

      <div className="p-3">
        <p className="truncate text-xs text-gray-400">{listing.location}</p>
        <p className="mt-0.5 line-clamp-1 text-sm font-semibold text-gray-900">
          {listing.title}
        </p>
        <p className="mt-1 text-sm font-bold text-apple-blue">
          {listing.currency} {parseFloat(listing.price).toLocaleString()}
        </p>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return <div className="aspect-[4/3] animate-pulse rounded-2xl bg-gray-100" />;
}

function NewBuyerDashboard({
  firstName,
  suggested,
  loading,
}: {
  firstName: string;
  suggested: Listing[];
  loading: boolean;
}) {
  return (
    <div className="space-y-8 pb-10">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 px-5 py-5 text-white shadow-md sm:px-7 sm:py-6">
        <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-8 right-20 h-24 w-24 rounded-full bg-white/5" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
              Welcome to Sanganai
            </p>
            <h1 className="mt-0.5 text-xl font-bold sm:text-2xl">{firstName} 👋</h1>
            <p className="mt-1 hidden text-sm text-white/70 sm:block">
              Discover great deals, save favourites, message sellers.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/listings"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm transition-all duration-75 hover:bg-blue-50 active:scale-[0.97]"
            >
              Browse Marketplace
            </Link>
            <Link
              href="/dashboard/saved"
              className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-all duration-75 hover:bg-white/20 active:scale-[0.97]"
            >
              Saved Items
            </Link>
          </div>
        </div>
      </div>

      <section>
        <SectionHeader
          eyebrow="Fresh on the market"
          title="Latest Listings"
          href="/listings"
          linkLabel="View all"
        />
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : suggested.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {suggested.map((listing) => (
              <CompactListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="bag"
            title="No listings yet"
            description="Be the first to know when items go live."
            action={{ label: "Browse Marketplace", href: "/listings" }}
            size="sm"
          />
        )}
      </section>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-apple-blue">Want to sell?</p>
        <h2 className="mt-1 text-xl font-bold text-gray-900">Upgrade to Seller</h2>
        <p className="mt-2 text-sm text-gray-500">
          List your own items and reach thousands of buyers across Zimbabwe.
        </p>
        <Link
          href="/dashboard/upgrade"
          className="mt-4 inline-block rounded-xl bg-apple-blue px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Become a Seller →
        </Link>
      </div>
    </div>
  );
}

function NewUserDashboard({ firstName }: { firstName: string }) {
  return (
    <div className="space-y-8 pb-10">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 px-5 py-5 text-white shadow-md sm:px-7 sm:py-6">
        <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-8 right-20 h-24 w-24 rounded-full bg-white/5" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
              Welcome to Sanganai
            </p>
            <h1 className="mt-0.5 text-xl font-bold sm:text-2xl">{firstName} 👋</h1>
            <p className="mt-1 hidden text-sm text-white/70 sm:block">
              Post your first listing and start getting buyers.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/listings/create"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm transition-all duration-75 hover:bg-blue-50 active:scale-[0.97]"
            >
              + Post First Listing
            </Link>
            <Link
              href="/listings"
              className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-all duration-75 hover:bg-white/20 active:scale-[0.97]"
            >
              Browse
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-apple-blue">
          Getting Started
        </p>

        <h2 className="mt-1 text-xl font-bold text-gray-900">
          Complete these 3 steps
        </h2>

        <div className="mt-5 space-y-3">
          {[
            "Post your first listing",
            "Add clear photos and a fair price",
            "Respond quickly when buyers message you",
          ].map((step, index) => (
            <div
              key={step}
              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-bold text-apple-blue shadow-sm">
                {index + 1}
              </span>
              <p className="text-sm font-medium text-gray-700">{step}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center">
        <p className="text-sm font-semibold text-gray-700">
          Nothing is happening yet because you haven’t posted anything.
        </p>

        <p className="mx-auto mt-1 max-w-sm text-xs text-gray-400">
          Your dashboard becomes useful after your first listing goes live.
          Start there.
        </p>

        <Link
          href="/dashboard/listings/create"
          className="mt-5 inline-block rounded-lg bg-apple-blue px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          + Post Listing
        </Link>
      </div>
    </div>
  );
}

function SellerMomentumCard({
  activeListings,
  totalViews,
  unreadMessages,
}: {
  activeListings: number | null;
  totalViews: number | null;
  unreadMessages: number | null;
}) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-apple-blue">
        Next Action
      </p>

      <h2 className="mt-1 text-lg font-bold text-gray-900">
        Keep your listings moving
      </h2>

      <p className="mt-2 text-sm text-gray-600">
        You have {activeListings ?? 0} active listing
        {(activeListings ?? 0) === 1 ? "" : "s"}, {totalViews ?? 0} total views,
        and {unreadMessages ?? 0} unread message
        {(unreadMessages ?? 0) === 1 ? "" : "s"}.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/dashboard/listings/create"
          className="rounded-lg bg-apple-blue px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          + Post Another Listing
        </Link>

        <Link
          href="/dashboard/listings"
          className="rounded-lg border border-apple-blue/20 bg-white px-4 py-2 text-sm font-semibold text-apple-blue"
        >
          Manage Listings
        </Link>
      </div>
    </div>
  );
}

function AdminDashboard({ firstName }: { firstName: string }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const statCards = [
    { label: "Total Users",    value: stats?.totalUsers    ?? null, color: "text-apple-blue",  href: "/dashboard/users" },
    { label: "Total Sellers",  value: stats?.totalSellers  ?? null, color: "text-emerald-600", href: "/dashboard/users" },
    { label: "Total Buyers",   value: stats?.totalBuyers   ?? null, color: "text-orange-500",  href: "/dashboard/users" },
    { label: "Total Listings", value: stats?.totalListings ?? null, color: "text-indigo-600",  href: "/dashboard/admin-listings" },
    { label: "Pending Review", value: stats?.pendingListings  ?? null, color: "text-amber-500",  href: "/dashboard/admin-listings" },
    { label: "Active",         value: stats?.activeListings   ?? null, color: "text-green-600",  href: "/dashboard/admin-listings" },
    { label: "Rejected",       value: stats?.rejectedListings ?? null, color: "text-red-500",    href: "/dashboard/admin-listings" },
    { label: "Categories",     value: stats?.totalCategories  ?? null, color: "text-purple-600", href: "/dashboard/categories" },
  ];

  const quickLinks = [
    { label: "Listing Review",      href: "/dashboard/admin-listings",  desc: "Approve or reject pending listings" },
    { label: "Users",               href: "/dashboard/users",           desc: "Manage accounts and roles" },
    { label: "Seller Applications", href: "/dashboard/upgrade-requests",desc: "Review upgrade requests" },
    { label: "Categories",          href: "/dashboard/categories",      desc: "Add and edit categories" },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 px-5 py-5 text-white shadow-md sm:px-7 sm:py-6">
        <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-8 right-20 h-24 w-24 rounded-full bg-white/5" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Admin Panel</p>
            <h1 className="mt-0.5 text-xl font-bold sm:text-2xl">{firstName} 👋</h1>
            <p className="mt-1 hidden text-sm text-white/70 sm:block">
              Review listings, moderate users, manage the platform.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/admin" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm transition-all duration-75 hover:bg-blue-50 active:scale-[0.97]">
              Detailed Overview
            </Link>
            <Link href="/listings" className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-all duration-75 hover:bg-white/20 active:scale-[0.97]">
              Marketplace
            </Link>
          </div>
        </div>
      </div>

      {/* Real stats */}
      {(stats?.pendingListings ?? 0) > 0 && !statsLoading && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3">
          <p className="text-sm font-semibold text-amber-800">
            {stats!.pendingListings} listing{stats!.pendingListings !== 1 ? "s" : ""} waiting for review
          </p>
          <Link href="/dashboard/admin-listings" className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors">
            Review now
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map(({ label, value, color, href }) => (
          <Link key={label} href={href} className="group rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
            {statsLoading ? (
              <div className="mt-2 h-7 w-12 animate-pulse rounded-lg bg-gray-100" />
            ) : (
              <p className={cn("mt-1.5 text-2xl font-bold tabular-nums", color)}>
                {value !== null ? value.toLocaleString() : "—"}
              </p>
            )}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex flex-col gap-1.5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-sm font-bold text-apple-blue">{action.label}</p>
            <p className="text-xs text-gray-500 leading-snug">{action.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const [activeListings, setActiveListings] = useState<number | null>(null);
  const [totalViews, setTotalViews] = useState<number | null>(null);
  const [unreadMessages, setUnreadMessages] = useState<number | null>(null);
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [convsLoaded, setConvsLoaded] = useState(false);
  const [convsError, setConvsError] = useState(false);
  const [suggested, setSuggested] = useState<Listing[]>([]);
  const [savedListings, setSavedListings] = useState<Listing[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const savedIds = getSavedIds();

    Promise.allSettled([
      getMyListings({ page_size: 1 }),
      getUnreadCount(),
      getConversations(1),
      getListings({ page_size: 8, ordering: "-created_at" }),
      getDashboardAnalytics(),
      ...savedIds.map((id) => getListing(parseInt(id, 10))),
    ]).then((results) => {
      const [
        myListings,
        unread,
        convs,
        suggestedListings,
        analyticsRes,
        ...savedResults
      ] = results;

      if (myListings.status === "fulfilled") {
        setActiveListings(myListings.value.count);
      }

      if (unread.status === "fulfilled") {
        setUnreadMessages(unread.value);
      }

      if (convs.status === "fulfilled") {
        setConversations(
          convs.value.results.slice(0, 4).map((c) => toPreview(c, user.id)),
        );
        setConvsLoaded(true);
      } else {
        setConvsError(true);
      }

      if (suggestedListings.status === "fulfilled") {
        setSuggested(suggestedListings.value.results);
      }

      if (analyticsRes.status === "fulfilled") {
        setAnalytics(analyticsRes.value);
        setTotalViews(analyticsRes.value.total_views);
      }

      const saved = savedResults
        .filter((r): r is PromiseFulfilledResult<Listing> => r.status === "fulfilled")
        .map((r) => r.value);

      setSavedListings(saved);
      setLoading(false);
    });
  }, [user]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const firstName = user?.first_name || user?.username || "there";

  const isAdminUser  = user?.role === "ADMIN" || user?.role === "MODERATOR";
  const isBuyerRole  = user?.role === "BUYER";
  const isSellerRole = user?.role === "SELLER";

  // While API data is still loading, show a role-appropriate skeleton to
  // prevent the default seller-dashboard layout from flashing on buyer accounts.
  if (loading) {
    return (
      <div className="space-y-6 pb-10 animate-pulse">
        <div className="h-24 rounded-2xl bg-gray-100" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-gray-100" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] rounded-2xl bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  // Show buyer onboarding when conversations loaded and are empty
  const isNewBuyer = isBuyerRole && convsLoaded && conversations.length === 0;

  // Show seller onboarding only for sellers with no activity yet
  const isNewSeller =
    isSellerRole &&
    activeListings === 0 &&
    convsLoaded && conversations.length === 0 &&
    (totalViews === 0 || totalViews === null);

  const shouldShowAnalytics = isSellerRole && (activeListings ?? 0) > 0;

  if (isNewBuyer) {
    return <NewBuyerDashboard firstName={firstName} suggested={suggested} loading={false} />;
  }

  if (isNewSeller) {
    return <NewUserDashboard firstName={firstName} />;
  }

  if (isAdminUser) {
    return <AdminDashboard firstName={firstName} />;
  }

  return (
    <div className="space-y-10 pb-10">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 px-5 py-5 text-white shadow-md sm:px-7 sm:py-6">
        <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-8 right-20 h-24 w-24 rounded-full bg-white/5" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
              {greeting}
            </p>
            <h1 className="mt-0.5 text-xl font-bold sm:text-2xl">{firstName} 👋</h1>
            <p className="mt-1 hidden text-sm text-white/70 sm:block">
              Here’s what’s happening with your account today.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isSellerRole && (
              <Link
                href="/dashboard/listings/create"
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm transition-all duration-75 hover:bg-blue-50 active:scale-[0.97]"
              >
                + Post a Listing
              </Link>
            )}
            <Link
              href="/listings"
              className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-all duration-75 hover:bg-white/20 active:scale-[0.97]"
            >
              Browse
            </Link>
            {isBuyerRole && (
              <Link
                href="/dashboard/upgrade"
                className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-all duration-75 hover:bg-white/20 active:scale-[0.97]"
              >
                Become a Seller
              </Link>
            )}
          </div>
        </div>
      </div>

      {isSellerRole && (
        <SellerMomentumCard
          activeListings={activeListings}
          totalViews={totalViews}
          unreadMessages={unreadMessages}
        />
      )}

      <div className={cn("grid gap-4", isSellerRole ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2")}>
        {(isSellerRole
          ? [
              {
                label: "Unread Messages",
                value: unreadMessages !== null ? String(unreadMessages) : "—",
                color: "text-amber-600",
              },
              {
                label: "Saved Items",
                value: loading ? "—" : String(savedListings.length),
                color: "text-purple-600",
              },
            ]
          : [
              {
                label: "Active Listings",
                value: activeListings !== null ? String(activeListings) : "—",
                color: "text-apple-blue",
              },
              {
                label: "Total Views",
                value: totalViews !== null ? totalViews.toLocaleString() : "—",
                color: "text-blue-600",
              },
              {
                label: "Unread Messages",
                value: unreadMessages !== null ? String(unreadMessages) : "—",
                color: "text-amber-600",
              },
              {
                label: "Saved Items",
                value: loading ? "—" : String(savedListings.length),
                color: "text-purple-600",
              },
            ]
        ).map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {label}
            </p>
            <p className={cn("mt-2 text-3xl font-bold", color)}>{value}</p>
          </div>
        ))}
      </div>

      {shouldShowAnalytics && (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <EngagementChart
            weekly={analytics?.weekly ?? []}
            monthly={analytics?.monthly ?? []}
          />
          <CategoryChart data={analytics?.by_category ?? []} />
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-10">
          <section>
            <SectionHeader
              eyebrow="Bookmarked"
              title="Saved Listings"
              href="/dashboard/saved"
              linkLabel="View all"
            />

            {loading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : savedListings.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {savedListings.map((listing) => (
                  <CompactListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon="heart"
                title="No saved items yet"
                description="Explore listings and save what interests you."
                action={{ label: "Browse Listings", href: "/listings" }}
                size="sm"
              />
            )}
          </section>

          <section>
            <SectionHeader
              eyebrow="Picked for you"
              title="Suggested Listings"
              href="/listings"
              linkLabel="View all"
            />

            {loading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : suggested.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {suggested.map((listing) => (
                  <CompactListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-12 text-center">
                <p className="text-sm font-semibold text-gray-600">
                  No listings available yet.
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Your marketplace needs supply. Post something first.
                </p>

                <Link
                  href="/dashboard/listings/create"
                  className="mt-4 rounded-lg bg-apple-blue px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  + Post Listing
                </Link>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-8">
          <section>
            <SectionHeader
              eyebrow="Messages"
              title={`Inbox${unreadMessages ? ` (${unreadMessages})` : ""}`}
              href="/dashboard/messages"
              linkLabel="Open inbox"
            />

            {loading ? (
              <div className="divide-y divide-gray-50 rounded-2xl border border-gray-100 bg-white shadow-sm">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3.5">
                    <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-gray-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
                      <div className="h-3 w-40 animate-pulse rounded bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : convsError ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50 py-8 text-center px-4">
                <p className="text-sm text-red-600">Could not load messages.</p>
                <Link href="/dashboard/messages" className="mt-3 text-xs font-semibold text-apple-blue hover:underline">
                  Open inbox →
                </Link>
              </div>
            ) : conversations.length > 0 ? (
              <div className="divide-y divide-gray-50 rounded-2xl border border-gray-100 bg-white shadow-sm">
                {conversations.map((conversation) => (
                  <Link
                    key={conversation.id}
                    href="/dashboard/messages"
                    className={cn(
                      "flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50",
                      conversation.unread > 0 && "bg-blue-50/40",
                    )}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-apple-blue/10 text-sm font-bold text-apple-blue">
                      {conversation.initial}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={cn(
                            "truncate text-sm",
                            conversation.unread > 0
                              ? "font-semibold text-gray-900"
                              : "font-medium text-gray-700",
                          )}
                        >
                          {conversation.name}
                        </p>

                        <span className="shrink-0 text-xs text-gray-400">
                          {conversation.time}
                        </span>
                      </div>

                      {conversation.listingTitle && (
                        <p className="truncate text-xs text-gray-400">
                          {conversation.listingTitle}
                        </p>
                      )}

                      <p
                        className={cn(
                          "mt-0.5 truncate text-sm",
                          conversation.unread > 0
                            ? "text-gray-800"
                            : "text-gray-500",
                        )}
                      >
                        {conversation.preview}
                      </p>
                    </div>

                    {conversation.unread > 0 && (
                      <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-apple-blue text-[11px] font-bold text-white">
                        {conversation.unread}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="chat"
                title="No conversations yet"
                description="Buyers message you after your listings get views. Improve your photos and price to attract more."
                action={{ label: "Improve Listings", href: "/dashboard/listings" }}
                size="sm"
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}