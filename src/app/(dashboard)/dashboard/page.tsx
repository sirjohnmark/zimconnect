"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth/useAuth";
import { MOCK_LISTINGS } from "@/lib/mock/listings";
import { getSavedIds } from "@/lib/mock/saved";
import { EngagementChart, CategoryChart } from "@/components/dashboard/AnalyticsChart";
import { cn } from "@/lib/utils";
import type { Listing } from "@/types/listing";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  icon: "message" | "eye" | "star" | "bell";
  text: string;
  time: string;
  read: boolean;
}

interface Conversation {
  id: string;
  name: string;
  initial: string;
  preview: string;
  time: string;
  unread: number;
  listingTitle: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "n1", icon: "message", text: "Farai Ncube sent you a message about your Toyota listing.", time: "2 min ago", read: false },
  { id: "n2", icon: "eye",     text: "Your Samsung Galaxy listing was viewed 24 times today.", time: "1 hr ago",  read: false },
  { id: "n3", icon: "star",    text: "Someone saved your 2-Bedroom Apartment listing.",        time: "3 hrs ago", read: true },
  { id: "n4", icon: "bell",    text: "New listings in Electronics match your saved search.",   time: "Yesterday", read: true },
];

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "c1",
    name: "Farai Ncube",
    initial: "F",
    preview: "Is the price negotiable? I can come view it tomorrow.",
    time: "2 min",
    unread: 2,
    listingTitle: "Toyota Corolla 2019",
  },
  {
    id: "c2",
    name: "Chiedza Mpofu",
    initial: "C",
    preview: "Does it come with the original charger?",
    time: "1 hr",
    unread: 1,
    listingTitle: "Samsung Galaxy S24 Ultra",
  },
  {
    id: "c3",
    name: "Tinashe Dube",
    initial: "T",
    preview: "I'm interested. What's the earliest you can meet?",
    time: "Yesterday",
    unread: 0,
    listingTitle: "Dell XPS 15 Laptop",
  },
  {
    id: "c4",
    name: "Rumbidzai Choto",
    initial: "R",
    preview: "Thank you, I'll let you know by end of day.",
    time: "2 days",
    unread: 0,
    listingTitle: "2-Bedroom Apartment",
  },
];

// ─── Notification icon ────────────────────────────────────────────────────────

function NotifIcon({ type }: { type: Notification["icon"] }) {
  const icons = {
    message: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M3.43 2.524A41.29 41.29 0 0 1 10 2c2.236 0 4.43.18 6.57.524 1.437.231 2.43 1.49 2.43 2.902v5.148c0 1.413-.993 2.67-2.43 2.902a41.202 41.202 0 0 1-5.183.501.78.78 0 0 0-.528.224l-3.202 3.203A.75.75 0 0 1 6.375 17v-2.136a41.415 41.415 0 0 1-2.945-.34C1.993 14.271 1 13.012 1 11.6V5.426c0-1.413.993-2.67 2.43-2.902Z" clipRule="evenodd" />
      </svg>
    ),
    eye: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
        <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41Z" clipRule="evenodd" />
      </svg>
    ),
    star: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" />
      </svg>
    ),
    bell: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M4 8a6 6 0 1 1 11.999.001L16 8v4.586l1.707 1.707A1 1 0 0 1 17 16H3a1 1 0 0 1-.707-1.707L4 12.586V8Zm6 10a2 2 0 0 1-2-2h4a2 2 0 0 1-2 2Z" clipRule="evenodd" />
      </svg>
    ),
  };
  const colors = {
    message: "bg-blue-50 text-blue-500",
    eye:     "bg-purple-50 text-purple-500",
    star:    "bg-amber-50 text-amber-500",
    bell:    "bg-emerald-50 text-emerald-500",
  };
  return (
    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", colors[type])}>
      {icons[type]}
    </span>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ eyebrow, title, href, linkLabel }: { eyebrow: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-0.5">{eyebrow}</p>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      </div>
      {href && linkLabel && (
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors shrink-0">
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
  const image = listing.images[0]?.url;
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex flex-col rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div className="relative aspect-[4/3] w-full bg-gray-100 overflow-hidden">
        {image && (
          <Image
            src={image}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
      </div>
      <div className="p-3">
        <p className="text-xs text-gray-400 truncate">{listing.location}</p>
        <p className="mt-0.5 text-sm font-semibold text-gray-900 line-clamp-1">{listing.title}</p>
        <p className="mt-1 text-sm font-bold text-emerald-600">
          {listing.currency ?? "USD"} {listing.price.toLocaleString()}
        </p>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const [savedListings, setSavedListings] = useState<Listing[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const ids = getSavedIds();
    const found = MOCK_LISTINGS.filter((l) => ids.includes(l.id));
    setSavedListings(found);
  }, []);

  const suggested = MOCK_LISTINGS.slice(0, 8);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const unreadNotifs = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;
  const unreadMessages = MOCK_CONVERSATIONS.reduce((sum, c) => sum + c.unread, 0);

  return (
    <div className="space-y-10 pb-10">

      {/* ── Welcome banner ── */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 px-5 py-7 sm:px-10 sm:py-10 text-white shadow-md">
        <p className="text-sm font-semibold text-emerald-200 uppercase tracking-wider mb-1">{greeting}</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold">{firstName} 👋</h1>
        <p className="mt-2 text-emerald-100 text-sm max-w-md">
          Here&apos;s what&apos;s happening with your listings and messages today.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard/listings/create"
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 active:scale-[0.97] transition-all duration-75 shadow"
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
          { label: "Active Listings", value: "12",              color: "text-emerald-600" },
          { label: "Total Views",     value: "3,240",           color: "text-blue-600"   },
          { label: "Unread Messages", value: String(unreadMessages), color: "text-amber-600" },
          { label: "Saved Items",     value: mounted ? String(savedListings.length) : "—", color: "text-purple-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
            <p className={cn("mt-2 text-3xl font-bold", color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <EngagementChart />
        <CategoryChart />
      </div>

      {/* ── Main grid: left wide + right narrow ── */}
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">

        {/* ── Left column ── */}
        <div className="space-y-10">

          {/* Saved Listings */}
          <section>
            <SectionHeader eyebrow="Bookmarked" title="Saved Listings" href="/dashboard/saved" linkLabel="View all" />
            {!mounted ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-gray-100" />
                ))}
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
                <Link href="/listings" className="mt-4 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">
                  Browse Listings
                </Link>
              </div>
            )}
          </section>

          {/* Suggested Listings */}
          <section>
            <SectionHeader eyebrow="Picked for you" title="Suggested Listings" href="/listings" linkLabel="View all" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {suggested.map((l) => <CompactListingCard key={l.id} listing={l} />)}
            </div>
          </section>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-8">

          {/* Notifications */}
          <section>
            <SectionHeader
              eyebrow="Updates"
              title={`Notifications ${unreadNotifs > 0 ? `(${unreadNotifs})` : ""}`}
              href="/dashboard/notifications"
              linkLabel="See all"
            />
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
              {MOCK_NOTIFICATIONS.map((n) => (
                <div key={n.id} className={cn("flex items-start gap-3 px-4 py-3.5", !n.read && "bg-emerald-50/40")}>
                  <NotifIcon type={n.icon} />
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm leading-snug", n.read ? "text-gray-600" : "text-gray-900 font-medium")}>{n.text}</p>
                    <p className="mt-1 text-xs text-gray-400">{n.time}</p>
                  </div>
                  {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />}
                </div>
              ))}
            </div>
          </section>

          {/* Inbox */}
          <section>
            <SectionHeader
              eyebrow="Messages"
              title={`Inbox ${unreadMessages > 0 ? `(${unreadMessages})` : ""}`}
              href="/dashboard/messages"
              linkLabel="Open inbox"
            />
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
              {MOCK_CONVERSATIONS.map((c) => (
                <Link
                  key={c.id}
                  href="/dashboard/messages"
                  className={cn("flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors", c.unread > 0 && "bg-blue-50/40")}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                    {c.initial}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("text-sm truncate", c.unread > 0 ? "font-semibold text-gray-900" : "font-medium text-gray-700")}>{c.name}</p>
                      <span className="text-xs text-gray-400 shrink-0">{c.time}</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{c.listingTitle}</p>
                    <p className={cn("text-sm truncate mt-0.5", c.unread > 0 ? "text-gray-800" : "text-gray-500")}>{c.preview}</p>
                  </div>
                  {c.unread > 0 && (
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-white">
                      {c.unread}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
