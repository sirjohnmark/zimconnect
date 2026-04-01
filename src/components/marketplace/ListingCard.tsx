import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Listing, ListingCondition } from "@/types/listing";

// ─── Condition badge ──────────────────────────────────────────────────────────

const CONDITION_LABEL: Record<ListingCondition, string> = {
  "new": "New",
  "like-new": "Like New",
  "good": "Good",
  "fair": "Fair",
  "for-parts": "For Parts",
};

const CONDITION_STYLE: Record<ListingCondition, string> = {
  "new": "bg-emerald-100 text-emerald-700",
  "like-new": "bg-teal-100 text-teal-700",
  "good": "bg-blue-100 text-blue-700",
  "fair": "bg-amber-100 text-amber-700",
  "for-parts": "bg-red-100 text-red-700",
};

function ConditionBadge({ condition }: { condition: ListingCondition }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
        CONDITION_STYLE[condition],
      )}
    >
      {CONDITION_LABEL[condition]}
    </span>
  );
}

// ─── Location pin icon ────────────────────────────────────────────────────────

function PinIcon() {
  return (
    <svg
      className="h-3 w-3 shrink-0"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M8 1.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9ZM2 6a6 6 0 1 1 10.743 3.685l-3.45 4.6a1.6 1.6 0 0 1-2.586 0l-3.45-4.6A5.97 5.97 0 0 1 2 6Zm6 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ─── Fallback image ───────────────────────────────────────────────────────────

function ImageFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-100">
      <svg
        className="h-10 w-10 text-gray-300"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5a1.5 1.5 0 001.5 1.5z"
        />
      </svg>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface ListingCardProps {
  listing: Listing;
  /** href to navigate to. Defaults to /listings/[id] */
  href?: string;
  /** Aspect ratio of the image area. Defaults to "4/3". */
  imageAspect?: "square" | "4/3" | "16/9";
  className?: string;
}

const IMAGE_ASPECT: Record<NonNullable<ListingCardProps["imageAspect"]>, string> = {
  square: "aspect-square",
  "4/3": "aspect-[4/3]",
  "16/9": "aspect-video",
};

export function ListingCard({
  listing,
  href,
  imageAspect = "4/3",
  className,
}: ListingCardProps) {
  const { id, title, price, currency = "$", location, condition, description, images } = listing;
  const destination = href ?? `/listings/${id}`;
  const coverImage = images[0]?.url ?? null;

  return (
    <Link
      href={destination}
      className={cn(
        "group flex flex-col rounded-xl bg-white",
        "border border-gray-200 shadow-sm",
        // Hover: lift + deeper shadow
        "transition-all duration-200 ease-out",
        "hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300",
        // Focus ring for keyboard nav
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
        "overflow-hidden",
        className,
      )}
      aria-label={`${title} — ${currency}${price.toLocaleString()} in ${location}`}
    >
      {/* ── Image ── */}
      <div className={cn("relative w-full overflow-hidden bg-gray-100", IMAGE_ASPECT[imageAspect])}>
        {coverImage ? (
          <Image
            src={coverImage}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <ImageFallback />
        )}

        {/* Condition badge — overlaid on image, hidden when not set */}
        {condition && (
          <div className="absolute bottom-2 left-2">
            <ConditionBadge condition={condition} />
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {/* Title */}
        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 leading-snug group-hover:text-emerald-700 transition-colors duration-150">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="line-clamp-2 text-xs text-gray-500 leading-relaxed">
            {description}
          </p>
        )}

        {/* Price */}
        <p className="text-lg font-bold text-emerald-600 leading-none">
          {currency}{price.toLocaleString()}
        </p>

        {/* Location */}
        <div className="flex items-center gap-1 text-xs text-gray-400 mt-auto pt-1.5">
          <PinIcon />
          <span className="truncate">{location}</span>
        </div>
      </div>
    </Link>
  );
}
