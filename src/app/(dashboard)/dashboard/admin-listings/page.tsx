"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth/useAuth";
import {
  getAllListingsAdmin,
  approveListing,
  rejectListing,
  featureListing,
  deleteListing,
} from "@/lib/api/listings";
import { ApiError, NetworkError } from "@/lib/api/client";
import type { Listing, ListingStatus } from "@/types/listing";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

type StatusFilter = "ALL" | ListingStatus;

const STATUS_TABS: { label: string; value: StatusFilter; activeClass: string }[] = [
  { label: "All",      value: "ALL",      activeClass: "bg-apple-blue text-white"   },
  { label: "Pending",  value: "PENDING",  activeClass: "bg-amber-500 text-white"    },
  { label: "Approved", value: "ACTIVE",   activeClass: "bg-green-500 text-white"    },
  { label: "Rejected", value: "REJECTED", activeClass: "bg-red-500 text-white"      },
  { label: "Draft",    value: "DRAFT",    activeClass: "bg-gray-500 text-white"     },
  { label: "Sold",     value: "SOLD",     activeClass: "bg-blue-500 text-white"     },
  { label: "Archived", value: "ARCHIVED", activeClass: "bg-gray-400 text-white"     },
];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:   "bg-green-100 text-green-700",
  PENDING:  "bg-amber-100 text-amber-700",
  REJECTED: "bg-red-100 text-red-700",
  DRAFT:    "bg-gray-100 text-gray-600",
  SOLD:     "bg-blue-100 text-blue-700",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

// ─── Reject modal ─────────────────────────────────────────────────────────────

function RejectModal({
  listing,
  onConfirm,
  onClose,
  busy = false,
}: {
  listing: Listing;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  busy?: boolean;
}) {
  const [reason, setReason] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-red-600">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Reject listing</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Provide a reason so the seller can fix and resubmit.
          </p>
          <p className="mt-2 text-xs font-medium text-gray-700 truncate">&ldquo;{listing.title}&rdquo;</p>
        </div>
        <textarea
          ref={textareaRef}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. Images are too low quality. Please upload clear photos."
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-xl border border-gray-200 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => reason.trim() && !busy && onConfirm(reason.trim())}
            disabled={!reason.trim() || busy}
            className="flex-1 rounded-xl bg-red-500 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {busy ? "Rejecting…" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirmation modal ────────────────────────────────────────────────

function DeleteModal({
  listing,
  onConfirm,
  onCancel,
  busy,
}: {
  listing: Listing;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-red-600">
            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Delete listing?</h2>
          <p className="mt-1 text-xs text-gray-500">
            This will permanently remove{" "}
            <span className="font-semibold text-gray-700">&ldquo;{listing.title}&rdquo;</span>.
            This cannot be undone.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Table skeleton ───────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="border-b border-gray-50">
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-gray-100" />
              <div className="space-y-1.5">
                <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
                <div className="h-2.5 w-20 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          </td>
          <td className="px-4 py-3"><div className="h-3 w-16 animate-pulse rounded bg-gray-100" /></td>
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 animate-pulse rounded-full bg-gray-100" />
              <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
            </div>
          </td>
          <td className="px-4 py-3"><div className="h-5 w-16 animate-pulse rounded-full bg-gray-100" /></td>
          <td className="px-4 py-3"><div className="h-3 w-20 animate-pulse rounded bg-gray-100" /></td>
          <td className="px-4 py-3">
            <div className="flex justify-end gap-1.5">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-7 w-7 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminListingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "MODERATOR";

  const [listings,      setListings]      = useState<Listing[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [statusFilter,  setStatusFilter]  = useState<StatusFilter>("PENDING");
  const [search,        setSearch]        = useState("");
  const [searchInput,   setSearchInput]   = useState("");
  const [page,          setPage]          = useState(1);
  const [totalCount,    setTotalCount]    = useState(0);
  const [error,         setError]         = useState("");
  const [toast,         setToast]         = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [busyId,        setBusyId]        = useState<number | null>(null);
  const [rejectTarget,  setRejectTarget]  = useState<Listing | null>(null);
  const [deleteTarget,  setDeleteTarget]  = useState<Listing | null>(null);

  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page,
        page_size: PAGE_SIZE,
        ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      };
      const data = await getAllListingsAdmin(params);
      setListings(data.results);
      setTotalCount(data.count);
    } catch (e: unknown) {
      setError(
        e instanceof ApiError && e.status === 403 ? "forbidden" :
        e instanceof NetworkError ? "network" :
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page]);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleApprove(listing: Listing) {
    setBusyId(listing.id);
    try {
      await approveListing(listing.id);
      setListings((prev) => prev.filter((l) => l.id !== listing.id));
      setTotalCount((n) => n - 1);
      showToast("Listing approved.");
    } catch (e: unknown) {
      showToast(e instanceof ApiError && e.status === 403 ? "Permission denied." : "Failed to approve listing.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(listing: Listing, reason: string) {
    setBusyId(listing.id);
    try {
      await rejectListing(listing.id, reason);
      setRejectTarget(null);
      setListings((prev) => prev.filter((l) => l.id !== listing.id));
      setTotalCount((n) => n - 1);
      showToast("Listing rejected.");
    } catch (e: unknown) {
      showToast(e instanceof ApiError && e.status === 403 ? "Permission denied." : "Failed to reject listing.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleFeature(listing: Listing) {
    setBusyId(listing.id);
    try {
      await featureListing(listing.id, !listing.is_featured);
      setListings((prev) =>
        prev.map((l) => l.id === listing.id ? { ...l, is_featured: !l.is_featured } : l),
      );
      showToast(listing.is_featured ? "Listing unfeatured." : "Listing featured.");
    } catch (e: unknown) {
      showToast(e instanceof ApiError && e.status === 403 ? "Permission denied." : "Failed to update listing.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(listing: Listing) {
    setBusyId(listing.id);
    try {
      await deleteListing(listing.id);
      setListings((prev) => prev.filter((l) => l.id !== listing.id));
      setTotalCount((n) => n - 1);
      setDeleteTarget(null);
      showToast("Listing deleted.");
    } catch (e: unknown) {
      showToast(e instanceof ApiError && e.status === 403 ? "Permission denied." : "Failed to delete listing.", "error");
      setBusyId(null);
    }
  }

  // ─── Auth loading ─────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="max-w-5xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-gray-100" />
        <div className="h-80 animate-pulse rounded-2xl bg-gray-100" />
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

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <>
      <div className="max-w-5xl space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Listing Moderation</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            Approve, reject, feature, or remove listings across the marketplace.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setStatusFilter(tab.value); setPage(1); }}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                  statusFilter === tab.value
                    ? tab.activeClass
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}
            className="ml-auto flex gap-2"
          >
            <div className="relative">
              <svg viewBox="0 0 20 20" fill="currentColor" className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
              </svg>
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search listings…"
                className="w-48 rounded-xl border border-gray-200 py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-apple-blue"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-apple-blue px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Search
            </button>
          </form>
        </div>

        {/* Toast */}
        {toast && (
          <div className={cn(
            "rounded-lg border px-4 py-2 text-xs font-semibold",
            toast.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700",
          )}>
            {toast.msg}
          </div>
        )}

        {/* Count */}
        {!loading && !error && (
          <p className="text-xs text-gray-400">
            {totalCount.toLocaleString()} listing{totalCount !== 1 ? "s" : ""}
          </p>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Listing</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Seller</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Submitted</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <TableSkeleton />
                ) : error === "forbidden" ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center">
                      <p className="text-sm font-semibold text-red-700">Permission denied</p>
                      <p className="mt-1 text-xs text-red-400">Try signing out and back in.</p>
                    </td>
                  </tr>
                ) : error === "network" ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center">
                      <p className="text-sm font-semibold text-amber-700">Unable to connect to server.</p>
                      <button onClick={load} className="mt-2 text-xs font-semibold text-apple-blue hover:underline">Retry →</button>
                    </td>
                  </tr>
                ) : error === "error" ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center">
                      <p className="text-sm font-semibold text-red-700">Failed to load listings. Please try again.</p>
                      <button onClick={load} className="mt-2 text-xs font-semibold text-apple-blue hover:underline">Retry →</button>
                    </td>
                  </tr>
                ) : listings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-sm text-gray-400">
                      No listings match this filter.
                    </td>
                  </tr>
                ) : (
                  listings.map((listing) => {
                    const thumb = listing.primary_image ?? listing.images?.[0]?.image;
                    const isBusy = busyId === listing.id;
                    const canApprove  = listing.status === "PENDING" || listing.status === "DRAFT";
                    const canReject   = listing.status !== "REJECTED";

                    return (
                      <tr
                        key={listing.id}
                        className={cn(
                          "group transition-colors hover:bg-gray-50/70",
                          isBusy && "opacity-60",
                        )}
                      >
                        {/* Listing */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                              {thumb ? (
                                <Image src={thumb} alt={listing.title} fill className="object-cover" />
                              ) : (
                                <div className="flex h-full items-center justify-center text-gray-300">
                                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5M4.5 3h15A1.5 1.5 0 0121 4.5v15a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 19.5v-15A1.5 1.5 0 014.5 3z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="max-w-[200px] truncate text-xs font-semibold text-gray-900">
                                {listing.title}
                              </p>
                              <p className="text-[11px] text-gray-400">
                                {listing.category.name}{" "}
                                {listing.is_featured && (
                                  <span className="ml-1 rounded-full bg-apple-blue/10 px-1.5 py-0.5 text-[10px] font-semibold text-apple-blue">
                                    Featured
                                  </span>
                                )}
                              </p>
                              {listing.rejection_reason && (
                                <p className="mt-0.5 max-w-[200px] truncate text-[11px] text-red-500">
                                  {listing.rejection_reason}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold text-gray-800">
                            {listing.currency} {Number(listing.price).toLocaleString()}
                          </span>
                        </td>

                        {/* Seller */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-apple-blue/10">
                              {listing.owner?.profile_picture ? (
                                <Image
                                  src={listing.owner.profile_picture}
                                  alt={listing.owner.username}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-apple-blue">
                                  {listing.owner?.username?.charAt(0).toUpperCase() ?? "?"}
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-gray-700">
                              {listing.owner?.username ?? "—"}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            STATUS_COLORS[listing.status] ?? "bg-gray-100 text-gray-600",
                          )}>
                            {listing.status === "ACTIVE" ? "APPROVED" : listing.status}
                          </span>
                        </td>

                        {/* Submitted date */}
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-400">
                            {new Date(listing.created_at).toLocaleDateString("en-GB", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">

                            {/* Approve */}
                            {canApprove && (
                              <button
                                onClick={() => handleApprove(listing)}
                                disabled={isBusy}
                                title="Approve"
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-green-600 hover:bg-green-50 disabled:opacity-50 transition-colors"
                              >
                                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                                </svg>
                              </button>
                            )}

                            {/* Reject */}
                            {canReject && (
                              <button
                                onClick={() => setRejectTarget(listing)}
                                disabled={isBusy}
                                title="Reject"
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
                              >
                                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" />
                                </svg>
                              </button>
                            )}

                            {/* Feature */}
                            <button
                              onClick={() => handleFeature(listing)}
                              disabled={isBusy}
                              title={listing.is_featured ? "Unfeature" : "Feature"}
                              className={cn(
                                "flex h-7 w-7 items-center justify-center rounded-lg transition-colors disabled:opacity-50",
                                listing.is_featured
                                  ? "text-apple-blue hover:bg-apple-blue/10"
                                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-600",
                              )}
                            >
                              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" />
                              </svg>
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => setDeleteTarget(listing)}
                              disabled={isBusy}
                              title="Delete"
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors"
                            >
                              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              ← Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = totalPages <= 7
                  ? i + 1
                  : page <= 4
                    ? i + 1
                    : page >= totalPages - 3
                      ? totalPages - 6 + i
                      : page - 3 + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      "h-8 min-w-8 rounded-lg px-2 text-xs font-semibold transition-colors",
                      p === page
                        ? "bg-apple-blue text-white"
                        : "text-gray-500 hover:bg-gray-100",
                    )}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          listing={rejectTarget}
          busy={busyId === rejectTarget.id}
          onConfirm={(reason) => handleReject(rejectTarget, reason)}
          onClose={() => setRejectTarget(null)}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteModal
          listing={deleteTarget}
          busy={busyId === deleteTarget.id}
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
