"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { useRole } from "@/lib/auth/useRole";
import { getAdminStats } from "@/lib/api/admin";
import { cn } from "@/lib/utils";

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

const ROUTE_LABELS: Array<[string, string, boolean]> = [
  ["/dashboard", "Home", true],
  ["/dashboard/admin", "Overview", true],
  ["/dashboard/admin/reports", "Reports", false],
  ["/dashboard/admin/trash", "Trash", false],
  ["/dashboard/admin-listings", "Listing Review", false],
  ["/dashboard/users", "Users", false],
  ["/dashboard/categories", "Categories", false],
  ["/dashboard/upgrade-requests", "Seller Applications", false],
  ["/dashboard/listings/create", "New Listing", false],
  ["/dashboard/listings", "My Listings", false],
  ["/dashboard/messages", "Messages", false],
  ["/dashboard/orders", "Orders", false],
  ["/dashboard/saved", "Saved", false],
  ["/dashboard/profile", "Profile", false],
  ["/dashboard/settings", "Settings", false],
  ["/dashboard/seller-profile", "Shop Profile", false],
  ["/dashboard/upgrade", "Become a Seller", false],
];

function usePageLabel() {
  const pathname = usePathname();
  let best = "";
  let label = "Dashboard";
  for (const [path, name, exact] of ROUTE_LABELS) {
    const matches = exact ? pathname === path : pathname.startsWith(path);
    if (matches && path.length > best.length) {
      best = path;
      label = name;
    }
  }
  return label;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function HamburgerIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M10 2a6 6 0 0 0-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 0 0 .515 1.076 32.91 32.91 0 0 0 3.256.508 3.5 3.5 0 0 0 6.972 0 32.903 32.903 0 0 0 3.256-.508.75.75 0 0 0 .515-1.076A11.448 11.448 0 0 1 16 8a6 6 0 0 0-6-6ZM8.05 14.943a33.54 33.54 0 0 0 3.9 0 2 2 0 0 1-3.9 0Z" clipRule="evenodd" />
    </svg>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={cn("h-3.5 w-3.5 text-gray-400 transition-transform duration-150", open && "rotate-180")}>
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
    </svg>
  );
}

// ─── Dropdown link ────────────────────────────────────────────────────────────

function DropdownLink({
  href,
  label,
  icon,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
    >
      <span className="text-gray-400">{icon}</span>
      {label}
    </Link>
  );
}

// ─── TopNav ───────────────────────────────────────────────────────────────────

export function TopNav({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const { isStaff } = useRole();
  const pageLabel = usePageLabel();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch pending listings count for staff
  useEffect(() => {
    if (!isStaff) return;
    getAdminStats()
      .then((s) => setPendingCount(s.pendingListings))
      .catch(() => setPendingCount(null));
  }, [isStaff]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close dropdown on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setDropdownOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const displayName =
    `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() ||
    user?.username ||
    "";
  const initials = (displayName.charAt(0) || "U").toUpperCase();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">

      {/* Left: hamburger (mobile) + page label */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 lg:hidden"
        >
          <HamburgerIcon />
        </button>
        <h1 className="text-sm font-semibold text-gray-900">{pageLabel}</h1>
      </div>

      {/* Right: bell (admin) + avatar dropdown */}
      <div className="flex items-center gap-2">

        {/* Notification bell — admin only */}
        {isStaff && (
          <Link
            href="/dashboard/admin-listings"
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Pending listings"
          >
            <BellIcon />
            {pendingCount != null && pendingCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold text-white leading-none">
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            )}
          </Link>
        )}

        {/* Avatar dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-gray-100"
          >
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-apple-blue/10 text-sm font-bold text-apple-blue">
              {user?.profile_picture ? (
                <Image src={user.profile_picture} alt={displayName} fill className="object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="hidden text-left sm:block">
              <p className="max-w-[120px] truncate text-xs font-semibold text-gray-900 leading-tight">
                {displayName}
              </p>
              <p className="text-[10px] text-gray-400 leading-tight">{user?.role}</p>
            </div>
            <ChevronDownIcon open={dropdownOpen} />
          </button>

          {/* Dropdown panel */}
          {dropdownOpen && (
            <div className="absolute right-0 z-50 mt-1.5 w-56 rounded-xl border border-gray-200 bg-white py-1 shadow-lg ring-1 ring-black/5">

              {/* User info header */}
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="truncate text-xs font-semibold text-gray-900">{displayName}</p>
                <p className="truncate text-[11px] text-gray-400">{user?.email}</p>
                <span className="mt-1.5 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                  {user?.role}
                </span>
              </div>

              {/* Navigation links */}
              <div className="py-1">
                <DropdownLink
                  href="/dashboard/profile"
                  label="Profile"
                  icon={
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-5.5-2.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM10 12a5.99 5.99 0 0 0-4.793 2.39A6.483 6.483 0 0 0 10 16.5a6.483 6.483 0 0 0 4.793-2.11A5.99 5.99 0 0 0 10 12Z" clipRule="evenodd" />
                    </svg>
                  }
                  onClick={() => setDropdownOpen(false)}
                />
                <DropdownLink
                  href="/dashboard/settings"
                  label="Settings"
                  icon={
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .205 1.251l-1.18 2.044a1 1 0 0 1-1.186.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.113a7.047 7.047 0 0 1 0-2.228L1.821 7.773a1 1 0 0 1-.205-1.251l1.18-2.044a1 1 0 0 1 1.186-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
                    </svg>
                  }
                  onClick={() => setDropdownOpen(false)}
                />
              </div>

              {/* Sign out */}
              <div className="border-t border-gray-100 py-1">
                <button
                  type="button"
                  onClick={() => { setDropdownOpen(false); logout(); }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
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
      </div>
    </header>
  );
}
