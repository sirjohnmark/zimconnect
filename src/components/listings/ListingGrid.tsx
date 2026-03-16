import ListingCard from "@/components/listings/ListingCard";
import type { Listing } from "@/types";

interface ListingGridProps {
  listings: Listing[];
  className?: string;
}

export default function ListingGrid({ listings, className }: ListingGridProps) {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className ?? ""}`}
    >
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
