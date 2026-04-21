"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/useAuth";

// ─── Nav config ───────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "How It Works",      href: "/home#how-it-works" },
  { label: "Browse Categories", href: "/categories" },
  { label: "About",             href: "/about" },
  { label: "Contact",           href: "/contact" },
] as const;

const DASHBOARD_LINKS = [
  {
    label: "Home",
    href: "/dashboard",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: "My Listings",
    href: "/dashboard/listings",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: "Messages",
    href: "/dashboard/messages",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M3.43 2.524A41.29 41.29 0 0 1 10 2c2.236 0 4.43.18 6.57.524 1.437.231 2.43 1.49 2.43 2.902v5.148c0 1.413-.993 2.67-2.43 2.902a41.202 41.202 0 0 1-5.183.501.78.78 0 0 0-.528.224l-3.202 3.203A.75.75 0 0 1 6.375 17v-2.136a41.415 41.415 0 0 1-2.945-.34C1.993 14.271 1 11.6V5.426c0-1.413.993-2.67 2.43-2.902Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: "Saved",
    href: "/dashboard/saved",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-2.085c-1.034-1.062-2.135-2.52-2.510-4.265C2.97 8.443 3.92 6.25 5.808 5.129A5.495 5.495 0 0110 4.517a5.495 5.495 0 014.192 2.612c1.888 1.121 2.838 3.314 2.525 5.541-.375 1.744-1.476 3.203-2.51 4.265a22.046 22.046 0 01-2.582 2.085 20.932 20.932 0 01-1.182.692l-.018.01-.005.003h-.002a.739.739 0 01-.707 0l-.002-.001z" />
      </svg>
    ),
  },
  {
    label: "Orders",
    href: "/dashboard/orders",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M6 5v1H4.667a1.75 1.75 0 0 0-1.743 1.598l-.826 9.14A1.75 1.75 0 0 0 3.84 18.75h12.32a1.75 1.75 0 0 0 1.742-1.012l-.825-9.14A1.75 1.75 0 0 0 15.333 7H14V5a4 4 0 0 0-8 0Zm4-2.5A2.5 2.5 0 0 0 7.5 5v1h5V5A2.5 2.5 0 0 0 10 2.5ZM7.5 10a2.5 2.5 0 0 0 5 0V8.75a.75.75 0 0 1 1.5 0V10a4 4 0 0 1-8 0V8.75a.75.75 0 0 1 1.5 0V10Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-5.5-2.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM10 12a5.99 5.99 0 0 0-4.793 2.39A6.483 6.483 0 0 0 10 16.5a6.483 6.483 0 0 0 4.793-2.11A5.99 5.99 0 0 0 10 12Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .205 1.251l-1.18 2.044a1 1 0 0 1-1.186.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.113a7.047 7.047 0 0 1 0-2.228L1.821 7.773a1 1 0 0 1-.205-1.251l1.18-2.044a1 1 0 0 1 1.186-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
      </svg>
    ),
  },
] as const;

// ─── Small helpers ────────────────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={cn("h-4 w-4 text-gray-400 transition-transform duration-200", open && "rotate-180")}>
      <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    </svg>
  );
}

function UserAvatar({ name, avatar, size = "sm" }: { name: string; avatar?: string; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "h-7 w-7 text-xs" : "h-10 w-10 text-sm";
  return (
    <span className={cn("relative flex shrink-0 items-center justify-center rounded-full bg-apple-blue/10 font-bold text-apple-blue overflow-hidden", sz)}>
      {avatar ? <Image src={avatar} alt={name} fill className="object-cover" /> : name.charAt(0).toUpperCase()}
    </span>
  );
}

function getUserDisplayName(user: NonNullable<ReturnType<typeof useAuth>["user"]>): string {
  return `${user.first_name} ${user.last_name}`.trim() || user.username;
}

// ─── Desktop auth dropdown ────────────────────────────────────────────────────

function DesktopAuthSection({ onClose }: { onClose: () => void }) {
  const { isLoading, isAuthenticated, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-8 w-16 animate-pulse rounded-md bg-gray-100" />
        <div className="h-8 w-24 animate-pulse rounded-lg bg-apple-blue/10" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    const name = getUserDisplayName(user);
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          aria-expanded={menuOpen}
          aria-haspopup="true"
        >
          <UserAvatar name={name} avatar={user.profile_picture ?? undefined} />
          <span className="max-w-[120px] truncate">{name}</span>
          <ChevronIcon open={menuOpen} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-56 rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden">
            <div className="flex items-center gap-3 bg-light-gray px-4 py-3 border-b border-apple-blue/10">
              <UserAvatar name={name} avatar={user.profile_picture ?? undefined} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
                <p className="truncate text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            <div className="py-1.5">
              {DASHBOARD_LINKS.map(({ label, href, icon }) => {
                const isActive = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => { setMenuOpen(false); onClose(); }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2 text-sm transition-colors",
                      isActive ? "bg-light-gray text-apple-blue font-medium" : "text-gray-700 hover:bg-gray-50",
                    )}
                  >
                    <span className={cn(isActive ? "text-apple-blue" : "text-gray-400")}>{icon}</span>
                    {label}
                  </Link>
                );
              })}
            </div>
            <div className="border-t border-gray-100 py-1.5">
              <Link
                href="/dashboard/listings/create"
                onClick={() => { setMenuOpen(false); onClose(); }}
                className="flex items-center gap-3 px-4 py-2 text-sm font-semibold text-apple-blue hover:bg-light-gray transition-colors"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                </svg>
                Post a Listing
              </Link>
              <button
                onClick={() => { setMenuOpen(false); logout(); }}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-1.04a.75.75 0 1 0-1.056-1.062l-2.5 2.5a.75.75 0 0 0 0 1.062l2.5 2.5a.75.75 0 1 0 1.056-1.062l-1.048-1.038h9.546A.75.75 0 0 0 19 10Z" clipRule="evenodd" />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-near-black transition-colors">
        Sign In
      </Link>
      <Link href="/register" className="rounded-full bg-apple-blue px-4 py-2 text-sm font-normal text-white hover:opacity-90 active:opacity-80 transition-opacity">
        Get Started
      </Link>
    </div>
  );
}

// ─── Mobile drawer content ────────────────────────────────────────────────────

function MobileMenu({ onClose }: { onClose: () => void }) {
  const { isLoading, isAuthenticated, user, logout } = useAuth();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3].map((n) => <div key={n} className="h-10 animate-pulse rounded-lg bg-gray-100" />)}
      </div>
    );
  }

  if (isAuthenticated && user) {
    const name = getUserDisplayName(user);
    return (
      <div className="p-3 space-y-2">

        {/* User card */}
        <Link
          href="/dashboard/profile"
          onClick={onClose}
          className="flex items-center gap-2.5 rounded-xl bg-apple-blue px-3 py-2.5"
        >
          <UserAvatar name={name} avatar={user.profile_picture ?? undefined} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{name}</p>
            <p className="truncate text-[11px] text-white/60">{user.email}</p>
          </div>
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-white/50 shrink-0">
            <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </Link>

        {/* Dashboard grid */}
        <div>
          <p className="px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Dashboard</p>
          <div className="grid grid-cols-4 gap-1.5">
            {DASHBOARD_LINKS.map(({ label, href, icon }) => {
              const isActive = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl p-2 text-center transition-colors",
                    isActive ? "bg-apple-blue/10 text-apple-blue" : "bg-gray-50 text-gray-600",
                  )}
                >
                  <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", isActive ? "bg-apple-blue text-white" : "bg-white text-gray-500 shadow-sm")}>
                    {icon}
                  </span>
                  <span className="text-[10px] font-medium leading-tight">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Post listing */}
        <Link
          href="/dashboard/listings/create"
          onClick={onClose}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-apple-blue px-4 py-2.5 text-xs font-semibold text-white"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
          Post a Listing
        </Link>

        {/* Nav links */}
        <div>
          <p className="px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Explore</p>
          {NAV_LINKS.map(({ label, href }) => {
            const base = href.split("#")[0];
            const isActive = pathname === base || (base !== "/home" && pathname.startsWith(base + "/"));
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-apple-blue/10 text-apple-blue" : "text-gray-700 hover:bg-gray-50",
                )}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Sign out */}
        <button
          onClick={() => { onClose(); logout(); }}
          className="flex w-full items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-1.04a.75.75 0 1 0-1.056-1.062l-2.5 2.5a.75.75 0 0 0 0 1.062l2.5 2.5a.75.75 0 1 0 1.056-1.062l-1.048-1.038h9.546A.75.75 0 0 0 19 10Z" clipRule="evenodd" />
          </svg>
          Sign out
        </button>
      </div>
    );
  }

  // Unauthenticated
  return (
    <div className="p-3 space-y-1">
      {NAV_LINKS.map(({ label, href }) => {
        const base = href.split("#")[0];
        const isActive = pathname === base || (base !== "/home" && pathname.startsWith(base + "/"));
        return (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={cn(
              "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive ? "bg-apple-blue/10 text-apple-blue" : "text-gray-700 hover:bg-gray-50",
            )}
          >
            {label}
          </Link>
        );
      })}
      <div className="border-t border-gray-100 pt-2 space-y-2">
        <Link
          href="/login"
          onClick={onClose}
          className="flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          onClick={onClose}
          className="flex items-center justify-center rounded-xl bg-apple-blue px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          Get Started Free
        </Link>
      </div>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();

  // Close on navigation
  useEffect(() => { setOpen(false); }, [pathname]);

  function close() { setOpen(false); }
  function toggle() { setOpen((v) => !v); }

  return (
    <>
      {/* ── Header: always z-50, always clickable ── */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between gap-4">

            <Link href="/home" onClick={close} className="shrink-0 flex items-center gap-2" aria-label="Sanganai home">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-apple-blue">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                  <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" stroke="white" strokeWidth="1.75" strokeLinejoin="round"/>
                  <path d="M9 21V13h6v8" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="16.5" cy="7.5" r="2" fill="white" opacity="0.8"/>
                </svg>
              </span>
              <span className="text-lg font-semibold tracking-tight text-near-black">Sanganai</span>
            </Link>

            {/* Desktop nav */}
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
                      isActive ? "bg-light-gray text-apple-blue" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden md:flex items-center">
              <DesktopAuthSection onClose={close} />
            </div>

            {/* Mobile right side */}
            <div className="md:hidden flex items-center gap-2">
              {isAuthenticated && user && (
                <Link href="/dashboard" onClick={close} aria-label="Dashboard">
                  <UserAvatar name={getUserDisplayName(user)} avatar={user.profile_picture ?? undefined} />
                </Link>
              )}
              {/* Hamburger / Close — plain button, no tricks */}
              <button
                type="button"
                onClick={toggle}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                aria-label={open ? "Close menu" : "Open menu"}
              >
                {open ? (
                  /* X icon */
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="h-5 w-5">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                ) : (
                  /* Hamburger */
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="h-5 w-5">
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/*
        ── Mobile overlay ──
        Fixed full-screen div at z-40 (below header z-50).
        Clicking this outer div closes the menu (backdrop click).
        The inner white panel calls e.stopPropagation() so tapping
        inside the panel does NOT bubble up and close the menu.
      */}
      {open && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={close}
        >
          {/* Dim backdrop */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Drawer panel — sits below the 56px header */}
          <div
            className="absolute left-0 right-0 top-14 bg-white shadow-2xl overflow-y-auto max-h-[calc(100dvh-3.5rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            <MobileMenu onClose={close} />
          </div>
        </div>
      )}
    </>
  );
}
