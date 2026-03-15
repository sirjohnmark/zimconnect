import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getListingById } from "@/lib/queries/listings";
import { getAllCategories } from "@/lib/queries/categories";
import EditListingForm from "@/components/forms/EditListingForm";
import type { PageProps } from "@/types";

export const metadata = { title: "Edit listing — ZimConnect" };

export default async function EditListingPage({
  params,
}: PageProps<{ id: string }>) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [listing, categories] = await Promise.all([
    getListingById(id),
    getAllCategories(),
  ]);

  if (!listing) notFound();
  // Treat another user's listing as not found — don't reveal its existence.
  if (listing.user_id !== user.id) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-8">Edit listing</h1>

      <EditListingForm listing={listing} categories={categories} />
    </div>
  );
}
