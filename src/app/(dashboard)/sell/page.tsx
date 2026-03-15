import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllCategories } from "@/lib/queries/categories";
import ListingForm from "@/components/forms/ListingForm";

export const metadata = {
  title: "Post a listing — ZimConnect",
};

export default async function SellPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/sell");

  const categories = await getAllCategories();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Post a listing</h1>
          <p className="mt-1 text-sm text-gray-500">
            Fill in the details below. Your listing will be live immediately.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
          <ListingForm categories={categories} />
        </div>
      </div>
    </main>
  );
}
