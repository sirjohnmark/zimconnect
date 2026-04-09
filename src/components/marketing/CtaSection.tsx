import Link from "next/link";

export function CtaSection() {
  return (
    <section className="bg-gray-50 py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-600 px-8 py-14 text-center shadow-xl sm:px-14">

          {/* Badge */}
          <span className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white mb-6">
            Free to list
          </span>

          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Start selling today
          </h2>
          <p className="mt-4 text-lg text-emerald-100 max-w-xl mx-auto">
            Join thousands of sellers already earning on Sanganai.
            Post your first listing in under 2 minutes — no fees, no hassle.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row justify-center">
            <Link
              href="/register"
              className="rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-emerald-700 shadow hover:bg-emerald-50 active:scale-[0.97] transition-all duration-75"
            >
              Get Started — It&apos;s Free
            </Link>
            <Link
              href="/listings"
              className="rounded-xl border border-white/30 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/20 active:scale-[0.97] transition-all duration-75"
            >
              Browse Listings
            </Link>
          </div>

          {/* Social proof micro-copy */}
          <p className="mt-6 text-xs text-emerald-200">
            No credit card required · Free to list · Join 12,000+ sellers
          </p>
        </div>
      </div>
    </section>
  );
}
