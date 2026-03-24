import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative isolate overflow-hidden rounded-3xl bg-brand-600 px-8 py-16 text-center shadow-2xl sm:px-16">
          {/* Decorative radial glow */}
          <svg
            viewBox="0 0 1024 1024"
            className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-x-1/2 -translate-y-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]"
            aria-hidden="true"
          >
            <circle cx="512" cy="512" r="512" fill="url(#cta-glow)" fillOpacity="0.5" />
            <defs>
              <radialGradient id="cta-glow">
                <stop stopColor="#a5b4fc" />
                <stop offset="1" stopColor="#6366f1" />
              </radialGradient>
            </defs>
          </svg>

          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to sell?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-brand-100">
            Join thousands of Zimbabweans already buying and selling on ZimConnect. It&apos;s
            free, fast, and takes less than a minute to post your first listing.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sell"
              className="inline-flex items-center gap-2 w-full sm:w-auto justify-center rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-brand-600 shadow-sm hover:bg-brand-50 transition-all hover:-translate-y-0.5"
            >
              Start Selling Today
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1 text-sm font-semibold text-white/80 hover:text-white transition-colors group"
            >
              Create a free account
              <span
                aria-hidden="true"
                className="inline-block transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
