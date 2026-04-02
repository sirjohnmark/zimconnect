import { Navbar } from "@/components/layout/Navbar";

const CATEGORIES = ["All", "Electronics", "Vehicles", "Property", "Jobs", "Services"];

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Mobile/tablet: horizontal scrollable category pills */}
      <div className="lg:hidden border-b border-gray-100 bg-white">
        <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <a
              key={cat}
              href={`/listings?category=${cat.toLowerCase()}`}
              className="shrink-0 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold text-gray-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              {cat}
            </a>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 flex gap-6 flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-52 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Categories
          </p>
          <nav className="space-y-0.5 text-sm font-medium text-gray-600">
            {CATEGORIES.map((cat) => (
              <a
                key={cat}
                href={`/listings?category=${cat.toLowerCase()}`}
                className="block rounded-md px-3 py-2 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                {cat}
              </a>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
