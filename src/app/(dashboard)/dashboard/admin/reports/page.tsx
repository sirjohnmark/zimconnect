"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminStats } from "@/lib/api/admin";
import type { AdminStats } from "@/lib/api/admin";
import { cn } from "@/lib/utils";

// ─── Stat row ─────────────────────────────────────────────────────────────────

function StatRow({
  label,
  value,
  total,
  color,
  loading,
}: {
  label: string;
  value: number | null;
  total?: number | null;
  color: string;
  loading: boolean;
}) {
  const pct = value != null && total != null && total > 0
    ? Math.round((value / total) * 100)
    : null;

  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {pct != null && (
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
      {loading ? (
        <div className="h-6 w-12 animate-pulse rounded bg-gray-100" />
      ) : (
        <div className="text-right shrink-0">
          <p className="text-base font-bold text-gray-900 tabular-nums">
            {value !== null ? value.toLocaleString() : "—"}
          </p>
          {pct != null && (
            <p className="text-xs text-gray-400">{pct}%</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function ReportCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="px-6 py-2">{children}</div>
    </div>
  );
}

// ─── Big metric ───────────────────────────────────────────────────────────────

function BigMetric({
  label,
  value,
  sub,
  icon,
  bg,
  color,
  loading,
}: {
  label: string;
  value: number | null;
  sub?: string;
  icon: React.ReactNode;
  bg: string;
  color: string;
  loading: boolean;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", bg)}>
        <span className={color}>{icon}</span>
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
        {loading ? (
          <div className="mt-1.5 h-7 w-14 animate-pulse rounded-lg bg-gray-100" />
        ) : (
          <p className={cn("mt-0.5 text-2xl font-bold tabular-nums", color)}>
            {value !== null ? value.toLocaleString() : "—"}
          </p>
        )}
        {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminReportsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch((e) => setError(e?.message ?? "Failed to load reports"))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-2xl border border-red-100 bg-red-50 px-8 py-10 text-center max-w-sm">
          <p className="text-sm font-semibold text-red-700">{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); getAdminStats().then(setStats).catch((e) => setError(e?.message ?? "Error")).finally(() => setLoading(false)); }}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const totalListings = stats?.totalListings ?? null;
  const pendingListings = stats?.pendingListings ?? null;
  const activeListings = stats?.activeListings ?? null;
  const rejectedListings = stats?.rejectedListings ?? null;
  const totalUsers = stats?.totalUsers ?? null;
  const totalSellers = stats?.totalSellers ?? null;
  const totalBuyers = stats?.totalBuyers ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Platform Reports</h1>
          <p className="mt-0.5 text-sm text-gray-500">Overview of platform activity and health</p>
        </div>
        <Link
          href="/dashboard/admin"
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 shadow-sm"
        >
          ← Overview
        </Link>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <BigMetric
          label="Total Users"
          value={totalUsers}
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
            </svg>
          }
          bg="bg-blue-50"
          color="text-apple-blue"
          loading={loading}
        />
        <BigMetric
          label="Total Listings"
          value={totalListings}
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 5.5a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Zm0 5.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
            </svg>
          }
          bg="bg-purple-50"
          color="text-purple-600"
          loading={loading}
        />
        <BigMetric
          label="Active Listings"
          value={activeListings}
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
            </svg>
          }
          bg="bg-green-50"
          color="text-green-600"
          loading={loading}
        />
        <BigMetric
          label="Pending Review"
          value={pendingListings}
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
            </svg>
          }
          bg="bg-amber-50"
          color="text-amber-600"
          loading={loading}
        />
      </div>

      {/* Two-column reports */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* User breakdown */}
        <ReportCard title="User Breakdown">
          <StatRow label="All Users" value={totalUsers} color="bg-apple-blue" loading={loading} />
          <StatRow label="Buyers" value={totalBuyers} total={totalUsers} color="bg-blue-400" loading={loading} />
          <StatRow label="Sellers" value={totalSellers} total={totalUsers} color="bg-purple-500" loading={loading} />
          <StatRow
            label="Admins / Moderators"
            value={totalUsers != null && totalBuyers != null && totalSellers != null
              ? totalUsers - totalBuyers - totalSellers
              : null}
            total={totalUsers}
            color="bg-gray-400"
            loading={loading}
          />
        </ReportCard>

        {/* Listing breakdown */}
        <ReportCard title="Listing Breakdown">
          <StatRow label="All Listings" value={totalListings} color="bg-purple-600" loading={loading} />
          <StatRow label="Active" value={activeListings} total={totalListings} color="bg-green-500" loading={loading} />
          <StatRow label="Pending Review" value={pendingListings} total={totalListings} color="bg-amber-400" loading={loading} />
          <StatRow label="Rejected" value={rejectedListings} total={totalListings} color="bg-red-400" loading={loading} />
        </ReportCard>

        {/* Today's activity */}
        <ReportCard title="Today's Activity">
          <StatRow label="New Users Today" value={stats?.newUsersToday ?? null} color="bg-blue-400" loading={loading} />
          <StatRow label="New Listings Today" value={stats?.newListingsToday ?? null} color="bg-purple-400" loading={loading} />
        </ReportCard>

        {/* Platform health */}
        <ReportCard title="Platform Health">
          <StatRow label="Total Conversations" value={stats?.totalConversations ?? null} color="bg-indigo-400" loading={loading} />
          <StatRow label="Total Categories" value={stats?.totalCategories ?? null} color="bg-teal-400" loading={loading} />
          <StatRow
            label="Listing Approval Rate"
            value={
              activeListings != null && totalListings != null && totalListings > 0
                ? Math.round((activeListings / totalListings) * 100)
                : null
            }
            color="bg-green-500"
            loading={loading}
          />
        </ReportCard>
      </div>
    </div>
  );
}
