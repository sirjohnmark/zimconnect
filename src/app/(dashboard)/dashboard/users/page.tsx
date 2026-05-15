"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth/useAuth";
import { getUsers, updateUserAdmin, deleteUser } from "@/lib/api/users";
import type { AdminUser } from "@/lib/api/users";
import { ApiError, NetworkError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLES: AdminUser["role"][] = ["BUYER", "SELLER", "MODERATOR", "ADMIN"];

const ROLE_COLORS: Record<string, string> = {
  ADMIN:     "bg-purple-100 text-purple-700",
  MODERATOR: "bg-indigo-100 text-indigo-700",
  SELLER:    "bg-blue-100 text-blue-700",
  BUYER:     "bg-gray-100 text-gray-600",
};

type RoleFilter = "ALL" | AdminUser["role"];

const ROLE_TABS: { label: string; value: RoleFilter }[] = [
  { label: "All",        value: "ALL"       },
  { label: "Sellers",    value: "SELLER"    },
  { label: "Buyers",     value: "BUYER"     },
  { label: "Admins",     value: "ADMIN"     },
  { label: "Moderators", value: "MODERATOR" },
];

// ─── Delete confirmation modal ────────────────────────────────────────────────

function DeleteModal({
  user,
  onConfirm,
  onCancel,
  busy,
}: {
  user: AdminUser;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 text-red-600">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-gray-900">Delete account?</h2>
        <p className="mt-1.5 text-sm text-gray-500">
          This will permanently delete{" "}
          <span className="font-semibold text-gray-800">@{user.username}</span>
          {" "}and all their data. This cannot be undone.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── View / edit user modal ───────────────────────────────────────────────────

function ViewModal({
  user,
  onClose,
  onSuspend,
  onActivate,
  onChangeRole,
  busy,
}: {
  user: AdminUser;
  onClose: () => void;
  onSuspend: () => void;
  onActivate: () => void;
  onChangeRole: (role: AdminUser["role"]) => void;
  busy: boolean;
}) {
  const [localRole, setLocalRole] = useState<AdminUser["role"]>(user.role);
  const roleChanged = localRole !== user.role;

  useEffect(() => { setLocalRole(user.role); }, [user.role]);

  const initials =
    `${(user.first_name ?? "").charAt(0)}${(user.last_name ?? "").charAt(0)}`.toUpperCase() ||
    (user.username ?? "?").charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">User Details</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5 space-y-5">
          {/* Avatar + core info */}
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-apple-blue/10 text-xl font-bold text-apple-blue overflow-hidden">
              {user.profile_picture ? (
                <Image src={user.profile_picture} alt={user.username} fill className="object-cover" />
              ) : initials}
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-gray-900">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-sm text-gray-500">@{user.username}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", ROLE_COLORS[user.role] ?? "bg-gray-100 text-gray-600")}>
                  {user.role}
                </span>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", user.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                  {user.is_active ? "Active" : "Suspended"}
                </span>
                {user.is_verified && (
                  <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700">Verified</span>
                )}
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div className="rounded-xl border border-gray-100 divide-y divide-gray-50">
            <DetailRow label="Email"  value={user.email} />
            {user.phone    && <DetailRow label="Phone"    value={user.phone} />}
            {user.location && <DetailRow label="Location" value={user.location} />}
            {user.bio      && <DetailRow label="Bio"      value={user.bio} />}
            <DetailRow label="Joined" value={new Date(user.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} />
            <DetailRow label="Email verified" value={user.email_verified ? "Yes" : "No"} />
            {user.phone && <DetailRow label="Phone verified" value={user.phone_verified ? "Yes" : "No"} />}
          </div>

          {/* Role change */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Change Role</label>
            <select
              value={localRole}
              onChange={(e) => setLocalRole(e.target.value as AdminUser["role"])}
              disabled={busy}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-apple-blue disabled:opacity-50"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {roleChanged && (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setLocalRole(user.role)}
                  disabled={busy}
                  className="flex-1 rounded-xl border border-gray-200 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onChangeRole(localRole)}
                  disabled={busy}
                  className="flex-1 rounded-xl bg-apple-blue py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {busy ? "Saving…" : `Set ${localRole}`}
                </button>
              </div>
            )}
          </div>

          {/* Suspend / Activate */}
          <button
            onClick={user.is_active ? onSuspend : onActivate}
            disabled={busy}
            className={cn(
              "w-full rounded-xl border py-2.5 text-sm font-semibold transition-colors disabled:opacity-50",
              user.is_active
                ? "border-red-200 text-red-600 hover:bg-red-50"
                : "border-green-200 text-green-600 hover:bg-green-50",
            )}
          >
            {busy ? "Updating…" : user.is_active ? "Suspend Account" : "Activate Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2.5">
      <span className="shrink-0 text-xs font-semibold text-gray-400">{label}</span>
      <span className="text-right text-xs text-gray-700 break-all">{value}</span>
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
              <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-gray-100" />
              <div className="space-y-1.5">
                <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
                <div className="h-2.5 w-16 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          </td>
          <td className="px-4 py-3"><div className="h-3 w-36 animate-pulse rounded bg-gray-100" /></td>
          <td className="px-4 py-3"><div className="h-5 w-14 animate-pulse rounded-full bg-gray-100" /></td>
          <td className="px-4 py-3"><div className="h-5 w-16 animate-pulse rounded-full bg-gray-100" /></td>
          <td className="px-4 py-3"><div className="h-3 w-20 animate-pulse rounded bg-gray-100" /></td>
          <td className="px-4 py-3">
            <div className="flex gap-2">
              <div className="h-7 w-7 animate-pulse rounded-lg bg-gray-100" />
              <div className="h-7 w-7 animate-pulse rounded-lg bg-gray-100" />
              <div className="h-7 w-7 animate-pulse rounded-lg bg-gray-100" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "MODERATOR";

  const [users,       setUsers]       = useState<AdminUser[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [roleFilter,  setRoleFilter]  = useState<RoleFilter>("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [search,      setSearch]      = useState("");
  const [page,        setPage]        = useState(1);
  const [totalCount,  setTotalCount]  = useState(0);
  const [error,       setError]       = useState("");
  const [toast,       setToast]       = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [busyId,      setBusyId]      = useState<number | null>(null);

  const [viewUser,   setViewUser]   = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page,
        page_size: PAGE_SIZE,
        ...(roleFilter !== "ALL" ? { role: roleFilter } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      };
      const data = await getUsers(params);
      setUsers(data.results);
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
  }, [roleFilter, search, page]);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSuspend(user: AdminUser) {
    setBusyId(user.id);
    try {
      const updated = await updateUserAdmin(user.id, { is_active: false });
      setUsers((prev) => prev.map((u) => u.id === user.id ? updated : u));
      if (viewUser?.id === user.id) setViewUser(updated);
      showToast(`${user.username} suspended.`);
    } catch (e: unknown) {
      showToast(e instanceof ApiError && e.status === 403 ? "Permission denied." : "Failed to suspend user.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleActivate(user: AdminUser) {
    setBusyId(user.id);
    try {
      const updated = await updateUserAdmin(user.id, { is_active: true });
      setUsers((prev) => prev.map((u) => u.id === user.id ? updated : u));
      if (viewUser?.id === user.id) setViewUser(updated);
      showToast(`${user.username} activated.`);
    } catch (e: unknown) {
      showToast(e instanceof ApiError && e.status === 403 ? "Permission denied." : "Failed to activate user.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleChangeRole(user: AdminUser, role: AdminUser["role"]) {
    if (role === user.role) return;
    console.log("[users] handleChangeRole", { userId: user.id, from: user.role, to: role });
    setBusyId(user.id);
    try {
      const updated = await updateUserAdmin(user.id, { role });
      console.log("[users] role change success →", updated.role);
      setUsers((prev) => prev.map((u) => u.id === user.id ? updated : u));
      if (viewUser?.id === user.id) setViewUser(updated);
      showToast(`${user.username} role changed to ${role}.`);
    } catch (e: unknown) {
      console.error("[users] role change failed", e);
      showToast(e instanceof ApiError && e.status === 403 ? "Permission denied." : "Failed to change role.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(user: AdminUser) {
    setBusyId(user.id);
    try {
      await deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setTotalCount((n) => n - 1);
      setDeleteTarget(null);
      setViewUser(null);
      showToast(`@${user.username} deleted.`);
    } catch (e: unknown) {
      showToast(e instanceof ApiError && e.status === 403 ? "Permission denied." : "Failed to delete user.", "error");
      setBusyId(null);
    }
  }

  // ─── Auth loading ─────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="max-w-5xl space-y-4">
        <div className="h-8 w-44 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-gray-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
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
          <h1 className="text-lg font-semibold text-gray-900">User Management</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            View, search, suspend, and delete user accounts.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1">
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setRoleFilter(tab.value); setPage(1); }}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                  roleFilter === tab.value
                    ? "bg-apple-blue text-white"
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
                placeholder="Search users…"
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

        {/* Count */}
        {!loading && !error && (
          <p className="text-xs text-gray-400">
            {totalCount.toLocaleString()} user{totalCount !== 1 ? "s" : ""}
          </p>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Joined</th>
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
                      <p className="text-sm font-semibold text-red-700">Failed to load users. Please try again.</p>
                      <button onClick={load} className="mt-2 text-xs font-semibold text-apple-blue hover:underline">Retry →</button>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-sm text-gray-400">
                      No users match this filter.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const initials =
                      `${(u.first_name ?? "").charAt(0)}${(u.last_name ?? "").charAt(0)}`.toUpperCase() ||
                      (u.username ?? "?").charAt(0).toUpperCase();
                    const isBusy = busyId === u.id;

                    return (
                      <tr
                        key={u.id}
                        className={cn(
                          "group transition-colors hover:bg-gray-50/70",
                          isBusy && "opacity-60",
                        )}
                      >
                        {/* User */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-apple-blue/10 text-xs font-bold text-apple-blue">
                              {u.profile_picture ? (
                                <Image src={u.profile_picture} alt={u.username} fill className="object-cover" />
                              ) : initials}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-gray-900">
                                {u.first_name || u.last_name
                                  ? `${u.first_name} ${u.last_name}`.trim()
                                  : u.username}
                              </p>
                              <p className="truncate text-[11px] text-gray-400">@{u.username}</p>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-4 py-3">
                          <span className="max-w-[180px] truncate text-xs text-gray-600 block">{u.email}</span>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-3">
                          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", ROLE_COLORS[u.role] ?? "bg-gray-100 text-gray-600")}>
                            {u.role}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600",
                          )}>
                            {u.is_active ? "Active" : "Suspended"}
                          </span>
                        </td>

                        {/* Joined */}
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-400">
                            {new Date(u.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View */}
                            <button
                              onClick={() => setViewUser(u)}
                              title="View details"
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                            >
                              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                                <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41Z" clipRule="evenodd" />
                              </svg>
                            </button>

                            {/* Suspend / Activate */}
                            {u.is_active ? (
                              <button
                                onClick={() => handleSuspend(u)}
                                disabled={isBusy}
                                title="Suspend user"
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-amber-500 hover:bg-amber-50 disabled:opacity-50 transition-colors"
                              >
                                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8 7a1 1 0 0 0-1 1v4a1 1 0 1 0 2 0V8a1 1 0 0 0-1-1Zm4 0a1 1 0 0 0-1 1v4a1 1 0 1 0 2 0V8a1 1 0 0 0-1-1Z" clipRule="evenodd" />
                                </svg>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivate(u)}
                                disabled={isBusy}
                                title="Activate user"
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-green-600 hover:bg-green-50 disabled:opacity-50 transition-colors"
                              >
                                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                                </svg>
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => setDeleteTarget(u)}
                              disabled={isBusy}
                              title="Delete user"
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors"
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

      {/* Toast — fixed above all modals */}
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

      {/* View modal */}
      {viewUser && (
        <ViewModal
          user={viewUser}
          onClose={() => setViewUser(null)}
          onSuspend={() => handleSuspend(viewUser)}
          onActivate={() => handleActivate(viewUser)}
          onChangeRole={(role) => handleChangeRole(viewUser, role)}
          busy={busyId === viewUser.id}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteModal
          user={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
          busy={busyId === deleteTarget.id}
        />
      )}
    </>
  );
}
