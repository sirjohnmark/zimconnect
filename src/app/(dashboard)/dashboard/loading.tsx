import {
  DashboardStatsSkeleton,
  InboxPreviewSkeleton,
  ListingGridSkeleton,
  RecentListingsTableSkeleton,
} from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* A — Greeting header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-56 animate-pulse rounded-md bg-slate-200" aria-hidden="true" />
          <div className="h-4 w-36 animate-pulse rounded-md bg-slate-200" aria-hidden="true" />
        </div>
        <div className="h-10 w-36 animate-pulse rounded-lg bg-slate-200" aria-hidden="true" />
      </div>

      {/* B — Seller summary skeleton */}
      <section className="space-y-4">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200" aria-hidden="true" />
        <DashboardStatsSkeleton />
        <RecentListingsTableSkeleton />
      </section>

      {/* C — Inbox preview skeleton */}
      <section className="space-y-4">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200" aria-hidden="true" />
        <InboxPreviewSkeleton />
      </section>

      {/* D — Nearby listings skeleton */}
      <section className="space-y-4">
        <div className="h-4 w-32 animate-pulse rounded bg-slate-200" aria-hidden="true" />
        <ListingGridSkeleton count={4} />
      </section>

      {/* E — Browsed categories / featured fallback skeleton */}
      <section className="space-y-4">
        <div className="h-4 w-40 animate-pulse rounded bg-slate-200" aria-hidden="true" />
        <ListingGridSkeleton count={4} />
      </section>
    </div>
  );
}
