"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/useAuth";
import { hasPermission } from "@/lib/auth/permissions";
import { CreateListingForm } from "@/components/dashboard/CreateListingForm";

export default function CreateListingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login?redirect=/dashboard/listings/create");
      return;
    }
    if (!hasPermission(user.role, "manage:own-listings")) {
      // BUYER — send them to the upgrade flow
      router.replace("/dashboard/upgrade");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || !hasPermission(user.role, "manage:own-listings")) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-apple-blue border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/listings"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 mb-2 -ml-1 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:scale-[0.97] transition-all"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
          </svg>
          My Listings
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Create Listing</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your listing will be live on Sanganai once published.
        </p>
      </div>
      <CreateListingForm />
    </div>
  );
}
