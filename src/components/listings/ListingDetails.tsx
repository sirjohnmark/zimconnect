import { MapPin, Eye, Calendar } from "lucide-react";
import { formatDate, formatRelativeDate } from "@/lib/utils/format";
import type { ListingWithDetails, PriceType } from "@/types";

interface ListingDetailsProps {
  listing: ListingWithDetails;
}

function formatPrice(price: number | null, priceType: PriceType): string {
  if (priceType === "free") return "Free";
  if (priceType === "contact" || price === null) return "Contact for price";
  const formatted = `$${price.toLocaleString("en-US")}`;
  return priceType === "negotiable" ? `${formatted} (negotiable)` : formatted;
}

export default function ListingDetails({ listing }: ListingDetailsProps) {
  const price = formatPrice(listing.price, listing.price_type);
  const isFree = listing.price_type === "free";
  const isContactOnly = listing.price_type === "contact" || listing.price === null;

  return (
    <div className="space-y-5">
      {/* Featured badge */}
      {listing.is_featured && (
        <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
          ⭐ Featured listing
        </span>
      )}

      {/* Title */}
      <h1 className="text-2xl font-bold leading-snug text-slate-900 sm:text-3xl">
        {listing.title}
      </h1>

      {/* Price */}
      <div>
        {isContactOnly ? (
          <p className="text-lg font-medium italic text-slate-500">{price}</p>
        ) : (
          <p
            className={`text-3xl font-black ${isFree ? "text-green-600" : "text-slate-900"}`}
          >
            {price}
          </p>
        )}
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500 border-t border-slate-100 pt-4">
        {listing.location && (
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 shrink-0" />
            {listing.location}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 shrink-0" />
          <span title={formatDate(listing.created_at)}>
            {formatRelativeDate(listing.created_at)}
          </span>
        </span>
        {listing.views_count > 0 && (
          <span className="flex items-center gap-1.5">
            <Eye className="w-4 h-4 shrink-0" />
            {listing.views_count.toLocaleString()} view
            {listing.views_count !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Description */}
      <div className="border-t border-slate-100 pt-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-3">
          Description
        </h2>
        <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed">
          {listing.description}
        </div>
      </div>
    </div>
  );
}
