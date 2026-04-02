"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/useAuth";

// ─── Nav config ───────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Browse Categories", href: "/categories" },
  { label: "How It Works",      href: "/home#how-it-works" },
  { label: "About",             href: "/about" },
  { label: "Contact",           href: "/contact" },
] as const;

const MOBILE_EXTRA_LINKS = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy",   href: "/privacy" },
] as const;

// ─── Icons ────────────────────────────────────────────────────────────────────

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-5 w-5">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-5 w-5">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn("h-4 w-4 text-gray-400 transition-transform duration-200", open && "rotate-180")}
    >
      <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    </svg>
  );
}

// ─── Auth-aware right side ────────────────────────────────────────────────────
// When the user is authenticated, swap Login/Sign Up for a user menu.
// This section is intentionally split out so it's easy to extend later.

function DesktopAuthSection({ onClose }: { onClose: () => void }) {
  const { isLoading, isAuthenticated, user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (isLoading) {
    // Skeleton — prevents layout shift while auth resolves
    return (
      <div className="flex items-center gap-3">
        <div className="h-8 w-16 animate-pulse rounded-md bg-gray-100" />
        <div className="h-8 w-20 animate-pulse rounded-md bg-gray-100" />
        <div className="h-8 w-24 animate-pulse rounded-lg bg-emerald-100" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setUserMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          aria-expanded={userMenuOpen}
          aria-haspopup="true"
        >
          <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 overflow-hidden">
            {user.avatar ? (
              <Image src={user.avatar} alt={user.name} fill className="object-cover" />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </span>
          <span className="max-w-[120px] truncate">{user.name}</span>
          <ChevronIcon open={userMenuOpen} />
        </button>

        {/* Dropdown */}
        {userMenuOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-gray-100 bg-white py-1.5 shadow-lg">
            <Link
              href="/dashboard"
              onClick={() => { setUserMenuOpen(false); onClose(); }}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/listings"
              onClick={() => { setUserMenuOpen(false); onClose(); }}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              My Listings
            </Link>
            <Link
              href="/dashboard/listings/create"
              onClick={() => { setUserMenuOpen(false); onClose(); }}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              + Post a Listing
            </Link>
            <div className="my-1 border-t border-gray-100" />
            <button
              onClick={() => { setUserMenuOpen(false); logout(); }}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    );
  }

  // Unauthenticated
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-all duration-75"
      >
        Log In
      </Link>
      <Link
        href="/register"
        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-all duration-75"
      >
        Sign Up
      </Link>
      <Link
        href="/register"
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-[0.96] active:bg-emerald-800 transition-all duration-75"
      >
        Get Started
      </Link>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { isLoading, isAuthenticated, user, logout } = useAuth();

  // Close mobile menu on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function close() { setOpen(false); }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-8">

            {/* ── Logo ── */}
            <Link
              href="/home"
              onClick={close}
              className="shrink-0 text-xl font-bold tracking-tight"
              aria-label="ZimConnect home"
            >
              Zim<span className="text-emerald-600">Connect</span>
            </Link>

            {/* ── Desktop nav links ── */}
            <nav className="hidden md:flex items-center gap-1 flex-1" aria-label="Main navigation">
              {NAV_LINKS.map(({ label, href }) => {
                const base = href.split("#")[0];
                const isActive = pathname === base || (base !== "/home" && pathname.startsWith(base + "/"));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* ── Desktop auth ── */}
            <div className="hidden md:flex items-center">
              <DesktopAuthSection onClose={close} />
            </div>

            {/* ── Mobile hamburger ── */}
            <button
              className="md:hidden flex items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
            >
              {open ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile menu overlay (siblings of header, not children) ── */}

      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 top-16 z-30 bg-black/30 md:hidden transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        aria-hidden="true"
        onClick={close}
      />

      {/* Slide-down panel */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={cn(
          "fixed left-0 right-0 top-16 z-40 bg-white border-b border-gray-100 shadow-lg md:hidden",
          "transition-all duration-200 ease-out origin-top",
          open ? "opacity-100 scale-y-100" : "opacity-0 scale-y-95 pointer-events-none",
        )}
      >
        <div className="mx-auto max-w-7xl px-4 py-4 space-y-1">

          {/* Primary nav links */}
          {NAV_LINKS.map(({ label, href }) => {
            const base = href.split("#")[0];
            const isActive = pathname === base || (base !== "/home" && pathname.startsWith(base + "/"));
            return (
              <Link
                key={href}
                href={href}
                onClick={close}
                className={cn(
                  "flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}

          {/* Extra links */}
          {MOBILE_EXTRA_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={close}
              className="flex items-center rounded-lg px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
            >
              {label}
            </Link>
          ))}

          {/* Divider */}
          <div className="border-t border-gray-100 pt-3 mt-3 space-y-2">
            {isLoading ? (
              <div className="space-y-2 px-1">
                <div className="h-11 animate-pulse rounded-lg bg-gray-100" />
                <div className="h-11 animate-pulse rounded-lg bg-gray-100" />
              </div>
            ) : isAuthenticated && user ? (
              <>
                {/* Logged-in user info */}
                <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
                  <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 overflow-hidden">
                    {user.avatar ? (
                      <Image src={user.avatar} alt={user.name} fill className="object-cover" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
                    <p className="truncate text-xs text-gray-400">{user.email}</p>
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  onClick={close}
                  className="flex items-center rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/listings/create"
                  onClick={close}
                  className="flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
                >
                  + Post a Listing
                </Link>
                <button
                  onClick={() => { close(); logout(); }}
                  className="flex w-full items-center rounded-lg px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={close}
                  className="flex items-center justify-center rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  onClick={close}
                  className="flex items-center justify-center rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Sign Up
                </Link>
                <Link
                  href="/register"
                  onClick={close}
                  className="flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
