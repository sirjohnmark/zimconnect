import Link from "next/link";

const CATEGORIES = ["All", "Electronics", "Vehicles", "Property", "Jobs", "Services"];

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-6">
            <Link href="/home" className="text-xl font-bold text-blue-600 shrink-0">
              ZimConnect
            </Link>
            <div className="flex-1">
              <input
                type="search"
                placeholder="Search listings..."
                className="w-full rounded-full border border-gray-300 px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <nav className="flex items-center gap-4 text-sm font-medium text-gray-600 shrink-0">
              <Link href="/profile" className="hover:text-gray-900">Account</Link>
              <Link
                href="/sell"
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
              >
                + Sell
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 flex gap-6 flex-1">
        <aside className="hidden lg:block w-52 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Categories
          </p>
          <nav className="space-y-0.5 text-sm font-medium text-gray-600">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/listings?category=${cat.toLowerCase()}`}
                className="block rounded-md px-3 py-2 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                {cat}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
