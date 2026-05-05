"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { useAuth } from "@/lib/auth/useAuth";
import { DesktopSidebar, MobileSidebar } from "@/components/dashboard/Sidebar";

function MenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 lg:hidden"
      aria-label="Open navigation menu"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
      </svg>
    </button>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isLoading, isAuthenticated } = useAuthGuard();
  const { user } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  // Gate unverified non-admin users — send them to verify before entering the dashboard
  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;
    const isAdmin    = user.role === "ADMIN" || user.role === "MODERATOR";
    const isVerified = user.is_verified || user.email_verified;
    if (!isAdmin && !isVerified) {
      router.replace(`/verify-email?trigger=1&redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, user, user?.is_verified, user?.email_verified, router, pathname]);

  const isAdmin    = user?.role === "ADMIN" || user?.role === "MODERATOR";
  const isVerified = user?.is_verified || user?.email_verified;
  const pendingVerification = isAuthenticated && !isAdmin && !isVerified;

  if (isLoading || !isAuthenticated || pendingVerification) {
    return (
      <div className="flex h-dvh items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-apple-blue border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-gray-50">
      <DesktopSidebar />
      <MobileSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 lg:hidden">
          <MenuButton onClick={() => setSidebarOpen(true)} />
          <span className="text-base font-bold text-apple-blue">Sanganai</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
