import Link from "next/link";
import { PlusCircle, LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth";

interface DashboardHeaderProps {
  displayName: string;
  listingCount: number;
}

export default function DashboardHeader({ displayName, listingCount }: DashboardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {displayName}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {listingCount === 0
            ? "You have no listings yet — post one to get started."
            : `You have ${listingCount} listing${listingCount === 1 ? "" : "s"}.`}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/sell"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Post listing
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}
