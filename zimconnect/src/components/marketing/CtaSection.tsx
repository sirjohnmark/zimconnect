import Link from "next/link";

export function CtaSection() {
  return (
    <section className="bg-light-gray py-14 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-near-black px-8 py-14 text-center sm:px-14" style={{ boxShadow: "rgba(0,0,0,0.22) 3px 5px 30px 0px" }}>

          {/* Badge */}
          <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white mb-6">
            Free to list
          </span>

          <h2 className="text-3xl font-semibold text-white sm:text-[40px] tracking-tight">
            Start selling today
          </h2>
          <p className="mt-4 text-lg text-[rgba(255,255,255,0.7)] max-w-xl mx-auto font-normal">
            Join thousands of sellers already earning on Sanganai.
            Post your first listing in under 2 minutes — no fees, no hassle.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row justify-center">
            <Link
              href="/register"
              className="rounded-full bg-apple-blue px-8 py-3 text-[17px] font-normal text-white hover:opacity-90 transition-opacity"
            >
              Get Started Now
            </Link>
            <Link
              href="/listings"
              className="rounded-full border border-white/30 px-8 py-3 text-[17px] font-normal text-white hover:bg-white/10 transition-colors"
            >
              Browse Listings
            </Link>
          </div>

          <p className="mt-6 text-xs text-[rgba(255,255,255,0.48)]">
            No credit card required · Free to list · Join 12,000+ sellers
          </p>
        </div>
      </div>
    </section>
  );
}
