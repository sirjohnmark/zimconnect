"use client";

import { Navbar } from "@/components/layout/Navbar";
import { AuthAwareShell } from "@/components/layout/AuthAwareShell";

function GuestMarketplace({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 flex-1">
        {children}
      </div>
    </div>
  );
}

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthAwareShell guest={(c) => <GuestMarketplace>{c}</GuestMarketplace>}>
      {children}
    </AuthAwareShell>
  );
}
