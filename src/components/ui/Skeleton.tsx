// Skeleton primitives and composed dashboard skeletons.
// All components are purely presentational — no props required.

// ---------------------------------------------------------------------------
// Base pulse block
// ---------------------------------------------------------------------------
function Pulse({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200 ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

// ---------------------------------------------------------------------------
// Stat card skeleton — mirrors the 4 stat cards in the dashboard
// ---------------------------------------------------------------------------
function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
      <Pulse className="h-3 w-20" />
      <Pulse className="h-7 w-12" />
      <Pulse className="h-3 w-16" />
    </div>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inbox row skeleton — 3 rows for the preview panel
// ---------------------------------------------------------------------------
function InboxRowSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-4 border-b border-slate-100 last:border-0">
      <Pulse className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between gap-4">
          <Pulse className="h-3 w-28" />
          <Pulse className="h-3 w-10" />
        </div>
        <Pulse className="h-3 w-40" />
        <Pulse className="h-3 w-full max-w-xs" />
      </div>
    </div>
  );
}

export function InboxPreviewSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100">
      {Array.from({ length: 3 }).map((_, i) => (
        <InboxRowSkeleton key={i} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Listing card skeleton — used for nearby + browsed category sections
// ---------------------------------------------------------------------------
function ListingCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <Pulse className="aspect-video w-full" />
      <div className="p-3 space-y-2">
        <Pulse className="h-3 w-full" />
        <Pulse className="h-3 w-3/4" />
        <div className="flex justify-between pt-1">
          <Pulse className="h-4 w-16" />
          <Pulse className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

export function ListingGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Table row skeleton — for the recent listings mini-table in section B
// ---------------------------------------------------------------------------
function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 last:border-0">
      <Pulse className="h-3 flex-1 max-w-xs" />
      <Pulse className="h-3 w-10" />
      <Pulse className="h-5 w-14 rounded-full" />
      <Pulse className="h-7 w-14 rounded-md" />
    </div>
  );
}

export function RecentListingsTableSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {Array.from({ length: 3 }).map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </div>
  );
}
