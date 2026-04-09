import Link from "next/link";

const LINKS = {
  Company:  [
    { label: "About",   href: "/about"   },
    { label: "Contact", href: "/contact" },
    { label: "Blog",    href: "/blog"    },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Use",   href: "/terms"   },
    { label: "Cookie Policy",  href: "/cookies" },
  ],
  Marketplace: [
    { label: "Browse Listings",  href: "/listings"   },
    { label: "Categories",       href: "/categories" },
    { label: "Post a Listing",   href: "/dashboard/listings/create" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/home" className="text-lg font-bold text-emerald-600">
              Zim<span className="text-gray-900">Connect</span>
            </Link>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              Zimbabwe&apos;s trusted marketplace for buying and selling anything.
            </p>
          </div>

          {/* Link groups */}
          {Object.entries(LINKS).map(([group, links]) => (
            <div key={group}>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                {group}
              </p>
              <ul className="space-y-2">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} Sanganai. All rights reserved.</p>
          <p>Made with care in Zimbabwe 🇿🇼</p>
        </div>
      </div>
    </footer>
  );
}
