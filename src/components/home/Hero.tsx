import Link from "next/link";
import { ArrowRight } from "lucide-react";
import InstantSearchBar from "@/components/search/InstantSearchBar";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pb-16 pt-20 sm:pb-24 sm:pt-28 lg:pb-32 lg:pt-36">
      {/* Decorative blob */}
      <div
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-brand-100 to-brand-50 opacity-70 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-sm font-medium mb-6 border border-brand-100">
            <span className="flex h-2 w-2 rounded-full bg-brand-600" aria-hidden="true" />
            Zimbabwe&apos;s growing marketplace
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-6xl">
            Buy and Sell Anything{" "}
            <span className="text-brand-600">in Zimbabwe</span>
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-lg leading-8 text-slate-600 max-w-2xl mx-auto">
            Discover thousands of items for sale near you. From electronics and vehicles to
            property and fashion — connect directly with buyers and sellers across Zimbabwe.
          </p>

          {/* Search bar */}
          <div className="mt-10 mx-auto max-w-xl">
            <InstantSearchBar
              placeholder="Search listings in Zimbabwe…"
              inputClassName="py-3.5 text-base"
            />
          </div>

          {/* CTA buttons */}
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sell"
              className="inline-flex items-center gap-2 w-full sm:w-auto justify-center rounded-xl border border-slate-300 bg-white px-7 py-3.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 hover:border-brand-400 transition-all hover:-translate-y-0.5"
            >
              Start Selling
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Trust row */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-400">
            {[
              "Free to list",
              "No hidden fees",
              "Direct buyer contact",
              "10 cities covered",
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400" aria-hidden="true" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
