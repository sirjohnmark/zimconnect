import { redirect } from "next/navigation";
import Link from "next/link";
import {
  PlusCircle,
  Eye,
  Pencil,
  MapPin,
  MessageSquare,
  ArrowRight,
  Package,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfileById } from "@/lib/queries/profiles";
import {
  getActiveListingsSummary,
  getNearbyListings,
  getListingsInBrowsedCategories,
  getInboxPreview,
} from "@/lib/queries/dashboard";
import { getFeaturedListings } from "@/lib/queries/listings";
import ConversationRow from "@/components/messages/ConversationRow";
import ListingCard from "@/components/listings/ListingCard";
import Badge from "@/components/ui/Badge";

export const metadata = { title: "Dashboard — ZimConnect" };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function greeting(name: string): string {
  const h = new Date().getHours();
  const salutation =
    h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return `${salutation}, ${name}`;
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-ZW", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfileById(user.id);

  const displayName =
    profile?.display_name ??
    profile?.username ??
    user.email?.split("@")[0] ??
    "there";

  const city = profile?.location?.trim() ?? "";

  const [summary, nearby, browsed, inbox, fallbackListings] = await Promise.all(
    [
      getActiveListingsSummary(user.id).catch(() => null),
      city
        ? getNearbyListings(city, user.id).catch(() => [])
        : Promise.resolve([]),
      getListingsInBrowsedCategories(user.id).catch(() => []),
      getInboxPreview(user.id).catch(() => ({
        conversations: [],
        total_unread: 0,
      })),
      getListingsInBrowsedCategories(user.id)
        .then((b) => (b.flatMap((g) => g.listings).length === 0 ? getFeaturedListings(8) : []))
        .catch(() => getFeaturedListings(8).catch(() => [])),
    ]
  );

  const browsedListings = browsed.flatMap((g) => g.listings);
  const showFallback = browsedListings.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* ------------------------------------------------------------------ */}
      {/* A — Greeting header                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting(displayName)}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {city && (
              <span className="inline-flex items-center gap-1 mr-2">
                <MapPin className="w-3.5 h-3.5" />
                {city}
                {" · "}
              </span>
            )}
            {formatDate()}
          </p>
        </div>
        <Link
          href="/sell"
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Post a listing
        </Link>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* B — Seller summary                                                  */}
      {/* ------------------------------------------------------------------ */}
      {summary && (
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-slate-700">
            Your listings
          </h2>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total" value={summary.total} />
            <StatCard label="Active" value={summary.active} accent="green" />
            <StatCard label="Inactive" value={summary.inactive} />
            <StatCard label="Views" value={summary.total_views} />
          </div>

          {/* Recent active listings mini-table */}
          {summary.recent.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  Recent active listings
                </span>
                <Link
                  href="/listings"
                  className="text-xs text-green-600 hover:underline inline-flex items-center gap-1"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {summary.recent.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 last:border-0"
                >
                  <span className="flex-1 text-sm text-slate-800 truncate max-w-xs">
                    {row.title}
                  </span>
                  <span className="text-xs text-slate-500 shrink-0 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {row.views_count.toLocaleString()}
                  </span>
                  <Badge variant="success">
                    {row.status}
                  </Badge>
                  <Link
                    href={`/listings/${row.id}/edit`}
                    className="shrink-0 inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          )}

          {summary.total === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">
                You haven&apos;t posted any listings yet.
              </p>
              <Link
                href="/sell"
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Post your first listing
              </Link>
            </div>
          )}
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* C — Inbox preview                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-700 inline-flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Messages
            {inbox.total_unread > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold w-5 h-5">
                {inbox.total_unread > 9 ? "9+" : inbox.total_unread}
              </span>
            )}
          </h2>
          <Link
            href="/inbox"
            className="text-xs text-green-600 hover:underline inline-flex items-center gap-1"
          >
            Open inbox <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {inbox.conversations.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white py-10 text-center">
            <p className="text-sm text-slate-500">No messages yet.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100">
            {inbox.conversations.map((conv) => (
              <ConversationRow key={conv.id} conversation={conv} currentUserId={user.id} />
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* D — Nearby listings                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-700 inline-flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {city ? `Near you in ${city}` : "Listings near you"}
          </h2>
        </div>

        {!city ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center">
            <MapPin className="w-6 h-6 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">
              Add your city in{" "}
              <Link href="/settings" className="text-green-600 hover:underline">
                settings
              </Link>{" "}
              to see nearby listings.
            </p>
          </div>
        ) : nearby.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white py-10 text-center">
            <p className="text-sm text-slate-500">
              No active listings in {city} right now.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {nearby.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* E — Based on browsing / Featured fallback                           */}
      {/* ------------------------------------------------------------------ */}
      {showFallback ? (
        fallbackListings.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-base font-semibold text-slate-700">
              Featured listings
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {fallbackListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </section>
        )
      ) : (
        <section className="space-y-6">
          <h2 className="text-base font-semibold text-slate-700">
            Based on your browsing
          </h2>
          {browsed.map((group) => (
            <div key={group.category.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                  {group.category.icon && (
                    <span aria-hidden="true">{group.category.icon}</span>
                  )}
                  {group.category.name}
                </h3>
                <Link
                  href={`/category/${group.category.slug}`}
                  className="text-xs text-green-600 hover:underline inline-flex items-center gap-1"
                >
                  See all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {group.listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card sub-component
// ---------------------------------------------------------------------------
function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "green";
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-1">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        {label}
      </p>
      <p
        className={`text-2xl font-bold ${
          accent === "green" ? "text-green-600" : "text-slate-900"
        }`}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}
