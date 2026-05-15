import { Skeleton } from "@/components/ui/skeleton";

export default function SchoolDashboardLoading() {
  return (
    <div className="max-w-2xl space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 space-y-4">
          <Skeleton className="h-5 w-40 border-b border-gray-100 pb-3" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ))}
      <Skeleton className="h-11 w-48 rounded-xl" />
    </div>
  );
}
