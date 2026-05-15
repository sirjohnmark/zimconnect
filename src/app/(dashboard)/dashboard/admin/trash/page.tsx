"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getDeletedListings, restoreListing } from "@/lib/api/listings";
import { getDeletedUsers } from "@/lib/api/users";
import type { DeletedListing } from "@/lib/api/listings";
import type { DeletedUser } from "@/lib/api/users";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", color)}>
      {children}
    </span>
  );
}

// ─── Deleted listings tab ─────────────────────────────────────────────────────

function DeletedListingsTab() {
  const [listings, setListings] = useState<DeletedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getDeletedListings()
      .then((d) => setListings(d.results))
      .catch((e) => setError(e?.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRestore = async (id: number) => {
    setRestoring(id);
    try {
      await restoreListing(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (e: unknown) {
      alert((e as Error)?.message ?? "Restore failed");
    } finally {
      setRestoring(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 px-6 py-8 text-center">
        <p className="text-sm text-red-700">{error}</p>
        <button onClick={load} className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700">
          Retry
        </button>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 bg-gray-50 px-6 py-12 text-center">
        <p className="text-sm font-medium text-gray-500">No deleted listings</p>
        <p className="mt-1 text-xs text-gray-400">Soft-deleted listings will appear here and can be restored.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Listing</th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold text-gray-500 sm:table-cell">Owner</th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold text-gray-500 md:table-cell">Deleted</th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold text-gray-500 lg:table-cell">Deleted by</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 bg-white">
          {listings.map((l) => (
            <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-4 py-3">
                <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{l.title}</p>
                <p className="text-xs text-gray-400">{l.category?.name ?? "—"} · {l.location}</p>
              </td>
              <td className="hidden px-4 py-3 sm:table-cell">
                <p className="text-xs text-gray-700">{l.owner.username}</p>
                <p className="text-xs text-gray-400">{l.owner.email}</p>
              </td>
              <td className="hidden px-4 py-3 md:table-cell">
                <p className="text-xs text-gray-600">{formatDate(l.deleted_at)}</p>
              </td>
              <td className="hidden px-4 py-3 lg:table-cell">
                <p className="text-xs text-gray-600">{l.deleted_by?.username ?? "—"}</p>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => handleRestore(l.id)}
                  disabled={restoring === l.id}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  {restoring === l.id ? "Restoring…" : "Restore"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Deleted users tab ────────────────────────────────────────────────────────

function DeletedUsersTab() {
  const [users, setUsers] = useState<DeletedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getDeletedUsers()
      .then((d) => setUsers(d.results))
      .catch((e) => setError(e?.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 px-6 py-8 text-center">
        <p className="text-sm text-red-700">{error}</p>
        <button onClick={load} className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700">
          Retry
        </button>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 bg-gray-50 px-6 py-12 text-center">
        <p className="text-sm font-medium text-gray-500">No deleted users</p>
        <p className="mt-1 text-xs text-gray-400">Soft-deleted user accounts will appear here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">User</th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold text-gray-500 sm:table-cell">Role</th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold text-gray-500 md:table-cell">Listings</th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold text-gray-500 lg:table-cell">Deleted</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 bg-white">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-4 py-3">
                <p className="text-sm font-medium text-gray-900">{u.username}</p>
                <p className="text-xs text-gray-400">{u.email}</p>
              </td>
              <td className="hidden px-4 py-3 sm:table-cell">
                <Badge color="bg-gray-100 text-gray-600">{u.role}</Badge>
              </td>
              <td className="hidden px-4 py-3 md:table-cell">
                <p className="text-xs text-gray-600">{u.listings_count}</p>
              </td>
              <td className="hidden px-4 py-3 lg:table-cell">
                <p className="text-xs text-gray-600">{formatDate(u.deleted_at)}</p>
              </td>
              <td className="px-4 py-3 text-right">
                <Badge color="bg-red-50 text-red-600">Deleted</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = "listings" | "users";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminTrashPage() {
  const [tab, setTab] = useState<Tab>("listings");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Trash</h1>
          <p className="mt-0.5 text-sm text-gray-500">Soft-deleted listings and accounts</p>
        </div>
        <Link
          href="/dashboard/admin"
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 shadow-sm"
        >
          ← Overview
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1 w-fit gap-1">
        {(["listings", "users"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-lg px-5 py-2 text-sm font-semibold transition-colors capitalize",
              tab === t
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            {t === "listings" ? "Deleted Listings" : "Deleted Users"}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "listings" ? <DeletedListingsTab /> : <DeletedUsersTab />}
    </div>
  );
}
