function SkeletonCard() {
  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="aspect-[4/3] w-full bg-gray-100 animate-pulse" />
      <div className="p-4 space-y-2.5">
        <div className="h-4 w-3/4 rounded bg-gray-100 animate-pulse" />
        <div className="h-4 w-1/2 rounded bg-gray-100 animate-pulse" />
        <div className="h-5 w-1/3 rounded bg-gray-100 animate-pulse" />
        <div className="h-3 w-2/5 rounded bg-gray-100 animate-pulse" />
      </div>
    </div>
  );
}

export default function ListingsLoading() {
  return (
    <div>
      {/* Toolbar skeleton */}
      <div className="mb-5 h-7 w-48 rounded-md bg-gray-100 animate-pulse" />
      {/* Search skeleton */}
      <div className="mb-6 h-10 w-full rounded-lg bg-gray-100 animate-pulse" />
      {/* Grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
