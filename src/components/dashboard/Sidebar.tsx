"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path
        fillRule="evenodd"
        d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ListingIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path
        fillRule="evenodd"
        d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path
        fillRule="evenodd"
        d="M3.43 2.524A41.29 41.29 0 0 1 10 2c2.236 0 4.43.18 6.57.524 1.437.231 2.43 1.49 2.43 2.902v5.148c0 1.413-.993 2.67-2.43 2.902a41.202 41.202 0 0 1-5.183.501.78.78 0 0 0-.528.224l-3.202 3.203A.75.75 0 0 1 6.375 17v-2.136a41.415 41.415 0 0 1-2.945-.34C1.993 14.271 1 13.012 1 11.6V5.426c0-1.413.993-2.67 2.43-2.902Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SavedIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path
        fillRule="evenodd"
        d="M10 2c-1.716 0-3.408.106-5.07.31C3.806 2.45 3 3.414 3 4.517V17.25a.75.75 0 0 0 1.075.676L10 15.082l5.925 2.844A.75.75 0 0 0 17 17.25V4.517c0-1.103-.806-2.068-1.93-2.207A41.403 41.403 0 0 0 10 2Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function OrderIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path
        fillRule="evenodd"
        d="M6 5v1H4.667a1.75 1.75 0 0 0-1.743 1.598l-.826 9.14A1.75 1.75 0 0 0 3.84 18.75h12.32a1.75 1.75 0 0 0 1.742-2.012l-.825-9.14A1.75 1.75 0 0 0 15.333 7H14V5a4 4 0 0 0-8 0Zm1.5 1V5a2.5 2.5 0 0 1 5 0v1h-5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SchoolIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path d="M10.394 2.08a1 1 0 0 0-.788 0l-7 3a1 1 0 0 0 0 1.84L10 10.08l7.394-3.16a1 1 0 0 0 0-1.84l-7-3ZM4 9.5v4.25c0 .414.336.75.75.75h.5A7.46 7.46 0 0 1 10 16a7.46 7.46 0 0 1 4.75-1.5h.5a.75.75 0 0 0 .75-.75V9.5l-5.212 2.23a2 2 0 0 1-1.576 0L4 9.5Z" />
    </svg>
  );
}

function WholesaleIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25ZM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875h.375a3 3 0 1 1 6 0h3a.75.75 0 0 0 .75-.75V15Z" />
      <path d="M8.25 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0ZM15.75 6.75a.75.75 0 0 0-.75.75v11.25c0 .087.015.17.042.248a3 3 0 0 1 5.958.464c.853-.175 1.522-.935 1.464-1.883a18.659 18.659 0 0 0-3.732-10.104 1.837 1.837 0 0 0-1.47-.725H15.75Z" />
    </svg>
  );
}

function JobIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path
        fillRule="evenodd"
        d="M6 3.75A2.75 2.75 0 0 1 8.75 1h2.5A2.75 2.75 0 0 1 14 3.75v.443c.573.055 1.14.122 1.706.2C17.053 4.582 18 5.75 18 7.07v3.469c0 1.126-.694 2.191-1.83 2.54-1.952.599-4.024.921-6.17.921s-4.219-.322-6.17-.921C2.694 12.73 2 11.665 2 10.539V7.07c0-1.321.947-2.489 2.294-2.676A41.047 41.047 0 0 1 6 4.193V3.75Zm6.5 0v.325a41.622 41.622 0 0 0-5 0V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25Z"
        clipRule="evenodd"
      />
      <path d="M3 15.055v-.684c2.171.65 4.516.999 7 .999s4.829-.35 7-.999v.684c0 1.347-.985 2.53-2.363 2.686a41.454 41.454 0 0 1-9.274 0C3.985 17.585 3 16.402 3 15.055Z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-5.5-2.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM10 12a5.99 5.99 0 0 0-4.793 2.39A6.483 6.483 0 0 0 10 16.5a6.483 6.483 0 0 0 4.793-2.11A5.99 5.99 0 0 0 10 12Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path
        fillRule="evenodd"
        d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .205 1.251l-1.18 2.044a1 1 0 0 1-1.186.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.113a7.047 7.047 0 0 1 0-2.228L1.821 7.773a1 1 0 0 1-.205-1.251l1.18-2.044a1 1 0 0 1 1.186-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path
        fillRule="evenodd"
        d="M10 2a.75.75 0 0 1 .75.75v.258a33.186 33.186 0 0 1 6.668 1.15.75.75 0 1 1-.336 1.461 31.28 31.28 0 0 0-1.103-.232l1.702 7.545a.75.75 0 0 1-.387.832A4.981 4.981 0 0 1 15 14c-.825 0-1.606-.2-2.294-.556a.75.75 0 0 1-.387-.832l1.77-7.849a31.743 31.743 0 0 0-3.339-.254v11.505a20.01 20.01 0 0 1 3.78.501.75.75 0 1 1-.338 1.462A18.51 18.51 0 0 0 10 17.5c-1.442 0-2.845.165-4.192.481a.75.75 0 1 1-.338-1.462 20.01 20.01 0 0 1 3.78-.501V4.509a31.743 31.743 0 0 0-3.339.254l1.77 7.849a.75.75 0 0 1-.387.832A4.98 4.98 0 0 1 5 14a4.98 4.98 0 0 1-2.294-.556.75.75 0 0 1-.387-.832L4.02 5.067c-.361.07-.718.15-1.103.232a.75.75 0 0 1-.336-1.462 33.186 33.186 0 0 1 6.668-1.15V2.75A.75.75 0 0 1 10 2Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
    </svg>
  );
}

function CategoryIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path
        fillRule="evenodd"
        d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75Z"
        clipRule="evenodd"
      />
      <path d="M14.5 10a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" />
    </svg>
  );
}

const MARKETPLACE_NAV: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: <HomeIcon /> },
  { label: "Messages", href: "/dashboard/messages", icon: <MessageIcon /> },
  { label: "My Listings", href: "/dashboard/listings", icon: <ListingIcon /> },
  { label: "Orders", href: "/dashboard/orders", icon: <OrderIcon /> },
  { label: "Saved", href: "/dashboard/saved", icon: <SavedIcon /> },
];

const EXPLORE_NAV: NavItem[] = [
  { label: "Jobs", href: "/dashboard/jobs", icon: <JobIcon /> },
  { label: "Wholesale", href: "/dashboard/wholesale", icon: <WholesaleIcon /> },
  { label: "Schools", href: "/dashboard/schools", icon: <SchoolIcon /> },
];

const ACCOUNT_NAV: NavItem[] = [
  { label: "Profile", href: "/dashboard/profile", icon: <ProfileIcon /> },
  { label: "Settings", href: "/dashboard/settings", icon: <SettingsIcon /> },
];

const ADMIN_NAV: NavItem[] = [
  { label: "Listing Review", href: "/dashboard/admin-listings", icon: <AdminIcon /> },
  { label: "Users", href: "/dashboard/users", icon: <UsersIcon /> },
  { label: "Categories", href: "/dashboard/categories", icon: <CategoryIcon /> },
];

function NavLink({
  item,
  badge,
  onClick,
}: {
  item: NavItem;
  badge?: number;
  onClick?: () => void;
}) {
  const pathname = usePathname();

  const isActive =
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
        isActive
          ? "bg-light-gray text-near-black"
          : "text-[rgba(0,0,0,0.6)] hover:bg-light-gray hover:text-near-black",
      )}
    >
      <span
        className={cn(
          isActive ? "text-apple-blue" : "text-[rgba(0,0,0,0.3)]",
        )}
      >
        {item.icon}
      </span>

      <span className="flex-1">{item.label}</span>

      {badge != null && badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-apple-blue px-1 text-[11px] font-bold text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

function NavSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SellItemButton({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/dashboard/listings/create"
      onClick={onClick}
      className="flex items-center justify-center rounded-xl bg-apple-blue px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98]"
    >
      + Sell Item
    </Link>
  );
}

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const { user, logout } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);

  const userDisplayName =
    `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() ||
    user?.username ||
    "U";

  const isAdmin = user?.role === "ADMIN" || user?.role === "MODERATOR";

  useEffect(() => {
    import("@/lib/mock/messages").then(({ getTotalUnread }) => {
      setUnreadMessages(getTotalUnread());
    });
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-gray-100 px-5">
        <Link href="/home" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-apple-blue">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z"
                stroke="white"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
              <path
                d="M9 21V13h6v8"
                stroke="white"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <span className="text-base font-semibold tracking-tight text-near-black">
            Sanganai
          </span>
        </Link>
      </div>

      <div className="px-4 pt-4">
        <SellItemButton onClick={onNavClick} />
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
        <NavSection title="Marketplace">
          {MARKETPLACE_NAV.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              badge={
                item.href === "/dashboard/messages"
                  ? unreadMessages
                  : undefined
              }
              onClick={onNavClick}
            />
          ))}
        </NavSection>

        <NavSection title="Explore">
          {EXPLORE_NAV.map((item) => (
            <NavLink key={item.href} item={item} onClick={onNavClick} />
          ))}
        </NavSection>

        {isAdmin && (
          <NavSection title="Admin">
            {ADMIN_NAV.map((item) => (
              <NavLink key={item.href} item={item} onClick={onNavClick} />
            ))}
          </NavSection>
        )}

        <NavSection title="Account">
          {ACCOUNT_NAV.map((item) => (
            <NavLink key={item.href} item={item} onClick={onNavClick} />
          ))}
        </NavSection>
      </nav>

      <div className="border-t border-gray-100 px-3 py-4">
        {user && (
          <Link
            href="/dashboard/profile"
            onClick={onNavClick}
            className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-50"
          >
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-apple-blue/10 text-sm font-bold text-apple-blue">
              {user.profile_picture ? (
                <Image
                  src={user.profile_picture}
                  alt={userDisplayName}
                  fill
                  className="object-cover"
                />
              ) : (
                userDisplayName.charAt(0).toUpperCase()
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">
                {userDisplayName}
              </p>
              <p className="truncate text-xs text-gray-400">{user.email}</p>
            </div>
          </Link>
        )}

        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5 text-gray-400"
          >
            <path
              fillRule="evenodd"
              d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z"
              clipRule="evenodd"
            />
            <path
              fillRule="evenodd"
              d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-1.04a.75.75 0 1 0-1.056-1.062l-2.5 2.5a.75.75 0 0 0 0 1.062l2.5 2.5a.75.75 0 1 0 1.056-1.062l-1.048-1.038h9.546A.75.75 0 0 0 19 10Z"
              clipRule="evenodd"
            />
          </svg>
          Sign out
        </button>
      </div>
    </div>
  );
}

export function DesktopSidebar() {
  return (
    <aside className="hidden border-r border-gray-200 bg-white lg:flex lg:w-60 lg:shrink-0 lg:flex-col">
      <SidebarContent />
    </aside>
  );
}

export interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/40 transition-opacity duration-200 lg:hidden",
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        aria-hidden="true"
        onClick={onClose}
      />

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl transition-transform duration-200 ease-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-4 rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
          aria-label="Close menu"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>

        <SidebarContent onNavClick={onClose} />
      </div>
    </>
  );
}