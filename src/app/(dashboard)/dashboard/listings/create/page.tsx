import type { Metadata } from "next";
import Link from "next/link";
import { CreateListingForm } from "@/components/dashboard/CreateListingForm";

export const metadata: Metadata = { title: "Create Listing" };

export default function CreateListingPage() {
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
