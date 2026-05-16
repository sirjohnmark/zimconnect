"use client";

import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { AuthAwareShell } from "@/components/layout/AuthAwareShell";

function GuestMarketing({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthAwareShell guest={(c) => <GuestMarketing>{c}</GuestMarketing>}>
      {children}
    </AuthAwareShell>
  );
}
