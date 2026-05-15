import { Skeleton } from "@/components/ui/skeleton";

export default function AboutLoading() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="py-16 sm:py-24 bg-light-gray">
        <div className="mx-auto max-w-3xl px-4 text-center space-y-4">
          <Skeleton className="h-6 w-36 rounded-full mx-auto" />
          <Skeleton className="h-10 w-4/5 mx-auto" />
          <Skeleton className="h-10 w-3/5 mx-auto" />
          <Skeleton className="h-5 w-full max-w-xl mx-auto" />
          <div className="flex justify-center gap-3 pt-2">
            <Skeleton className="h-11 w-36 rounded-xl" />
            <Skeleton className="h-11 w-32 rounded-xl" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-100 py-10">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 text-center">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2 flex flex-col items-center">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="space-y-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="rounded-2xl h-56" />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 space-y-10">
          <div className="text-center space-y-2">
            <Skeleton className="h-3 w-28 mx-auto" />
            <Skeleton className="h-8 w-40 mx-auto" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
                <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 space-y-10">
          <div className="text-center space-y-2">
            <Skeleton className="h-3 w-20 mx-auto" />
            <Skeleton className="h-8 w-36 mx-auto" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-6 shadow-sm gap-3">
                <Skeleton className="h-14 w-14 rounded-full" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
