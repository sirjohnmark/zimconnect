import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAllListings, getAllUsers } from "@/lib/queries/admin";
import { moderateListing, suspendUser } from "@/lib/actions/admin";
import type { AdminModerationStatus } from "@/types";

export const metadata: Metadata = { title: "Admin — ZimConnect" };

// ─── Status badge ──────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  active:   "bg-green-100 text-green-800",
  inactive: "bg-yellow-100 text-yellow-800",
  draft:    "bg-slate-100 text-slate-600",
  sold:     "bg-blue-100 text-blue-800",
  expired:  "bg-orange-100 text-orange-800",
  deleted:  "bg-red-100 text-red-700",
  removed:  "bg-red-200 text-red-900",
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${cls}`}>
      {status}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  // Defense-in-depth: verify admin at page level even though middleware gates /admin.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") notFound();

  // ── Data ────────────────────────────────────────────────────────────────
  const [{ listings, total: totalListings }, { users, total: totalUsers }] =
    await Promise.all([getAllListings(1), getAllUsers(1)]);

  const MODERATION_OPTIONS: { value: AdminModerationStatus; label: string }[] = [
    { value: "active",   label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "removed",  label: "Removed" },
  ];

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-12">

        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {totalListings.toLocaleString()} listings · {totalUsers.toLocaleString()} users
          </p>
        </div>

        {/* ══ LISTINGS TABLE ══════════════════════════════════════════════ */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Listings
            <span className="ml-2 text-sm font-normal text-slate-400">
              (showing {listings.length} of {totalListings})
            </span>
          </h2>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["Title", "Seller", "Status", "Created", "Moderate"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                      No listings found.
                    </td>
                  </tr>
                ) : (
                  listings.map((listing) => (
                    <tr key={listing.id} className="hover:bg-slate-50 transition-colors">
                      {/* Title */}
                      <td className="px-4 py-3 max-w-xs">
                        <a
                          href={`/listing/${listing.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-slate-800 hover:text-brand-600 transition-colors line-clamp-1"
                        >
                          {listing.title}
                        </a>
                        <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                          {listing.id}
                        </p>
                      </td>

                      {/* Seller */}
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {listing.seller?.display_name ?? listing.seller?.username ?? (
                          <span className="text-slate-400 italic">unknown</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={listing.status} />
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                        {new Date(listing.created_at).toLocaleDateString("en-ZW", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Moderate form */}
                      <td className="px-4 py-3">
                        <form action={moderateListing} className="flex items-center gap-2">
                          <input type="hidden" name="id" value={listing.id} />
                          <select
                            name="status"
                            defaultValue={
                              MODERATION_OPTIONS.find((o) => o.value === listing.status)
                                ? listing.status
                                : "active"
                            }
                            className="rounded-lg border border-slate-300 bg-white py-1.5 pl-2 pr-7 text-xs text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                          >
                            {MODERATION_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="submit"
                            className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition-colors"
                          >
                            Apply
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ══ USERS TABLE ════════════════════════════════════════════════ */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Users
            <span className="ml-2 text-sm font-normal text-slate-400">
              (showing {users.length} of {totalUsers})
            </span>
          </h2>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["User", "Role", "Listings", "Joined", "Status", "Action"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      {/* User */}
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{u.display_name}</p>
                        <p className="text-xs text-slate-400">@{u.username}</p>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                            u.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      {/* Listings count */}
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 tabular-nums">
                        {u.listings_count}
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                        {new Date(u.created_at).toLocaleDateString("en-ZW", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Suspended badge */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {u.is_suspended ? (
                          <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                            Active
                          </span>
                        )}
                      </td>

                      {/* Suspend / unsuspend form — skip self */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {u.id === user.id ? (
                          <span className="text-xs text-slate-400 italic">you</span>
                        ) : (
                          <form action={suspendUser}>
                            <input type="hidden" name="id" value={u.id} />
                            <input
                              type="hidden"
                              name="suspend"
                              value={u.is_suspended ? "false" : "true"}
                            />
                            <button
                              type="submit"
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                                u.is_suspended
                                  ? "bg-green-600 text-white hover:bg-green-700"
                                  : "bg-red-600 text-white hover:bg-red-700"
                              }`}
                            >
                              {u.is_suspended ? "Unsuspend" : "Suspend"}
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
