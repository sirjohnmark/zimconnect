import Link from "next/link";

const NAV_ITEMS = [
  { label: "Profile", href: "/profile" },
  { label: "My Listings", href: "/my-listings" },
  { label: "Messages", href: "/messages" },
  { label: "Settings", href: "/settings" },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <Link href="/home" className="text-xl font-bold text-blue-600">
            Sanganai
          </Link>
          <Link href="/listings" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Browse listings
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 flex gap-8 flex-1">
        <aside className="hidden md:block w-48 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Account
          </p>
          <nav className="space-y-0.5 text-sm font-medium">
            {NAV_ITEMS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="block rounded-md px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
