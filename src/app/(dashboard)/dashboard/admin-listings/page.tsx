"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth/useAuth";
import {
  getAllListingsAdmin,
  approveListing,
  rejectListing,
  featureListing,
} from "@/lib/api/listings";
import { ApiError } from "@/lib/api/client";
import type { Listing, ListingStatus } from "@/types/listing";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusFilter = "ALL" | ListingStatus;

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: "All",      value: "ALL"      },
  { label: "Pending",  value: "PENDING"  },
  { label: "Active",   value: "ACTIVE"   },
  { label: "Rejected", value: "REJECTED" },
  { label: "Draft",    value: "DRAFT"    },
  { label: "Sold",     value: "SOLD"     },
  { label: "Archived", value: "ARCHIVED" },
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
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Reject listing</h2>
        <p className="text-xs text-gray-500">
          Provide a reason so the seller can fix and resubmit their listing.
        </p>
        <p className="text-sm font-medium text-gray-800 truncate">&ldquo;{listing.title}&rdquo;</p>
        <textarea
          ref={inputRef}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. Images are too low-quality. Please upload clear photos."
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
        />
        <div className="flex gap-3 justify-end pt-1">
          <button
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => reason.trim() && !busy && onConfirm(reason.trim())}
            disabled={!reason.trim() || busy}
            className="rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {busy ? "Rejecting…" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Listing row ──────────────────────────────────────────────────────────────

function ListingRow({
  listing,
  onApprove,
  onReject,
  onFeature,
  busy,
}: {
  listing: Listing;
  onApprove: () => void;
  onReject: () => void;
  onFeature: () => void;
  busy: boolean;
}) {
  const thumb = listing.primary_image ?? listing.images?.[0]?.image;

  return (
    <div className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      {/* Thumbnail */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
        {thumb ? (
          <Image src={thumb} alt={listing.title} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5M4.5 3h15A1.5 1.5 0 0121 4.5v15a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 19.5v-15A1.5 1.5 0 014.5 3z" />
            </svg>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start gap-2">
          <p className="truncate text-sm font-semibold text-gray-900">{listing.title}</p>
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", STATUS_COLORS[listing.status] ?? "bg-gray-100 text-gray-600")}>
            {listing.status}
          </span>
          {listing.is_featured && (
            <span className="rounded-full bg-apple-blue/10 px-2 py-0.5 text-xs font-semibold text-apple-blue">Featured</span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-gray-500">
          by <span className="font-medium text-gray-700">{listing.owner?.username ?? "—"}</span>
          {" · "}{listing.location}{" · "}{listing.currency} {Number(listing.price).toLocaleString()}
        </p>
        {listing.rejection_reason && (
          <p className="mt-1 text-xs text-red-500">Reason: {listing.rejection_reason}</p>
        )}
        <p className="mt-1 text-xs text-gray-400">
          {new Date(listing.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 flex-col items-end gap-2">
        {(listing.status === "PENDING" || listing.status === "DRAFT") && (
          <button
            onClick={onApprove}
            disabled={busy}
            className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            Approve
          </button>
        )}
        {listing.status !== "REJECTED" && (
          <button
            onClick={onReject}
            disabled={busy}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            Reject
          </button>
        )}
        <button
          onClick={onFeature}
          disabled={busy}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
            listing.is_featured
              ? "border-apple-blue/30 bg-apple-blue/5 text-apple-blue hover:bg-apple-blue/10"
              : "border-gray-200 text-gray-600 hover:bg-gray-50",
          )}
        >
          {listing.is_featured ? "Unfeature" : "Feature"}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminListingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "MODERATOR";

  const [listings,    setListings]    = useState<Listing[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [search,      setSearch]      = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page,        setPage]        = useState(1);
  const [totalCount,  setTotalCount]  = useState(0);
  const [error,       setError]       = useState("");
  const [toast,       setToast]       = useState("");
  const [busyId,      setBusyId]      = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Listing | null>(null);

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
      setError(e instanceof ApiError && e.status === 403 ? "forbidden" : "unavailable");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page]);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function handleApprove(listing: Listing) {
    setBusyId(listing.id);
    try {
      await approveListing(listing.id);
      showToast("Listing approved.");
      load();
    } catch (e: unknown) {
      setError(e instanceof ApiError && e.status === 403
        ? "Permission denied. Your admin session may have expired — try reloading."
        : "Failed to approve listing.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(listing: Listing, reason: string) {
    setBusyId(listing.id);
    try {
      await rejectListing(listing.id, reason);
      setRejectTarget(null);
      showToast("Listing rejected.");
      load();
    } catch (e: unknown) {
      setError(e instanceof ApiError && e.status === 403
        ? "Permission denied. Your admin session may have expired — try reloading."
        : "Failed to reject listing.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleFeature(listing: Listing) {
    setBusyId(listing.id);
    try {
      await featureListing(listing.id, !listing.is_featured);
      showToast(listing.is_featured ? "Listing unfeatured." : "Listing featured.");
      load();
    } catch (e: unknown) {
      setError(e instanceof ApiError && e.status === 403
        ? "Permission denied. Your admin session may have expired — try reloading."
        : "Failed to update listing.");
    } finally {
      setBusyId(null);
    }
  }

  if (authLoading) {
    return (
      <div className="max-w-4xl space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
        ))}
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
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Listing Moderation</h1>
        <p className="mt-0.5 text-xs text-gray-500">Approve, reject, or feature listings across the marketplace.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(1); }}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                statusFilter === tab.value
                  ? "bg-apple-blue text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}
          className="flex gap-2 ml-auto"
        >
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search listings…"
            className="w-48 rounded-xl border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-apple-blue"
          />
          <button type="submit" className="rounded-xl bg-apple-blue px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity">
            Search
          </button>
        </form>
      </div>

      {/* Toast */}
      {toast && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-xs font-semibold text-green-700">
          {toast}
        </div>
      )}
      {error && error !== "unavailable" && error !== "forbidden" && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Count */}
      {!loading && !error && (
        <p className="text-xs text-gray-400">{totalCount.toLocaleString()} listing{totalCount !== 1 ? "s" : ""}</p>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
          ))
        ) : error === "forbidden" ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50 py-12 text-center">
            <p className="text-sm font-semibold text-red-700">Permission denied</p>
            <p className="mt-1 text-xs text-red-500">Your account does not have admin access. Try signing out and back in.</p>
          </div>
        ) : error === "unavailable" ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 py-12 text-center">
            <p className="text-sm font-semibold text-amber-700">We are currently unavailable</p>
            <p className="mt-1 text-xs text-amber-500">Please come back in a few minutes.</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">No listings match this filter.</div>
        ) : (
          listings.map((listing) => (
            <ListingRow
              key={listing.id}
              listing={listing}
              busy={busyId === listing.id}
              onApprove={() => handleApprove(listing)}
              onReject={() => setRejectTarget(listing)}
              onFeature={() => handleFeature(listing)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          listing={rejectTarget}
          busy={busyId === rejectTarget.id}
          onConfirm={(reason) => handleReject(rejectTarget, reason)}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </div>
  );
}
