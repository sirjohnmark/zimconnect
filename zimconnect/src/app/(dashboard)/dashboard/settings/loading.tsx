import { Skeleton } from "@/components/ui/skeleton";

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 sm:p-6 space-y-4">
      <div className="space-y-1 pb-2 border-b border-gray-100">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-64" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="space-y-1 flex-1">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-52" />
          </div>
          <Skeleton className="h-6 w-11 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}

export default function SettingsLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-2xl space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-60" />
      </div>

      {/* Password section */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 sm:p-6 space-y-4">
        <div className="space-y-1 pb-2 border-b border-gray-100">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-56" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      <SectionSkeleton rows={3} />
      <SectionSkeleton rows={2} />
      <SectionSkeleton rows={2} />

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-100 bg-red-50/40 p-5 sm:p-6 space-y-3">
        <Skeleton className="h-5 w-28 bg-red-100" />
        <div className="flex gap-3">
          <Skeleton className="h-9 w-36 rounded-xl bg-red-100" />
          <Skeleton className="h-9 w-32 rounded-xl bg-red-100" />
        </div>
      </div>
    </div>
  );
}
