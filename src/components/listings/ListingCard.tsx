import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import type { Listing } from "@/types";

interface ListingCardProps {
  listing: Listing;
  className?: string;
}

function formatPrice(listing: Listing): string | null {
  if (listing.price_type === "free") return "Free";
  if (listing.price_type === "contact" || listing.price === null) return null;
  return `$${listing.price.toLocaleString()}${listing.price_type === "negotiable" ? " (neg.)" : ""}`;
}

export default function ListingCard({ listing, className }: ListingCardProps) {
  const price = formatPrice(listing);
  const thumbnail = listing.images[0] ?? null;

  return (
    <Link
      href={`/listing/${listing.slug}`}
      className={`group flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-green-300 hover:shadow-md transition-all ${className ?? ""}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-4xl select-none">
            📷
          </div>
        )}
        {listing.is_featured && (
          <span className="absolute top-2 left-2 rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-semibold text-yellow-900">
            Featured
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-1 p-3 flex-1">
        <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
          {listing.title}
        </p>

        <div className="mt-auto pt-2 flex items-center justify-between">
          {price ? (
            <span className="text-sm font-semibold text-green-700">{price}</span>
          ) : (
            <span className="text-xs text-gray-400 italic">Contact for price</span>
          )}

          {listing.location && (
            <span className="flex items-center gap-0.5 text-xs text-gray-400 shrink-0 ml-2">
              <MapPin className="w-3 h-3" />
              {listing.location}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
