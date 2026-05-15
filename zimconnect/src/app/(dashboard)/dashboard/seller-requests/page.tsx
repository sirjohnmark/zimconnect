"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { useRequireAuth } from "@/lib/auth/requireAuth";
import {
  getAdminSellerRequests,
  approveSellerRequest,
  rejectSellerRequest,
  type AdminSellerRequest,
} from "@/lib/api/sellers";
import { ApiError } from "@/lib/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusFilter = "PENDING" | "APPROVED" | "REJECTED";

const FILTER_TABS: { label: string; value: StatusFilter }[] = [
  { label: "Pending",  value: "PENDING"  },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

const STATUS_STYLES: Record<StatusFilter, string> = {
  PENDING:  "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

// ─── Reject modal ─────────────────────────────────────────────────────────────

function RejectModal({
  request,
  onConfirm,
  onClose,
}: {
  request: AdminSellerRequest;
  onConfirm: (reason: string) => Promise<void>;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  async function handleSubmit() {
    if (!reason.trim()) {
      setError("Please provide a rejection reason.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject request.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-sm font-semibold text-gray-900">
          Reject application — {request.business_name}
        </h2>
        <p className="text-xs text-gray-500">
          Provide a reason so the applicant can address it and reapply.
        </p>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Reason for rejection…"
          className="w-full resize-none rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-apple-blue focus:outline-none focus:ring-2 focus:ring-apple-blue/20"
        />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !reason.trim()}
            className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Rejecting…" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Request card ─────────────────────────────────────────────────────────────

function RequestCard({
  request,
  onApprove,
  onReject,
  actionLoading,
}: {
  request: AdminSellerRequest;
  onApprove: (id: number) => Promise<void>;
  onReject: (request: AdminSellerRequest) => void;
  actionLoading: number | null;
}) {
  const fullName = [request.user.first_name, request.user.last_name].filter(Boolean).join(" ");
  const displayName = fullName || request.user.username;

  return (
    <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-gray-900">{request.business_name}</p>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                STATUS_STYLES[request.status],
              )}
            >
              {request.status}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-gray-500">
            by {displayName} ({request.user.email})
          </p>
        </div>
        <p className="shrink-0 text-xs text-gray-400">
          {new Date(request.requested_at).toLocaleDateString()}
        </p>
      </div>

      {request.business_description && (
        <p className="text-sm text-gray-600">{request.business_description}</p>
      )}

      {request.rejection_reason && (
        <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          Rejection reason: {request.rejection_reason}
        </p>
      )}

      {request.status === "PENDING" && (
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => onApprove(request.id)}
            disabled={actionLoading === request.id}
            className="flex-1 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {actionLoading === request.id ? "Approving…" : "Approve"}
          </button>
          <button
            type="button"
            onClick={() => onReject(request)}
            disabled={actionLoading === request.id}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

function RequestsSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-32 w-full rounded-2xl" />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SellerRequestsPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const { user } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<StatusFilter>("PENDING");
  const [requests, setRequests] = useState<AdminSellerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminSellerRequest | null>(null);

  const load = useCallback(
    (status: StatusFilter) => {
      setLoading(true);
      setError(null);
      getAdminSellerRequests(status)
        .then(setRequests)
        .catch((err: unknown) => {
          if (err instanceof ApiError && err.status === 403) {
            router.replace("/dashboard");
          } else {
            setError(err instanceof Error ? err.message : "Failed to load seller requests.");
          }
        })
        .finally(() => setLoading(false));
    },
    [router],
  );

  useEffect(() => {
    if (authLoading || !user) return;
    if (user.role !== "ADMIN" && user.role !== "MODERATOR") {
      router.replace("/dashboard");
      return;
    }
    load(filter);
  }, [authLoading, user, filter, load, router]);

  async function handleApprove(id: number) {
    setActionLoading(id);
    try {
      await approveSellerRequest(id);
      load(filter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve request.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(reason: string) {
    if (!rejectTarget) return;
    try {
      await rejectSellerRequest(rejectTarget.id, reason);
      setRejectTarget(null);
      load(filter);
    } catch (err) {
      throw err;
    }
  }

  return (
    <>
      {rejectTarget && (
        <RejectModal
          request={rejectTarget}
          onConfirm={handleReject}
          onClose={() => setRejectTarget(null)}
        />
      )}

      <div className="space-y-6 pb-10">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Seller Requests</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review and manage applications to become a seller.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-100 bg-gray-50 p-1">
          {FILTER_TABS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={cn(
                "shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                filter === value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <RequestsSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-14 text-center">
            <p className="text-sm font-semibold text-gray-700">Something went wrong</p>
            <p className="mt-1 text-xs text-gray-400">{error}</p>
            <button
              type="button"
              onClick={() => load(filter)}
              className="mt-4 rounded-lg bg-apple-blue px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Retry
            </button>
          </div>
        ) : requests.length > 0 ? (
          <div className="space-y-3">
            {requests.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                onApprove={handleApprove}
                onReject={setRejectTarget}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-16 text-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="mb-3 h-10 w-10 text-gray-300"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
            </svg>
            <p className="text-sm font-semibold text-gray-600">
              No {filter.toLowerCase()} requests
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {filter === "PENDING"
                ? "All caught up — no applications waiting for review."
                : `No ${filter.toLowerCase()} applications found.`}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
