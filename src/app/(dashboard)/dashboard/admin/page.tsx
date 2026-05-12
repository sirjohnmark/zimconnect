"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth/useAuth";
import { getAdminStats } from "@/lib/api/admin";
import { getAllListingsAdmin, approveListing } from "@/lib/api/listings";
import { getUsers, updateUserAdmin } from "@/lib/api/users";
import { ApiError, NetworkError } from "@/lib/api/client";
import type { AdminStats } from "@/lib/api/admin";
import type { Listing } from "@/types/listing";
import type { AdminUser } from "@/lib/api/users";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

// ─── Primary summary card ─────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon,
  color,
  bg,
  href,
  loading,
}: {
  label: string;
  value: number | null;
  icon: React.ReactNode;
  color: string;
  bg: string;
  href: string;
  loading: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", bg, color)}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
        {loading ? (
          <div className="mt-1.5 h-7 w-14 animate-pulse rounded-lg bg-gray-100" />
        ) : (
          <p className={cn("mt-0.5 text-2xl font-bold tabular-nums", color)}>
            {value !== null ? value.toLocaleString() : "—"}
          </p>
        )}
      </div>
    </Link>
  );
}

// ─── Secondary metric pill ────────────────────────────────────────────────────

function MetricPill({
  label,
  value,
  color,
  href,
  loading,
}: {
  label: string;
  value: number | null;
  color: string;
  href: string;
  loading: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md"
    >
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      {loading ? (
        <div className="h-5 w-8 animate-pulse rounded bg-gray-100" />
      ) : (
        <p className={cn("text-sm font-bold tabular-nums", color)}>
          {value !== null ? value.toLocaleString() : "—"}
        </p>
      )}
    </Link>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      <Link href={href} className="text-xs font-semibold text-apple-blue hover:underline">
        View all →
      </Link>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const UsersIcon = (
  <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
    <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
  </svg>
);

const ListingsIcon = (
  <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
    <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
  </svg>
);

const SellersIcon = (
  <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
    <path fillRule="evenodd" d="M6 5v1H4.667a1.75 1.75 0 0 0-1.743 1.598l-.826 9.14A1.75 1.75 0 0 0 3.84 18.75h12.32a1.75 1.75 0 0 0 1.742-2.012l-.825-9.14A1.75 1.75 0 0 0 15.333 7H14V5a4 4 0 0 0-8 0Zm1.5 1V5a2.5 2.5 0 0 1 5 0v1h-5Zm-3 4a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 4.5 10Zm11 0a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
  </svg>
);

const BuyersIcon = (
  <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
    <path d="M1 1.75A.75.75 0 0 1 1.75 1h1.628a1.75 1.75 0 0 1 1.734 1.51L5.18 3a65.25 65.25 0 0 1 13.36 1.412.75.75 0 0 1 .58.875 48.645 48.645 0 0 1-1.618 6.2.75.75 0 0 1-.712.513H6a2.503 2.503 0 0 0-2.292 1.5H17.25a.75.75 0 0 1 0 1.5H2.76a.75.75 0 0 1-.748-.807 4.002 4.002 0 0 1 2.716-3.486L3.626 2.716a.25.25 0 0 0-.248-.216H1.75A.75.75 0 0 1 1 1.75ZM6 17.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM15.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
  </svg>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminOverviewPage() {
  const { user, isLoading: authLoading } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "MODERATOR";

  const [stats,           setStats]          = useState<AdminStats | null>(null);
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);
  const [recentUsers,     setRecentUsers]    = useState<AdminUser[]>([]);
  const [loading,         setLoading]        = useState(true);
  const [busyId,          setBusyId]         = useState<number | null>(null);
  const [toast,           setToast]          = useState("");
  const [error,           setError]          = useState("");
  const [refreshedAt,     setRefreshedAt]    = useState<Date | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [statsData, pendingData, usersData] = await Promise.all([
        getAdminStats(),
        getAllListingsAdmin({ status: "PENDING", page_size: 5 }),
        getUsers({ page_size: 5 }),
      ]);
      setStats(statsData);
      setPendingListings(pendingData.results);
      setRecentUsers(usersData.results);
      setRefreshedAt(new Date());
    } catch (e: unknown) {
      setError(
        e instanceof ApiError && e.status === 403 ? "forbidden" :
        e instanceof NetworkError ? "network" :
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  async function handleApprove(listing: Listing) {
    setBusyId(listing.id);
    try {
      await approveListing(listing.id);
      showToast("Listing approved.");
      setPendingListings((prev) => prev.filter((l) => l.id !== listing.id));
      setStats((prev) => prev
        ? { ...prev, pendingListings: prev.pendingListings - 1, activeListings: prev.activeListings + 1 }
        : prev
      );
    } catch (e: unknown) {
      showToast(e instanceof ApiError && e.status === 403 ? "Permission denied." : "Failed to approve.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleActive(u: AdminUser) {
    setBusyId(u.id);
    try {
      await updateUserAdmin(u.id, { is_active: !u.is_active });
      setRecentUsers((prev) => prev.map((r) => r.id === u.id ? { ...r, is_active: !u.is_active } : r));
      showToast(u.is_active ? `${u.username} deactivated.` : `${u.username} activated.`);
    } catch (e: unknown) {
      showToast(e instanceof ApiError && e.status === 403 ? "Permission denied." : "Failed to update user.");
    } finally {
      setBusyId(null);
    }
  }

  // ─── Auth loading ────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="max-w-5xl space-y-6">
        <div className="h-8 w-44 animate-pulse rounded-xl bg-gray-100" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm font-semibold text-gray-900">Admin access required</p>
        <p className="mt-1 text-xs text-gray-500">Only admins and moderators can access this page.</p>
      </div>
    );
  }

  // ─── Card configs ────────────────────────────────────────────────────────────

  const summaryCards = [
    {
      label: "Total Users",
      value: stats?.totalUsers    ?? null,
      icon:  UsersIcon,
      color: "text-apple-blue",
      bg:    "bg-blue-50",
      href:  "/dashboard/users",
    },
    {
      label: "Total Listings",
      value: stats?.totalListings ?? null,
      icon:  ListingsIcon,
      color: "text-indigo-600",
      bg:    "bg-indigo-50",
      href:  "/dashboard/admin-listings",
    },
    {
      label: "Total Sellers",
      value: stats?.totalSellers  ?? null,
      icon:  SellersIcon,
      color: "text-emerald-600",
      bg:    "bg-emerald-50",
      href:  "/dashboard/users",
    },
    {
      label: "Total Buyers",
      value: stats?.totalBuyers   ?? null,
      icon:  BuyersIcon,
      color: "text-orange-500",
      bg:    "bg-orange-50",
      href:  "/dashboard/users",
    },
  ];

  const metricPills = [
    { label: "Pending Review",  value: stats?.pendingListings  ?? null, color: "text-amber-500",  href: "/dashboard/admin-listings" },
    { label: "Active Listings", value: stats?.activeListings   ?? null, color: "text-green-600",  href: "/dashboard/admin-listings" },
    { label: "Rejected",        value: stats?.rejectedListings ?? null, color: "text-red-500",    href: "/dashboard/admin-listings" },
    { label: "Categories",      value: stats?.totalCategories  ?? null, color: "text-purple-600", href: "/dashboard/categories"     },
  ];

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl space-y-8 pb-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Admin Overview</h1>
          {refreshedAt && (
            <p className="mt-0.5 text-xs text-gray-400">
              Updated {refreshedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-full border border-gray-200 px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {loading ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-xs font-semibold text-green-700">
          {toast}
        </div>
      )}

      {/* ── Primary summary cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <SummaryCard key={card.label} {...card} loading={loading} />
        ))}
      </div>

      {/* ── Secondary metrics ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metricPills.map((pill) => (
          <MetricPill key={pill.label} {...pill} loading={loading} />
        ))}
      </div>

      {/* Pending — alert banner */}
      {!loading && (stats?.pendingListings ?? 0) > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
              </svg>
            </span>
            <p className="text-sm font-semibold text-amber-800">
              {stats!.pendingListings} listing{stats!.pendingListings !== 1 ? "s" : ""} waiting for review
            </p>
          </div>
          <Link
            href="/dashboard/admin-listings"
            className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
          >
            Review now
          </Link>
        </div>
      )}

      {/* Error states */}
      {!loading && error === "forbidden" && (
        <div className="rounded-2xl border border-red-100 bg-red-50 py-12 text-center">
          <p className="text-sm font-semibold text-red-700">Permission denied</p>
          <p className="mt-1 text-xs text-red-500">Your account does not have admin access. Try signing out and back in.</p>
        </div>
      )}
      {!loading && error === "network" && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 py-12 text-center">
          <p className="text-sm font-semibold text-amber-700">Unable to connect to server.</p>
          <p className="mt-1 text-xs text-amber-500">Check your connection and try again.</p>
          <button onClick={load} className="mt-3 text-xs font-semibold text-apple-blue hover:underline">↻ Retry</button>
        </div>
      )}
      {!loading && error === "error" && (
        <div className="rounded-2xl border border-red-100 bg-red-50 py-12 text-center">
          <p className="text-sm font-semibold text-red-700">Failed to load dashboard data.</p>
          <p className="mt-1 text-xs text-red-500">Please try again.</p>
          <button onClick={load} className="mt-3 text-xs font-semibold text-apple-blue hover:underline">↻ Retry</button>
        </div>
      )}

      {/* Main content */}
      {!loading && !error && (
        <>
          <div className="grid gap-8 lg:grid-cols-2">

            {/* Pending listings */}
            <section className="space-y-3">
              <SectionHeader title="Needs Attention" href="/dashboard/admin-listings" />
              {pendingListings.length === 0 ? (
                <EmptyState icon="listing" title="No listings pending review." variant="plain" size="sm" />
              ) : (
                <div className="divide-y divide-gray-50 rounded-2xl border border-gray-100 bg-white shadow-sm">
                  {pendingListings.map((listing) => {
                    const thumb = listing.primary_image ?? listing.images?.[0]?.image;
                    return (
                      <div key={listing.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          {thumb ? (
                            <Image src={thumb} alt={listing.title} fill className="object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-300">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5M4.5 3h15A1.5 1.5 0 0121 4.5v15a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 19.5v-15A1.5 1.5 0 014.5 3z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-gray-900">{listing.title}</p>
                          <p className="text-xs text-gray-400">
                            {listing.owner?.username ?? "—"} · {listing.currency} {Number(listing.price).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1.5">
                          <button
                            onClick={() => handleApprove(listing)}
                            disabled={busyId === listing.id}
                            className="rounded-lg bg-green-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
                          >
                            {busyId === listing.id ? "…" : "Approve"}
                          </button>
                          <Link
                            href="/dashboard/admin-listings"
                            className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            Review
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Recent users */}
            <section className="space-y-3">
              <SectionHeader title="Recent Sign-ups" href="/dashboard/users" />
              {recentUsers.length === 0 ? (
                <EmptyState icon="generic" title="No users yet." variant="plain" size="sm" />
              ) : (
                <div className="divide-y divide-gray-50 rounded-2xl border border-gray-100 bg-white shadow-sm">
                  {recentUsers.map((u) => {
                    const initials = `${u.first_name.charAt(0)}${u.last_name.charAt(0)}`.toUpperCase()
                      || u.username.charAt(0).toUpperCase();
                    const roleColors: Record<string, string> = {
                      ADMIN:     "bg-purple-100 text-purple-700",
                      MODERATOR: "bg-indigo-100 text-indigo-700",
                      SELLER:    "bg-blue-100 text-blue-700",
                      BUYER:     "bg-gray-100 text-gray-600",
                    };
                    return (
                      <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-apple-blue/10 text-xs font-bold text-apple-blue">
                          {u.profile_picture ? (
                            <Image src={u.profile_picture} alt={u.username} fill className="object-cover" />
                          ) : initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="truncate text-xs font-semibold text-gray-900">
                              {u.first_name} {u.last_name}
                            </p>
                            <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold", roleColors[u.role] ?? "bg-gray-100 text-gray-600")}>
                              {u.role}
                            </span>
                            {!u.is_active && (
                              <span className="shrink-0 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">@{u.username}</p>
                        </div>
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={busyId === u.id}
                          className={cn(
                            "shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50",
                            u.is_active
                              ? "border-red-200 text-red-600 hover:bg-red-50"
                              : "border-green-200 text-green-600 hover:bg-green-50",
                          )}
                        >
                          {busyId === u.id ? "…" : u.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Admin tools quick-links */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Admin Tools</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Listing Moderation",
                  desc:  "Approve, reject, and feature listings",
                  href:  "/dashboard/admin-listings",
                  color: "text-green-600",
                  icon:  (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                      <path fillRule="evenodd" d="M10 2a.75.75 0 0 1 .75.75v.258a33.186 33.186 0 0 1 6.668 1.15.75.75 0 1 1-.336 1.461 31.28 31.28 0 0 0-1.103-.232l1.702 7.545a.75.75 0 0 1-.387.832A4.981 4.981 0 0 1 15 14c-.825 0-1.606-.2-2.294-.556a.75.75 0 0 1-.387-.832l1.77-7.849a31.743 31.743 0 0 0-3.339-.254v11.505a20.01 20.01 0 0 1 3.78.501.75.75 0 1 1-.338 1.462A18.51 18.51 0 0 0 10 17.5c-1.442 0-2.845.165-4.192.481a.75.75 0 1 1-.338-1.462 20.01 20.01 0 0 1 3.78-.501V4.509a31.743 31.743 0 0 0-3.339.254l1.77 7.849a.75.75 0 0 1-.387.832A4.98 4.98 0 0 1 5 14a4.98 4.98 0 0 1-2.294-.556.75.75 0 0 1-.387-.832L4.02 5.067c-.361.07-.718.15-1.103.232a.75.75 0 0 1-.336-1.462 33.186 33.186 0 0 1 6.668-1.15V2.75A.75.75 0 0 1 10 2Z" clipRule="evenodd" />
                    </svg>
                  ),
                },
                {
                  label: "User Management",
                  desc:  "Activate, deactivate, and manage user roles",
                  href:  "/dashboard/users",
                  color: "text-apple-blue",
                  icon:  (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                      <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
                    </svg>
                  ),
                },
                {
                  label: "Categories",
                  desc:  "Create and manage listing categories",
                  href:  "/dashboard/categories",
                  color: "text-purple-600",
                  icon:  (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                      <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 5.5a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Zm0 5.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
                    </svg>
                  ),
                },
              ].map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group flex items-start gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <span className={cn("mt-0.5 shrink-0", tool.color)}>{tool.icon}</span>
                  <div>
                    <p className={cn("text-sm font-semibold", tool.color)}>{tool.label}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{tool.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
