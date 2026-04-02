const TRUST_ITEMS = [
  {
    title: "Local Marketplace",
    description: "Built specifically for Zimbabwe — listings from your city, your neighbourhood, your community.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
    ),
  },
  {
    title: "Safe Transactions",
    description: "Seller profiles, buyer reviews, and direct contact via Call or WhatsApp to keep every deal safe.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
  },
  {
    title: "Verified Users",
    description: "Phone-verified accounts and seller ratings so you always know exactly who you're dealing with.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
      </svg>
    ),
  },
];

const NUMBERS = [
  { value: "50K+",  label: "listings live" },
  { value: "12K+",  label: "active sellers" },
  { value: "98%",   label: "satisfaction rate" },
  { value: "Free",  label: "to list" },
];

export function TrustSection() {
  return (
    <section className="bg-emerald-600 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300 mb-2">Why ZimConnect</p>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Built for Zimbabweans</h2>
          <p className="mt-3 text-emerald-100 max-w-xl mx-auto">
            Thousands of Zimbabweans trust ZimConnect every day to buy, sell, and connect.
          </p>
        </div>

        {/* Trust pillars */}
        <div className="grid gap-6 sm:grid-cols-3 mb-14">
          {TRUST_ITEMS.map(({ title, description, icon }) => (
            <div
              key={title}
              className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm border border-white/10"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-white mb-4">
                {icon}
              </div>
              <h3 className="text-base font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm text-emerald-100 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        {/* Numbers bar */}
        <div className="grid grid-cols-2 gap-4 rounded-2xl bg-white/10 p-6 sm:grid-cols-4 sm:gap-0 sm:divide-x sm:divide-white/20">
          {NUMBERS.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center py-2">
              <p className="text-3xl font-extrabold text-white">{value}</p>
              <p className="mt-1 text-xs font-medium text-emerald-200 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
