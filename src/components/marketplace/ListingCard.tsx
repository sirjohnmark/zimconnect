import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SaveButton } from "@/components/marketplace/SaveButton";
import type { Listing, ListingCondition } from "@/types/listing";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CONDITION_LABEL: Record<ListingCondition, string> = {
  NEW: "New", LIKE_NEW: "Like New", GOOD: "Good", FAIR: "Fair", POOR: "Poor",
};

const CONDITION_STYLE: Record<ListingCondition, string> = {
  NEW:      "bg-apple-blue/10 text-apple-blue",
  LIKE_NEW: "bg-teal-100 text-teal-700",
  GOOD:     "bg-blue-100 text-blue-700",
  FAIR:     "bg-amber-100 text-amber-700",
  POOR:     "bg-red-100 text-red-700",
};

function formatCity(code: string): string {
  return code.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatPrice(price: string, currency: string): string {
  const num = parseFloat(price);
  return `${currency} ${isNaN(num) ? price : num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function PinIcon() {
  return (
    <svg className="h-3 w-3 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M8 1.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9ZM2 6a6 6 0 1 1 10.743 3.685l-3.45 4.6a1.6 1.6 0 0 1-2.586 0l-3.45-4.6A5.97 5.97 0 0 1 2 6Zm6 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
    </svg>
  );
}

function ImageFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-light-gray">
      <svg className="h-10 w-10 text-[rgba(0,0,0,0.2)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5a1.5 1.5 0 001.5 1.5z" />
      </svg>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface ListingCardProps {
  listing: Listing;
  href?: string;
  imageAspect?: "square" | "4/3" | "16/9";
  className?: string;
}

const IMAGE_ASPECT: Record<NonNullable<ListingCardProps["imageAspect"]>, string> = {
  square: "aspect-square", "4/3": "aspect-[4/3]", "16/9": "aspect-video",
};

export function ListingCard({ listing, href, imageAspect = "4/3", className }: ListingCardProps) {
  const { id, title, price, currency, location, condition, description, images, primary_image, category, is_featured } = listing;
  const destination = href ?? `/listings/${id}`;
  const coverImage  = primary_image ?? images?.[0]?.image ?? null;

  return (
    <div className={cn(
      "group flex flex-col rounded-lg bg-white border border-border-base shadow-sm overflow-hidden",
      "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:border-[rgba(0,0,0,0.2)]",
      className,
    )}>
      <Link
        href={destination}
        className="flex flex-col flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue focus-visible:ring-offset-2"
        aria-label={`${title} — ${formatPrice(price, currency)} in ${formatCity(location)}`}
      >
        {/* Image */}
        <div className={cn("relative w-full overflow-hidden bg-light-gray", IMAGE_ASPECT[imageAspect])}>
          {coverImage ? (
            <Image
              src={coverImage}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-150 group-hover:scale-105"
            />
          ) : (
            <ImageFallback />
          )}

          <div className="absolute bottom-2 left-2 flex gap-1.5">
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold", CONDITION_STYLE[condition])}>
              {CONDITION_LABEL[condition]}
            </span>
            {is_featured && (
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">
                Featured
              </span>
            )}
          </div>

          <div className="absolute top-2 right-2">
            <SaveButton listingId={String(id)} variant="icon" />
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <h3 className="line-clamp-2 text-sm font-semibold text-near-black leading-snug group-hover:text-apple-blue transition-colors duration-150">
            {title}
          </h3>
          {description && (
            <p className="line-clamp-2 text-xs text-[rgba(0,0,0,0.48)] leading-relaxed">{description}</p>
          )}
          <p className="text-lg font-semibold text-near-black leading-none">
            {formatPrice(price, currency)}
          </p>
          <div className="flex items-center justify-between gap-2 mt-auto pt-1.5">
            <div className="flex items-center gap-1 text-xs text-[rgba(0,0,0,0.48)] min-w-0">
              <PinIcon />
              <span className="truncate">{formatCity(location)}</span>
            </div>
            {category && (
              <span className="text-xs text-[rgba(0,0,0,0.48)] truncate shrink-0">{category.name}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
