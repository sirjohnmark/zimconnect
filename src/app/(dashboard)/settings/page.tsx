import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileById } from "@/lib/queries/profiles";
import ProfileForm from "@/components/forms/ProfileForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfileById(user.id);

  if (!profile) {
    // Profile row missing — edge case if Postgres trigger/insert failed at signup.
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Account settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Update your public profile information.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <ProfileForm profile={profile} />
        </div>
      </div>
    </main>
  );
}
