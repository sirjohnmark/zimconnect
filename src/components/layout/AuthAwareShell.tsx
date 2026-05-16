"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/useAuth";
import { DesktopSidebar, MobileSidebar } from "@/components/dashboard/Sidebar";
import { TopNav } from "@/components/dashboard/TopNav";

interface Props {
  children: React.ReactNode;
  /** Rendered around children when the user is NOT logged in. */
  guest: (children: React.ReactNode) => React.ReactNode;
}

export function AuthAwareShell({ children, guest }: Props) {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Avoid flashing the wrong nav while auth resolves
  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-apple-blue border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
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

  return <>{guest(children)}</>;
}
