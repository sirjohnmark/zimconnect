import Link from "next/link";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/home" className="text-xl font-bold text-blue-600">
              ZimConnect
            </Link>
            <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
              <Link href="/listings" className="hover:text-gray-900">Browse</Link>
              <Link href="/login" className="hover:text-gray-900">Sign In</Link>
              <Link
                href="/register"
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-gray-200 bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} ZimConnect. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
