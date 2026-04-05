import { Navbar } from "@/components/layout/Navbar";

const CATEGORIES = ["All", "Electronics", "Vehicles", "Property", "Services", "Fashion", "Agriculture", "Hardware", "Mining Equipment", "Printing & Machinery", "Transportation", "Catering", "Schools", "Wholesale"];

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
              href={cat === "Wholesale" ? "/wholesale" : cat === "Schools" ? "/schools" : cat === "All" ? "/listings" : `/listings?category=${cat.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}`}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${cat === "Wholesale" ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100" : "border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"}`}
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
            <a href="/jobs" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-emerald-50 hover:text-emerald-700 transition-colors font-semibold text-emerald-700">
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5"><path fillRule="evenodd" d="M5 2.75A1.75 1.75 0 0 1 6.75 1h2.5A1.75 1.75 0 0 1 11 2.75v.25h1.25A1.75 1.75 0 0 1 14 4.75v8.5A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25v-8.5A1.75 1.75 0 0 1 3.75 3H5v-.25ZM6.5 3v.25h3V3a.25.25 0 0 0-.25-.25h-2.5A.25.25 0 0 0 6.5 3Z" clipRule="evenodd" /></svg>
              Job Vacancies
            </a>
            <a href="/schools" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-blue-50 hover:text-blue-700 transition-colors font-semibold text-blue-700">
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5"><path d="M8.316 1.665a.75.75 0 0 0-.632 0l-6.5 3a.75.75 0 0 0 0 1.37L3.5 7.237V11a.75.75 0 0 0 .75.75h7.5a.75.75 0 0 0 .75-.75V7.237l1.684-.775V11.5a.75.75 0 0 0 1.5 0V6a.75.75 0 0 0-.434-.685l-6.934-3.65ZM4.5 9.5v-1.6l3.184 1.464a.75.75 0 0 0 .632 0L11.5 7.9v1.6h-7Z" /></svg>
              Schools Directory
            </a>
            <a href="/wholesale" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-amber-50 hover:text-amber-700 transition-colors font-semibold text-amber-700">
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5"><path d="M1.5 3A.5.5 0 0 0 1 3.5v.75H.5a.5.5 0 0 0 0 1H1V12a1 1 0 0 0 1 1h.05a2 2 0 0 0 3.9 0h3.1a2 2 0 0 0 3.9 0H13a1 1 0 0 0 1-1V8.15a.5.5 0 0 0-.08-.27l-1.6-2.4a.5.5 0 0 0-.42-.23H11V4a1 1 0 0 0-1-1H1.5ZM10 5.5h1.6l1.4 2.1V8H10V5.5ZM3.5 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm9 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>
              Wholesale
            </a>
            {CATEGORIES.filter(c => c !== "Schools" && c !== "Wholesale").map((cat) => (
              <a
                key={cat}
                href={cat === "All" ? "/listings" : `/listings?category=${cat.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}`}
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
