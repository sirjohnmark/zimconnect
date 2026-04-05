import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SaveButton } from "@/components/marketplace/SaveButton";
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
    <svg className="h-3 w-3 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
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

// ─── WhatsApp link helper ─────────────────────────────────────────────────────

function toWhatsAppHref(phone: string, title: string): string {
  // Normalise to international format: strip non-digits, remove leading 0, prepend 263
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("263") ? digits : `263${digits.replace(/^0/, "")}`;
  const text = encodeURIComponent(`Hi, I'm interested in your listing on ZimConnect: "${title}". Is it still available?`);
  return `https://wa.me/${intl}?text=${text}`;
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
  const { id, title, price, currency = "$", location, sublocation, condition, description, images, seller, delivery } = listing;
  const destination = href ?? `/listings/${id}`;
  const coverImage = images[0]?.url ?? null;
  const phone = seller?.phone;

  return (
    <div
      className={cn(
        "group flex flex-col rounded-xl bg-white",
        "border border-gray-200 shadow-sm",
        "transition-all duration-200 ease-out",
        "hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300",
        "overflow-hidden",
        className,
      )}
    >
      {/* ── Clickable listing area ── */}
      <Link
        href={destination}
        className="flex flex-col flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        aria-label={`${title} — ${currency}${price.toLocaleString()} in ${location}`}
      >
        {/* Image */}
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
          {condition && (
            <div className="absolute bottom-2 left-2">
              <ConditionBadge condition={condition} />
            </div>
          )}
          {/* Save button */}
          <div className="absolute top-2 right-2">
            <SaveButton listingId={id} variant="icon" />
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 leading-snug group-hover:text-emerald-700 transition-colors duration-150">
            {title}
          </h3>
          {description && (
            <p className="line-clamp-2 text-xs text-gray-500 leading-relaxed">
              {description}
            </p>
          )}
          <p className="text-lg font-bold text-emerald-600 leading-none">
            {currency}{price.toLocaleString()}
          </p>
          <div className="flex items-center justify-between gap-2 mt-auto pt-1.5">
            <div className="flex items-center gap-1 text-xs text-gray-400 min-w-0">
              <PinIcon />
              <span className="truncate">
                {location}{sublocation ? ` · ${sublocation}` : ""}
              </span>
            </div>
            {delivery?.available && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-100">
                <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3" aria-hidden="true">
                  <path d="M1.5 3.5A.5.5 0 0 1 2 3h8a.5.5 0 0 1 .5.5V5h1.2a.5.5 0 0 1 .4.2l1.8 2.4a.5.5 0 0 1 .1.3V10a.5.5 0 0 1-.5.5H13a2 2 0 0 1-4 0H5a2 2 0 0 1-4 0H.5A.5.5 0 0 1 0 10V4a.5.5 0 0 1 .5-.5h1v.5H1.5v-.5Zm1 7a1 1 0 1 0 2 0 1 1 0 0 0-2 0Zm7.5 0a1 1 0 1 0 2 0 1 1 0 0 0-2 0Z" />
                </svg>
                Delivery
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* ── Seller contact buttons ── */}
      {phone && (
        <div className="flex gap-2 border-t border-gray-100 px-4 py-3">
          {/* Call button */}
          <a
            href={`tel:${phone}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            aria-label="Call seller"
          >
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
            </svg>
            Call
          </a>

          {/* WhatsApp button */}
          <a
            href={toWhatsAppHref(phone, title)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#25D366] py-2 text-xs font-semibold text-white hover:bg-[#1ebe5d] active:bg-[#18a850] transition-colors"
            aria-label="Contact seller on WhatsApp"
          >
            <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}
