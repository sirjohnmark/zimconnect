import { Skeleton } from "@/components/ui/skeleton";

export default function ContactLoading() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="py-14 sm:py-20 bg-light-gray">
        <div className="mx-auto max-w-3xl px-4 text-center space-y-4">
          <Skeleton className="h-6 w-28 rounded-full mx-auto" />
          <Skeleton className="h-10 w-3/5 mx-auto" />
          <Skeleton className="h-5 w-full max-w-lg mx-auto" />
        </div>
      </section>

      {/* Channel cards */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 space-y-3">
                <Skeleton className="h-11 w-11 rounded-xl" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-8 w-28 rounded-lg mt-2" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form + FAQ */}
      <section className="py-12 bg-gray-50">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid gap-10 lg:grid-cols-2">
            {/* Form */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 sm:p-8 space-y-5">
              <div className="space-y-1">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-4 w-56" />
              </div>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className={`w-full rounded-xl ${i === 3 ? "h-28" : "h-10"}`} />
                </div>
              ))}
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>

            {/* FAQ */}
            <div className="space-y-3">
              <Skeleton className="h-6 w-32 mb-4" />
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-gray-100 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-5 w-5 shrink-0 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
