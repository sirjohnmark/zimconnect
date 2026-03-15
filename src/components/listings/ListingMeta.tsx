import Link from "next/link";
import { MapPin, Tag, Layers } from "lucide-react";
import type { ListingWithDetails, ListingCondition } from "@/types";

interface ListingMetaProps {
  listing: ListingWithDetails;
}

const CONDITION_LABELS: Record<ListingCondition, string> = {
  new: "New",
  used_like_new: "Used — Like New",
  used_good: "Used — Good",
  used_fair: "Used — Fair",
  for_parts: "For Parts / Not Working",
};

interface MetaRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function MetaRow({ icon, label, value }: MetaRowProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <span className="mt-0.5 text-slate-400 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-0.5">
          {label}
        </p>
        <div className="text-sm font-medium text-slate-800">{value}</div>
      </div>
    </div>
  );
}

export default function ListingMeta({ listing }: ListingMetaProps) {
  const { category } = listing;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">Listing details</h3>

      <div className="divide-y divide-slate-100">
        {/* Condition */}
        <MetaRow
          icon={<Layers className="w-4 h-4" />}
          label="Condition"
          value={
            <span>{CONDITION_LABELS[listing.condition] ?? listing.condition}</span>
          }
        />

        {/* Location */}
        {listing.location && (
          <MetaRow
            icon={<MapPin className="w-4 h-4" />}
            label="Location"
            value={
              <Link
                href={`/search?location=${encodeURIComponent(listing.location)}`}
                className="text-brand-600 hover:text-brand-700 hover:underline transition-colors"
              >
                {listing.location}
              </Link>
            }
          />
        )}

        {/* Category */}
        {category && (
          <MetaRow
            icon={<Tag className="w-4 h-4" />}
            label="Category"
            value={
              <Link
                href={`/category/${category.slug}`}
                className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-700 hover:underline transition-colors"
              >
                {category.icon_url && (
                  <span aria-hidden="true">{category.icon_url}</span>
                )}
                {category.name}
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
