"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/useAuth";

const NAV_LINKS = [
  { label: "Categories", href: "/categories" },
  { label: "Listings",   href: "/listings"   },
  { label: "How it Works", href: "/home#how-it-works" },
];

const SELL_HREF = "/dashboard/listings/create";
const SELL_GATE = "/login?redirect=/dashboard/listings/create";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link href="/home" className="text-xl font-bold text-emerald-600 shrink-0">
            Zim<span className="text-gray-900">Connect</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600">
            {NAV_LINKS.map(({ label, href }) => (
              <Link key={href} href={href} className="hover:text-gray-900 transition-colors">
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Sign In
            </Link>
            <Link
              href={isAuthenticated ? SELL_HREF : SELL_GATE}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-[0.96] active:bg-emerald-800 transition-all duration-75"
            >
              + Sell
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden rounded-md p-2 text-gray-500 hover:bg-gray-100"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? (
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={cn(
        "md:hidden border-t border-gray-100 bg-white overflow-hidden transition-all duration-200",
        open ? "max-h-64" : "max-h-0",
      )}>
        <nav className="flex flex-col px-4 py-3 gap-1">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-gray-100 pt-3">
            <Link href="/login" onClick={() => setOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Sign In
            </Link>
            <Link
              href={isAuthenticated ? SELL_HREF : SELL_GATE}
              onClick={() => setOpen(false)}
              className="rounded-lg bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-700 active:scale-[0.96] active:bg-emerald-800 transition-all duration-75"
            >
              + Post a Listing
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
