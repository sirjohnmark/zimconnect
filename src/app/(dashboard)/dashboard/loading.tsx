import { Skeleton } from "@/components/ui/skeleton";

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

function ListingCardSkeleton() {
  return (
    <div className="flex gap-3 rounded-xl border border-gray-100 bg-white p-3">
      <Skeleton className="h-16 w-16 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2 py-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3">
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-3 w-10" />
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Greeting banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 p-5 sm:p-7 space-y-3">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-72" />
        <div className="flex gap-3 pt-1">
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
          <Skeleton className="h-5 w-40 mb-1" />
          <Skeleton className="h-3 w-56 mb-5" />
          <Skeleton className="h-[220px] w-full rounded-xl" />
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
          <Skeleton className="h-5 w-36 mb-1" />
          <Skeleton className="h-3 w-48 mb-5" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left: saved + suggested */}
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 3 }).map((_, i) => <ListingCardSkeleton key={i} />)}
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-40" />
            {Array.from({ length: 3 }).map((_, i) => <ListingCardSkeleton key={i} />)}
          </div>
        </div>

        {/* Right: notifications + inbox */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 space-y-3">
            <Skeleton className="h-5 w-28" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 space-y-3">
            <Skeleton className="h-5 w-24" />
            {Array.from({ length: 3 }).map((_, i) => <ConversationSkeleton key={i} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
