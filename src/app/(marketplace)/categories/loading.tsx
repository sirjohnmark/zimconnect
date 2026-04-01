import { cn } from "@/lib/utils";

function SkeletonCard() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* Icon placeholder */}
      <div className="h-12 w-12 rounded-xl bg-gray-100 animate-pulse" />
      {/* Name placeholder */}
      <div className="h-4 w-20 rounded-md bg-gray-100 animate-pulse" />
      {/* Count placeholder */}
      <div className="h-3 w-14 rounded-md bg-gray-100 animate-pulse" />
    </div>
  );
}

export default function CategoriesLoading() {
  return (
    <div>
      {/* Header skeleton */}
      <div className="mb-6 space-y-2">
        <div className="h-6 w-44 rounded-md bg-gray-100 animate-pulse" />
        <div className="h-4 w-64 rounded-md bg-gray-100 animate-pulse" />
      </div>

      {/* Grid skeleton — same breakpoints as the real grid */}
      <div className={cn("grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4")}>
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
