"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { useAuth } from "@/lib/auth/useAuth";
import { DesktopSidebar, MobileSidebar } from "@/components/dashboard/Sidebar";
import { TopNav } from "@/components/dashboard/TopNav";

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
        <TopNav onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
