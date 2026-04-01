import Link from "next/link";

export function CtaSection() {
  return (
    <section className="bg-gray-50 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl lg:text-4xl">
          Ready to start selling?
        </h2>
        <p className="mt-4 text-gray-500 text-lg">
          Join thousands of sellers already earning on ZimConnect.
          It&apos;s free to list — no hidden fees.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row justify-center">
          <Link
            href="/register"
            className="rounded-lg bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-[0.96] active:bg-emerald-800 transition-all duration-75 shadow-sm"
          >
            Post a Listing — It&apos;s Free
          </Link>
          <Link
            href="/listings"
            className="rounded-lg border border-gray-300 bg-white px-8 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 active:scale-[0.96] active:bg-gray-200 transition-all duration-75 shadow-sm"
          >
            Browse Listings
          </Link>
        </div>
      </div>
    </section>
  );
}
