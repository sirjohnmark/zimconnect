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
    <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl backdrop-saturate-[180%]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-12 items-center justify-between">

          {/* Logo */}
          <Link href="/home" className="shrink-0 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-apple-blue">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" stroke="white" strokeWidth="1.75" strokeLinejoin="round"/>
                <path d="M9 21V13h6v8" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span className="text-sm font-semibold text-white tracking-tight">Sanganai</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="text-xs font-normal text-white/80 hover:text-white transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs font-normal text-white/80 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href={isAuthenticated ? SELL_HREF : SELL_GATE}
              className="rounded-full bg-apple-blue px-3 py-1 text-xs font-normal text-white hover:opacity-90 transition-opacity"
            >
              + Sell
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden rounded-md p-2 text-white/70 hover:text-white"
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
        "md:hidden bg-dark-surface-1 overflow-hidden transition-all duration-200",
        open ? "max-h-64" : "max-h-0",
      )}>
        <nav className="flex flex-col px-6 py-3 gap-1">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-normal text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              {label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-3">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-normal text-white/80 hover:text-white hover:bg-white/10"
            >
              Sign In
            </Link>
            <Link
              href={isAuthenticated ? SELL_HREF : SELL_GATE}
              onClick={() => setOpen(false)}
              className="rounded-full bg-apple-blue px-4 py-2.5 text-center text-sm font-normal text-white hover:opacity-90 transition-opacity"
            >
              + Post a Listing
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
