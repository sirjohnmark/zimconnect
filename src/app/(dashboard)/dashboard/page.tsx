import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getListingsByUser } from "@/lib/queries/listings";
import { getAllCategories } from "@/lib/queries/categories";
import { getProfileById } from "@/lib/queries/profiles";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardStats from "@/components/dashboard/DashboardStats";
import ListingsTable from "@/components/dashboard/ListingsTable";

export const metadata = { title: "Dashboard — ZimConnect" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [listings, categories, profile] = await Promise.all([
    getListingsByUser(user.id, "all"),
    getAllCategories(),
    getProfileById(user.id),
  ]);

  const displayName =
    profile?.display_name ??
    profile?.username ??
    user.email?.split("@")[0] ??
    "there";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <DashboardHeader displayName={displayName} listingCount={listings.length} />
      <section>
        <h2 className="text-base font-semibold text-slate-700 mb-4">Overview</h2>
        <DashboardStats userId={user.id} />
      </section>
      <section>
        <h2 className="text-base font-semibold text-slate-700 mb-4">Your listings</h2>
        <ListingsTable listings={listings} categories={categories} />
      </section>
    </div>
  );
}
