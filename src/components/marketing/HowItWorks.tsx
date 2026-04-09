import Link from "next/link";

const STEPS = [
  {
    number: "01",
    title: "Create an Account",
    description: "Sign up free in under a minute. No credit card required — just your name and email.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
    cta: { label: "Create account", href: "/register" },
  },
  {
    number: "02",
    title: "Post Your Listing",
    description: "Add photos, set your price, and publish in minutes. Reach thousands of active buyers instantly.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
      </svg>
    ),
    cta: { label: "Post a listing", href: "/dashboard/listings/create" },
  },
  {
    number: "03",
    title: "Connect with Buyers",
    description: "Receive calls and WhatsApp messages directly. Negotiate, agree, and close the deal.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
      </svg>
    ),
    cta: { label: "Browse listings", href: "/listings" },
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-2">Simple process</p>
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">How It Works</h2>
          <p className="mt-3 text-gray-500 max-w-xl mx-auto">
            Buying and selling on Sanganai is simple, fast, and free to start.
          </p>
        </div>

        {/* Steps */}
        <div className="relative grid gap-6 sm:grid-cols-3">
          {/* Connecting line (desktop) */}
          <div className="pointer-events-none absolute top-10 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] hidden h-px bg-gradient-to-r from-emerald-200 via-emerald-300 to-emerald-200 sm:block" aria-hidden="true" />

          {STEPS.map(({ number, title, description, icon, cta }) => (
            <div
              key={number}
              className="relative flex flex-col rounded-2xl border border-gray-100 bg-gray-50 p-6 sm:items-center sm:text-center"
            >
              {/* Step number badge */}
              <div className="relative z-10 mb-5 flex h-20 w-20 sm:mx-auto items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  {icon}
                </div>
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white shadow">
                  {number.replace("0", "")}
                </span>
              </div>

              <h3 className="text-base font-semibold text-gray-900">{title}</h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">{description}</p>
              <Link
                href={cta.href}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                {cta.label}
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
