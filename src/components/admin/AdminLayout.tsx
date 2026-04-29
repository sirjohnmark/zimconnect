"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// ─── Navigation definition ────────────────────────────────────────────────────

const NAV = [
  {
    label: "Dashboard",
    href: "/dashboard/admin",
    exact: true,
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path
          fillRule="evenodd"
          d="M1 2.75A.75.75 0 0 1 1.75 2h10.5a.75.75 0 0 1 0 1.5H12v13.75a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75v-3.5a.75.75 0 0 0-.75-.75h-2.5a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 1-.75.75H3a.75.75 0 0 1-.75-.75V3.5h-.5A.75.75 0 0 1 1 2.75ZM4 5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1ZM4.5 9a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1ZM8 5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1ZM8.5 9a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    label: "Users",
    href: "/dashboard/users",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
      </svg>
    ),
  },
  {
    label: "Listings",
    href: "/dashboard/admin-listings",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path
          fillRule="evenodd"
          d="M10 2a.75.75 0 0 1 .75.75v.258a33.186 33.186 0 0 1 6.668 1.15.75.75 0 1 1-.336 1.461 31.28 31.28 0 0 0-1.103-.232l1.702 7.545a.75.75 0 0 1-.387.832A4.981 4.981 0 0 1 15 14c-.825 0-1.606-.2-2.294-.556a.75.75 0 0 1-.387-.832l1.77-7.849a31.743 31.743 0 0 0-3.339-.254v11.505a20.01 20.01 0 0 1 3.78.501.75.75 0 1 1-.338 1.462A18.51 18.51 0 0 0 10 17.5c-1.442 0-2.845.165-4.192.481a.75.75 0 1 1-.338-1.462 20.01 20.01 0 0 1 3.78-.501V4.509a31.743 31.743 0 0 0-3.339.254l1.77 7.849a.75.75 0 0 1-.387.832A4.98 4.98 0 0 1 5 14a4.98 4.98 0 0 1-2.294-.556.75.75 0 0 1-.387-.832L4.02 5.067c-.361.07-.718.15-1.103.232a.75.75 0 0 1-.336-1.462 33.186 33.186 0 0 1 6.668-1.15V2.75A.75.75 0 0 1 10 2Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    label: "Categories",
    href: "/dashboard/categories",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path
          fillRule="evenodd"
          d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 5.5a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Zm0 5.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    label: "Inbox",
    href: "/dashboard/admin/messages",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path
          fillRule="evenodd"
          d="M3.43 2.524A41.29 41.29 0 0 1 10 2c2.236 0 4.43.18 6.57.524 1.437.231 2.43 1.49 2.43 2.902v5.148c0 1.413-.993 2.67-2.43 2.902a41.202 41.202 0 0 1-5.183.501.78.78 0 0 0-.528.224l-3.202 3.203A.75.75 0 0 1 6.375 17v-2.136a41.415 41.415 0 0 1-2.945-.34C1.993 14.271 1 13.012 1 11.6V5.426c0-1.413.993-2.67 2.43-2.902Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useActiveItem() {
  const pathname = usePathname();
  return (item: (typeof NAV)[number]) =>
    "exact" in item && item.exact
      ? pathname === item.href
      : pathname.startsWith(item.href);
}

// ─── NavLink ──────────────────────────────────────────────────────────────────

function NavLink({
  item,
  collapsed,
  onClick,
}: {
  item: (typeof NAV)[number];
  collapsed: boolean;
  onClick?: () => void;
}) {
  const isActive = useActiveItem()(item);

  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center gap-3 mx-2 mb-0.5 rounded-lg py-2 text-sm font-medium transition-colors duration-150",
        collapsed ? "justify-center px-2" : "px-3",
        isActive
          ? "bg-blue-50 text-apple-blue"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
      )}
    >
      <span className={cn("shrink-0", isActive ? "text-apple-blue" : "text-gray-400")}>
        {item.icon}
      </span>
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

// ─── Mobile current-page label ────────────────────────────────────────────────

function MobilePageLabel() {
  const isActive = useActiveItem();
  const current = NAV.find(isActive);
  return (
    <span className="text-xs font-semibold text-gray-500">
      {current?.label ?? "Admin"}
    </span>
  );
}

// ─── AdminLayout ──────────────────────────────────────────────────────────────

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="flex min-h-full -m-4 sm:-m-6 lg:-m-8">

      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col shrink-0 border-r border-gray-200 bg-white transition-all duration-200",
          collapsed ? "w-14" : "w-56",
        )}
      >
        {/* Sidebar header */}
        <div
          className={cn(
            "flex h-12 shrink-0 items-center border-b border-gray-100",
            collapsed ? "justify-center" : "justify-between px-4",
          )}
        >
          {!collapsed && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Admin Panel
            </span>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              "rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600",
              collapsed && "mx-auto",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              {collapsed ? (
                /* chevron-right */
                <path
                  fillRule="evenodd"
                  d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              ) : (
                /* chevron-left */
                <path
                  fillRule="evenodd"
                  d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
                  clipRule="evenodd"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3">
          {NAV.map((item) => (
            <NavLink key={item.href} item={item} collapsed={collapsed} />
          ))}
        </nav>
      </aside>

      {/* ── Mobile backdrop ───────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        onClick={closeMobile}
        className={cn(
          "fixed inset-0 z-20 bg-black/40 transition-opacity duration-200 lg:hidden",
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      />

      {/* ── Mobile drawer ─────────────────────────────────────────────────── */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Admin navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-gray-200 bg-white shadow-xl",
          "transition-transform duration-200 ease-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Drawer header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-100 px-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-apple-blue">
              <svg viewBox="0 0 16 16" fill="white" className="h-3.5 w-3.5">
                <path d="M8 1a.75.75 0 0 1 .75.75v5.5h5.5a.75.75 0 0 1 0 1.5h-5.5v5.5a.75.75 0 0 1-1.5 0v-5.5h-5.5a.75.75 0 0 1 0-1.5h5.5v-5.5A.75.75 0 0 1 8 1Z" />
              </svg>
            </span>
            <span className="text-sm font-bold text-gray-800">Admin Panel</span>
          </div>
          <button
            type="button"
            onClick={closeMobile}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Close navigation"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto p-3">
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              collapsed={false}
              onClick={closeMobile}
            />
          ))}
        </nav>
      </aside>

      {/* ── Content area ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Mobile sub-header */}
        <div className="flex h-11 shrink-0 items-center gap-2.5 border-b border-gray-100 bg-white px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
            aria-label="Open admin navigation"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path
                fillRule="evenodd"
                d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <MobilePageLabel />
        </div>

        {/* Page content — restore the main layout padding here */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
