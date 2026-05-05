"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/useAuth";

const NAV_LINKS = [
  { label: "Categories",   href: "/categories" },
  { label: "Listings",     href: "/listings"   },
  { label: "How it Works", href: "/home#how-it-works" },
  { label: "About",        href: "/about" },
];

const SELL_HREF = "/dashboard/listings/create";
const SELL_GATE = "/login?redirect=/dashboard/listings/create";

function Logo({ className }: { className?: string }) {
  return (
    <Link href="/home" className={cn("flex items-center gap-2", className)}>
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-apple-blue">
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" stroke="white" strokeWidth="1.75" strokeLinejoin="round"/>
          <path d="M9 21V13h6v8" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
      <span className="text-sm font-semibold tracking-tight text-white">Sanganai</span>
    </Link>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  const sellHref = isAuthenticated ? SELL_HREF : SELL_GATE;

  return (
    <>
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl backdrop-saturate-[180%]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-12 items-center justify-between">

            <Logo />

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
              {!isLoading && isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="rounded-full bg-apple-blue px-3 py-1 text-xs font-normal text-white hover:opacity-90 transition-opacity"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-xs font-normal text-white/80 hover:text-white transition-colors">
                    Sign In
                  </Link>
                  <Link
                    href={sellHref}
                    className="rounded-full bg-apple-blue px-3 py-1 text-xs font-normal text-white hover:opacity-90 transition-opacity"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── Full-screen mobile drawer ── */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden transition-all duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        aria-modal="true"
        role="dialog"
        aria-label="Navigation menu"
      >
        {/* Background: deep dark with glow orbs */}
        <div className="absolute inset-0 bg-near-black">
          {/* Dot grid */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:28px_28px]" aria-hidden="true" />
          {/* Blue glow top-left */}
          <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-apple-blue opacity-[0.18] blur-[80px]" aria-hidden="true" />
          {/* Indigo glow bottom-right */}
          <div className="absolute bottom-0 right-0 h-64 w-64 translate-x-1/4 translate-y-1/4 rounded-full bg-indigo-600 opacity-[0.12] blur-[80px]" aria-hidden="true" />
        </div>

        {/* Drawer content */}
        <div
          className={cn(
            "relative flex h-full flex-col px-6 pt-4 pb-10 transition-transform duration-200",
            open ? "translate-y-0" : "-translate-y-4",
          )}
        >
          {/* Header row: logo + close */}
          <div className="flex items-center justify-between h-12 shrink-0">
            <Logo />
            <button
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close menu"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>

          {/* Nav links — large editorial style */}
          <nav className="flex-1 flex flex-col justify-center gap-1 -mt-8">
            {NAV_LINKS.map(({ label, href }, i) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="group flex items-center justify-between border-b border-white/[0.07] py-5 transition-colors hover:border-white/20"
                style={{ transitionDelay: open ? `${i * 40}ms` : "0ms" }}
              >
                <span className="text-[2rem] font-semibold leading-none tracking-tight text-white/80 group-hover:text-white transition-colors">
                  {label}
                </span>
                <svg
                  className="h-5 w-5 text-white/25 group-hover:text-apple-blue group-hover:translate-x-1 transition-all"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            ))}
          </nav>

          {/* Bottom: stat + CTAs */}
          <div className="shrink-0 space-y-4">
            {/* Live stat */}
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 backdrop-blur-sm">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400" />
              </span>
              <p className="text-xs text-white/50">
                <span className="font-semibold text-white/80">50,000+ listings</span> live across Zimbabwe right now
              </p>
            </div>

            {/* CTAs */}
            <div className={isAuthenticated ? "grid grid-cols-1 gap-3" : "grid grid-cols-2 gap-3"}>
              {!isLoading && isAuthenticated ? (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center rounded-full bg-apple-blue py-3.5 text-sm font-normal text-white hover:opacity-90 transition-opacity"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center rounded-full border border-white/15 py-3.5 text-sm font-normal text-white/80 hover:border-white/30 hover:text-white transition-all"
                  >
                    Sign In
                  </Link>
                  <Link
                    href={sellHref}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center rounded-full bg-apple-blue py-3.5 text-sm font-normal text-white hover:opacity-90 transition-opacity"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
