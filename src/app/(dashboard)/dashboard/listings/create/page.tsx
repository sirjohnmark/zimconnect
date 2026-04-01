import type { Metadata } from "next";
import { CreateListingForm } from "@/components/dashboard/CreateListingForm";

export const metadata: Metadata = { title: "Create Listing" };

export default function CreateListingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Create Listing</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your listing will be live on ZimConnect once published.
        </p>
      </div>
      <CreateListingForm />
    </div>
  );
}
