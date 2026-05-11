"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/useAuth";
import {
  getAdminUpgradeRequests,
  approveUpgradeRequest,
  rejectUpgradeRequest,
  type AdminUpgradeRequest,
} from "@/lib/api/upgrade";
import { ApiError, NetworkError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusFilter = "PENDING" | "APPROVED" | "REJECTED" | "ALL";

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: "Pending",  value: "PENDING"  },
  { label: "All",      value: "ALL"      },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

const STATUS_COLORS: Record<AdminUpgradeRequest["status"], string> = {
  PENDING:  "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<AdminUpgradeRequest["status"], string> = {
  PENDING:  "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

// ─── Reject modal ─────────────────────────────────────────────────────────────

function RejectModal({
  request,
  onConfirm,
  onClose,
  busy,
}: {
  request: AdminUpgradeRequest;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  busy: boolean;
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
          <h2 className="text-sm font-semibold text-gray-900">Reject application</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Provide a reason so the applicant knows what to fix and can resubmit.
          </p>
          <p className="mt-2 truncate text-xs font-medium text-gray-700">
            &ldquo;{request.business_name}&rdquo; — {request.full_name || request.username}
          </p>
        </div>
        <textarea
          ref={textareaRef}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. Documents are unclear. Please upload higher-quality photos."
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
        />
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason.trim())}
            disabled={busy || !reason.trim()}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {busy ? "Rejecting…" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Document link ────────────────────────────────────────────────────────────

function DocLink({ label, url }: { label: string; url: string | null }) {
  if (!url) return (
    <span className="flex items-center gap-1 text-xs text-gray-300">
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
        <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
      </svg>
      {label}
    </span>
  );
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 text-xs font-medium text-apple-blue hover:underline"
    >
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 shrink-0">
        <path d="M8.75 2.75a.75.75 0 0 0-1.5 0v5.69L5.03 6.22a.75.75 0 0 0-1.06 1.06l3.5 3.5a.75.75 0 0 0 1.06 0l3.5-3.5a.75.75 0 0 0-1.06-1.06L8.75 8.44V2.75Z" />
        <path d="M3.5 9.75a.75.75 0 0 0-1.5 0v1.5A2.75 2.75 0 0 0 4.75 14h6.5A2.75 2.75 0 0 0 14 11.25v-1.5a.75.75 0 0 0-1.5 0v1.5c0 .69-.56 1.25-1.25 1.25h-6.5c-.69 0-1.25-.56-1.25-1.25v-1.5Z" />
      </svg>
      {label}
    </a>
  );
}

// ─── Request card ─────────────────────────────────────────────────────────────

function RequestCard({
  request,
  onApprove,
  onReject,
  busy,
}: {
  request: AdminUpgradeRequest;
  onApprove: () => void;
  onReject: () => void;
  busy: boolean;
}) {
  const initials = (request.full_name || request.username).charAt(0).toUpperCase();
  const submittedAt = new Date(request.requested_at).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div className={cn("rounded-2xl border bg-white p-5 shadow-sm space-y-4 transition-opacity", busy && "opacity-60")}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-apple-blue/10 text-sm font-bold text-apple-blue">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">
              {request.full_name || request.username}
            </p>
            <p className="truncate text-xs text-gray-400">{request.email}</p>
          </div>
        </div>
        <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_COLORS[request.status])}>
          {STATUS_LABELS[request.status]}
        </span>
      </div>

      {/* Business details */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-white border border-gray-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-gray-600">
            {request.business_type}
          </span>
          <p className="text-sm font-semibold text-gray-900">{request.business_name}</p>
        </div>
        {request.business_description && (
          <p className="text-xs text-gray-500 line-clamp-2">{request.business_description}</p>
        )}
      </div>

      {/* Documents */}
      <div className="flex flex-wrap gap-3">
        <DocLink label="National ID"    url={request.national_id_url} />
        <DocLink label="Passport"       url={request.passport_url} />
        {request.business_type === "company" && (
          <DocLink label="Company Reg." url={request.company_registration_url} />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 border-t border-gray-50 pt-3">
        <span className="text-xs text-gray-400">Submitted {submittedAt}</span>

        {request.status === "PENDING" && (
          <div className="flex gap-2">
            <button
              onClick={onReject}
              disabled={busy}
              className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              Reject
            </button>
            <button
              onClick={onApprove}
              disabled={busy}
              className="rounded-xl bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {busy ? "Approving…" : "Approve"}
            </button>
          </div>
        )}

        {request.status === "REJECTED" && request.rejection_reason && (
          <p className="max-w-xs text-right text-xs text-gray-400 italic">
            &ldquo;{request.rejection_reason}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Page skeleton ────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-gray-100" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-32 animate-pulse rounded bg-gray-100" />
              <div className="h-2.5 w-48 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
          <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
          <div className="flex gap-2">
            <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UpgradeRequestsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const isStaff = user?.role === "ADMIN" || user?.role === "MODERATOR";

  const [requests,   setRequests]   = useState<AdminUpgradeRequest[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState<StatusFilter>("PENDING");
  const [busyId,     setBusyId]     = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminUpgradeRequest | null>(null);
  const [toast,      setToast]      = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [error,      setError]      = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = filter === "ALL" ? {} : { status: filter as "PENDING" | "APPROVED" | "REJECTED" };
      const data = await getAdminUpgradeRequests({ ...params, page_size: 50 });
      setRequests(data.results);
    } catch (e: unknown) {
      setError(
        e instanceof ApiError && e.status === 403 ? "forbidden" :
        e instanceof NetworkError ? "network" :
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { if (isStaff) load(); }, [isStaff, load]);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleApprove(request: AdminUpgradeRequest) {
    setBusyId(request.id);
    try {
      const updated = await approveUpgradeRequest(request.id);
      setRequests((prev) => prev.map((r) => r.id === request.id ? updated : r));
      showToast(`${request.business_name} approved. ${request.username} is now a SELLER.`);
    } catch (e: unknown) {
      showToast(e instanceof ApiError ? e.message : "Failed to approve request.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(request: AdminUpgradeRequest, reason: string) {
    setBusyId(request.id);
    try {
      const updated = await rejectUpgradeRequest(request.id, reason);
      setRequests((prev) => prev.map((r) => r.id === request.id ? updated : r));
      setRejectTarget(null);
      showToast(`Application for "${request.business_name}" rejected.`);
    } catch (e: unknown) {
      showToast(e instanceof ApiError ? e.message : "Failed to reject request.", "error");
    } finally {
      setBusyId(null);
    }
  }

  // ─── Auth loading ───────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="max-w-2xl space-y-4">
        <div className="h-7 w-48 animate-pulse rounded-xl bg-gray-100" />
        <PageSkeleton />
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm font-semibold text-gray-900">Admin access required</p>
        <p className="mt-1 text-xs text-gray-500">Only admins and moderators can access this page.</p>
      </div>
    );
  }

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <>
      <div className="max-w-2xl space-y-5">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900">Seller Applications</h1>
            {pendingCount > 0 && filter !== "PENDING" && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            Review upgrade requests from buyers applying to become sellers.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                filter === tab.value
                  ? "bg-apple-blue text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <PageSkeleton />
        ) : error === "forbidden" ? (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-red-700">Permission denied</p>
            <p className="mt-1 text-xs text-red-400">Try signing out and back in.</p>
          </div>
        ) : error === "network" ? (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-amber-700">Unable to connect to server.</p>
            <button onClick={load} className="mt-2 text-xs font-semibold text-apple-blue hover:underline">Retry →</button>
          </div>
        ) : error === "error" ? (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-red-700">Failed to load applications. Please try again.</p>
            <button onClick={load} className="mt-2 text-xs font-semibold text-apple-blue hover:underline">Retry →</button>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-gray-500">No applications</p>
            <p className="mt-1 text-xs text-gray-400">
              {filter === "PENDING" ? "No pending applications to review." : "Nothing matches this filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                onApprove={() => handleApprove(req)}
                onReject={() => setRejectTarget(req)}
                busy={busyId === req.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed left-1/2 top-4 z-[60] -translate-x-1/2 rounded-xl border px-5 py-3 text-xs font-semibold shadow-lg",
          toast.type === "error"
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-green-200 bg-green-50 text-green-700",
        )}>
          {toast.msg}
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          request={rejectTarget}
          onConfirm={(reason) => handleReject(rejectTarget, reason)}
          onClose={() => setRejectTarget(null)}
          busy={busyId === rejectTarget.id}
        />
      )}
    </>
  );
}
