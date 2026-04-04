import { Skeleton } from "@/components/ui/skeleton";

export default function JobsDashboardLoading() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-64 rounded-xl" />
      {[1, 2, 3].map((n) => (
        <div key={n} className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-64" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-10 w-40 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
