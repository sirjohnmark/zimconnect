import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SearchForm from "@/components/forms/SearchForm";
import MobileMenu from "@/components/layout/MobileMenu";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;
  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("profiles")
      .select("username, display_name")
      .eq("id", user.id)
      .maybeSingle();
    username = data?.display_name ?? data?.username ?? user.email?.split("@")[0] ?? null;
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center h-16 gap-4">

          {/* ── Logo ── */}
          <Link
            href="/"
            className="shrink-0 text-xl font-black tracking-tight text-brand-600"
          >
            ZimConnect<span className="text-accent-500">.</span>
          </Link>

          {/* ── Search (center, desktop) ── */}
          <div className="hidden md:flex flex-1 max-w-xl mx-auto">
            <SearchForm placeholder="Search listings in Zimbabwe…" />
          </div>

          {/* ── Desktop nav ── */}
          <nav className="hidden md:flex items-center gap-1 shrink-0 ml-auto">
            <Link
              href="/search"
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
            >
              Browse
            </Link>

            {user ? (
              <>
                <Link
                  href="/sell"
                  className="ml-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
                >
                  + Post listing
                </Link>
                <Link
                  href="/dashboard"
                  className="ml-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                >
                  {username ?? "Dashboard"}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="ml-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
                >
                  Sign up free
                </Link>
              </>
            )}
          </nav>

          {/* ── Mobile menu (client component) ── */}
          <div className="md:hidden ml-auto">
            <MobileMenu isAuthenticated={!!user} username={username} />
          </div>
        </div>

        {/* ── Mobile search bar (below header row) ── */}
        <div className="md:hidden pb-3">
          <SearchForm placeholder="Search listings…" />
        </div>
      </div>
    </header>
  );
}
