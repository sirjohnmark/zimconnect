"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth/useAuth";
import { getListings, getMyListings, getListing } from "@/lib/api/listings";
import { getConversations, getUnreadCount } from "@/lib/api/inbox";
import { getDashboardAnalytics } from "@/lib/api/analytics";
import { getSavedIds } from "@/lib/mock/saved";
import { EngagementChart, CategoryChart } from "@/components/dashboard/AnalyticsChart";
import { cn } from "@/lib/utils";
import type { Listing } from "@/types/listing";
import type { Conversation } from "@/lib/api/inbox";
import type { DashboardAnalytics } from "@/lib/api/analytics";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConversationPreview {
  id: number;
  name: string;
  initial: string;
  preview: string;
  time: string;
  unread: number;
  listingTitle: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "Yesterday" : `${days}d`;
}

function toPreview(conv: Conversation, myId: number): ConversationPreview {
  const other = conv.participants.find((p) => p.id !== myId) ?? conv.participants[0];
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

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ eyebrow, title, href, linkLabel }: {
  eyebrow: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-apple-blue mb-0.5">{eyebrow}</p>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm font-semibold text-apple-blue hover:text-apple-blue transition-colors shrink-0"
        >
          {linkLabel}
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      )}
    </div>
  );
}

// ─── Compact listing card ─────────────────────────────────────────────────────

function CompactListingCard({ listing }: { listing: Listing }) {
  const image = listing.primary_image ?? listing.images[0]?.image;
  return (
    <Link
      href={`/listings/${listing.slug ?? listing.id}`}
      className="group flex flex-col rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div className="relative aspect-[4/3] w-full bg-gray-100 overflow-hidden">
        {image && (
          <Image
            src={image}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-150"
          />
        )}
      </div>
      <div className="p-3">
        <p className="text-xs text-gray-400 truncate">{listing.location}</p>
        <p className="mt-0.5 text-sm font-semibold text-gray-900 line-clamp-1">{listing.title}</p>
        <p className="mt-1 text-sm font-bold text-apple-blue">
          {listing.currency} {parseFloat(listing.price).toLocaleString()}
        </p>
      </div>
    </Link>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return <div className="aspect-[4/3] animate-pulse rounded-2xl bg-gray-100" />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();

  const [activeListings, setActiveListings] = useState<number | null>(null);
  const [totalViews, setTotalViews]         = useState<number | null>(null);
  const [unreadMessages, setUnreadMessages] = useState<number | null>(null);
  const [conversations, setConversations]   = useState<ConversationPreview[]>([]);
  const [suggested, setSuggested]           = useState<Listing[]>([]);
  const [savedListings, setSavedListings]   = useState<Listing[]>([]);
  const [analytics, setAnalytics]           = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    if (!user) return;

    // Saved IDs come from localStorage (no API yet for bookmarks)
    const savedIds = getSavedIds();

    Promise.allSettled([
      getMyListings({ page_size: 1 }),
      getUnreadCount(),
      getConversations(1),
      getListings({ page_size: 8, ordering: "-created_at" }),
      getDashboardAnalytics(),
      ...savedIds.map((id) => getListing(parseInt(id, 10))),
    ]).then((results) => {
      const [myListings, unread, convs, suggested, analyticsRes, ...savedResults] = results;

      if (myListings.status === "fulfilled")  setActiveListings(myListings.value.count);
      if (unread.status    === "fulfilled")   setUnreadMessages(unread.value);
      if (convs.status     === "fulfilled") {
        setConversations(convs.value.results.slice(0, 4).map((c) => toPreview(c, user.id)));
      }
      if (suggested.status === "fulfilled")   setSuggested(suggested.value.results);
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
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.first_name || user?.username || "there";

  return (
    <div className="space-y-10 pb-10">

      {/* ── Welcome banner ── */}
      <div className="rounded-2xl bg-apple-blue px-5 py-7 sm:px-10 sm:py-10 text-white shadow-md">
        <p className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-1">{greeting}</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold">{firstName} 👋</h1>
        <p className="mt-2 text-white/70 text-sm max-w-md">
          Here&apos;s what&apos;s happening with your listings and messages today.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard/listings/create"
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-apple-blue hover:bg-light-gray active:scale-[0.97] transition-all duration-75 shadow"
          >
            + Post a Listing
          </Link>
          <Link
            href="/listings"
            className="rounded-lg border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20 active:scale-[0.97] transition-all duration-75"
          >
            Browse Marketplace
          </Link>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Active Listings", value: activeListings !== null ? String(activeListings) : "—", color: "text-apple-blue"  },
          { label: "Total Views",     value: totalViews    !== null ? totalViews.toLocaleString() : "—", color: "text-blue-600" },
          { label: "Unread Messages", value: unreadMessages !== null ? String(unreadMessages) : "—",   color: "text-amber-600" },
          { label: "Saved Items",     value: loading ? "—" : String(savedListings.length),              color: "text-purple-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
            <p className={cn("mt-2 text-3xl font-bold", color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <EngagementChart
          weekly={analytics?.weekly ?? []}
          monthly={analytics?.monthly ?? []}
        />
        <CategoryChart data={analytics?.by_category ?? []} />
      </div>

      {/* ── Main grid: left wide + right narrow ── */}
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">

        {/* ── Left column ── */}
        <div className="space-y-10">

          {/* Saved Listings */}
          <section>
            <SectionHeader eyebrow="Bookmarked" title="Saved Listings" href="/dashboard/saved" linkLabel="View all" />
            {loading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : savedListings.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {savedListings.map((l) => <CompactListingCard key={l.id} listing={l} />)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-12 text-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-10 w-10 text-gray-300 mb-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                </svg>
                <p className="text-sm font-semibold text-gray-500">No saved listings yet</p>
                <p className="text-xs text-gray-400 mt-1">Browse the marketplace and save items you like.</p>
                <Link href="/listings" className="mt-4 rounded-lg bg-apple-blue px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
                  Browse Listings
                </Link>
              </div>
            )}
          </section>

          {/* Suggested Listings */}
          <section>
            <SectionHeader eyebrow="Picked for you" title="Suggested Listings" href="/listings" linkLabel="View all" />
            {loading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : suggested.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {suggested.map((l) => <CompactListingCard key={l.id} listing={l} />)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-12 text-center">
                <p className="text-sm font-semibold text-gray-500">No listings available yet.</p>
                <Link href="/listings" className="mt-4 rounded-lg bg-apple-blue px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
                  Browse Marketplace
                </Link>
              </div>
            )}
          </section>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-8">

          {/* Inbox */}
          <section>
            <SectionHeader
              eyebrow="Messages"
              title={`Inbox${unreadMessages ? ` (${unreadMessages})` : ""}`}
              href="/dashboard/messages"
              linkLabel="Open inbox"
            />
            {loading ? (
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
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
            ) : conversations.length > 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
                {conversations.map((c) => (
                  <Link
                    key={c.id}
                    href={`/dashboard/messages`}
                    className={cn("flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors", c.unread > 0 && "bg-blue-50/40")}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-apple-blue/10 text-sm font-bold text-apple-blue">
                      {c.initial}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn("text-sm truncate", c.unread > 0 ? "font-semibold text-gray-900" : "font-medium text-gray-700")}>{c.name}</p>
                        <span className="text-xs text-gray-400 shrink-0">{c.time}</span>
                      </div>
                      {c.listingTitle && <p className="text-xs text-gray-400 truncate">{c.listingTitle}</p>}
                      <p className={cn("text-sm truncate mt-0.5", c.unread > 0 ? "text-gray-800" : "text-gray-500")}>{c.preview}</p>
                    </div>
                    {c.unread > 0 && (
                      <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-apple-blue text-[11px] font-bold text-white">
                        {c.unread}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-10 text-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8 text-gray-300 mb-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                </svg>
                <p className="text-sm font-semibold text-gray-500">No messages yet</p>
                <p className="text-xs text-gray-400 mt-1">Buyers will contact you here.</p>
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
