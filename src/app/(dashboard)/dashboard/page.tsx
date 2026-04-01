import type { Metadata } from "next";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard" };

const STATS = [
  { label: "Active Listings", value: "12" },
  { label: "Total Views",     value: "3,240" },
  { label: "Unread Messages", value: "5" },
  { label: "Saved Items",     value: "8" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Overview</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map(({ label, value }) => (
          <Card key={label} padding="md">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {label}
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
