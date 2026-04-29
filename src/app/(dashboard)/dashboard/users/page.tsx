"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth/useAuth";
import { getUsers, updateUserAdmin } from "@/lib/api/users";
import type { AdminUser } from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

// ─── Role badge ───────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  ADMIN:     "bg-purple-100 text-purple-700",
  MODERATOR: "bg-indigo-100 text-indigo-700",
  SELLER:    "bg-blue-100 text-blue-700",
  BUYER:     "bg-gray-100 text-gray-600",
};

const ROLES: AdminUser["role"][] = ["BUYER", "SELLER", "MODERATOR", "ADMIN"];

type RoleFilter = "ALL" | AdminUser["role"];

const ROLE_TABS: { label: string; value: RoleFilter }[] = [
  { label: "All",       value: "ALL"       },
  { label: "Sellers",   value: "SELLER"    },
  { label: "Buyers",    value: "BUYER"     },
  { label: "Admins",    value: "ADMIN"     },
  { label: "Moderators",value: "MODERATOR" },
];

// ─── User row ─────────────────────────────────────────────────────────────────

function UserRow({
  user,
  onToggleActive,
  onChangeRole,
  busy,
}: {
  user: AdminUser;
  onToggleActive: () => void;
  onChangeRole: (role: AdminUser["role"]) => void;
  busy: boolean;
}) {
  const initials = `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase() || user.username.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
      {/* Avatar */}
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-apple-blue/10 text-sm font-bold text-apple-blue overflow-hidden">
        {user.profile_picture ? (
          <Image src={user.profile_picture} alt={user.username} fill className="object-cover" />
        ) : (
          initials
        )}
      </div>

      {/* Name + email */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-gray-900">
            {user.first_name} {user.last_name}
          </p>
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", ROLE_COLORS[user.role] ?? "bg-gray-100 text-gray-600")}>
            {user.role}
          </span>
          {user.is_verified && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Verified</span>
          )}
          {!user.is_active && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">Inactive</span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-gray-500">
          @{user.username} · {user.email}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">
          Joined {new Date(user.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        <select
          value={user.role}
          onChange={(e) => onChangeRole(e.target.value as AdminUser["role"])}
          disabled={busy}
          className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-apple-blue disabled:opacity-50"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button
          onClick={onToggleActive}
          disabled={busy}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
            user.is_active
              ? "border-red-200 text-red-600 hover:bg-red-50"
              : "border-green-200 text-green-600 hover:bg-green-50",
          )}
        >
          {user.is_active ? "Deactivate" : "Activate"}
        </button>
      </div>
    </div>
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
  const [toast,       setToast]       = useState("");
  const [busyId,      setBusyId]      = useState<number | null>(null);

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
      setError(e instanceof ApiError && e.status === 403 ? "forbidden" : "unavailable");
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search, page]);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function handleChangeRole(user: AdminUser, role: AdminUser["role"]) {
    if (role === user.role) return;
    if (!confirm(`Change ${user.username}'s role from ${user.role} to ${role}?`)) return;
    setBusyId(user.id);
    try {
      await updateUserAdmin(user.id, { role });
      showToast(`${user.username} role changed to ${role}.`);
      load();
    } catch (e: unknown) {
      setError(e instanceof ApiError && e.status === 403
        ? "Permission denied. Your admin session may have expired — try reloading."
        : "Failed to update user role.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleActive(user: AdminUser) {
    setBusyId(user.id);
    try {
      await updateUserAdmin(user.id, { is_active: !user.is_active });
      showToast(user.is_active ? `${user.username} deactivated.` : `${user.username} activated.`);
      load();
    } catch (e: unknown) {
      setError(e instanceof ApiError && e.status === 403
        ? "Permission denied. Your admin session may have expired — try reloading."
        : "Failed to update user.");
    } finally {
      setBusyId(null);
    }
  }

  if (authLoading) {
    return (
      <div className="max-w-4xl space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
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
        <h1 className="text-lg font-semibold text-gray-900">User Management</h1>
        <p className="mt-0.5 text-xs text-gray-500">View, search, manage roles, and activate or deactivate user accounts.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
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
          className="flex gap-2 ml-auto"
        >
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search users…"
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

      {!loading && !error && (
        <p className="text-xs text-gray-400">{totalCount.toLocaleString()} user{totalCount !== 1 ? "s" : ""}</p>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
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
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">No users match this filter.</div>
        ) : (
          users.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              busy={busyId === u.id}
              onToggleActive={() => handleToggleActive(u)}
              onChangeRole={(role) => handleChangeRole(u, role)}
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
    </div>
  );
}
