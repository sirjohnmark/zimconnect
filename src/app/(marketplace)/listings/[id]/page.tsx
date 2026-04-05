"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";
import { SaveButton } from "@/components/marketplace/SaveButton";
import { ReviewsSection } from "@/components/marketplace/ReviewsSection";
import { MOCK_LISTINGS } from "@/lib/mock/listings";
import type { Listing } from "@/types/listing";
import { cn } from "@/lib/utils";

// ─── Condition badge ──────────────────────────────────────────────────────────

const CONDITION_STYLE: Record<string, string> = {
  "new":       "bg-emerald-100 text-emerald-700",
  "like-new":  "bg-teal-100 text-teal-700",
  "good":      "bg-blue-100 text-blue-700",
  "fair":      "bg-amber-100 text-amber-700",
  "for-parts": "bg-red-100 text-red-700",
};
const CONDITION_LABEL: Record<string, string> = {
  "new": "New", "like-new": "Like New", "good": "Good", "fair": "Fair", "for-parts": "For Parts",
};

// ─── WhatsApp helper ──────────────────────────────────────────────────────────

function toWhatsAppHref(phone: string, title: string) {
  const digits = phone.replace(/\D/g, "");
  const intl   = digits.startsWith("263") ? digits : `263${digits.replace(/^0/, "")}`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(`Hi, I'm interested in your listing on ZimConnect: "${title}". Is it still available?`)}`;
}

// ─── Image gallery ────────────────────────────────────────────────────────────

function Gallery({ images, title }: { images: { url: string }[]; title: string }) {
  const [active, setActive] = useState(0);

  return (
    <div className="space-y-2">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gray-100">
        <Image
          src={images[active]?.url ?? ""}
          alt={title}
          fill
          className="object-cover"
          priority
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setActive((i) => (i - 1 + images.length) % images.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setActive((i) => (i + 1) % images.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </button>
          </>
        )}
        {/* Save */}
        <div className="absolute top-3 right-3">
          <SaveButton listingId={images[0] ? "active" : ""} variant="icon" />
        </div>
      </div>
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative shrink-0 h-16 w-20 overflow-hidden rounded-lg border-2 transition-colors",
                i === active ? "border-emerald-500" : "border-transparent hover:border-gray-300",
              )}
            >
              <Image src={img.url} alt={`Photo ${i + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // Try localStorage first, fallback to mock
    let found: Listing | undefined;
    try {
      const raw = localStorage.getItem("zimconnect_listings");
      if (raw) {
        const stored = JSON.parse(raw) as Listing[];
        found = stored.find((l) => l.id === id);
      }
    } catch { /* ignore */ }
    if (!found) found = MOCK_LISTINGS.find((l) => l.id === id);
    if (found) setListing(found);
    else setNotFound(true);
  }, [id]);

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-semibold text-gray-700">Listing not found</p>
        <p className="mt-1 text-sm text-gray-400">This listing may have been removed or the link is incorrect.</p>
        <BackButton href="/listings" label="Back to listings" className="mt-4" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="space-y-6">
        <div className="aspect-[4/3] w-full animate-pulse rounded-2xl bg-gray-100" />
        <div className="space-y-3">
          <div className="h-7 w-3/4 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-1/3 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  const { title, price, currency = "$", location, sublocation, condition, description, images, seller, category, delivery } = listing;

  return (
    <div className="space-y-8">
      <BackButton href="/listings" label="Back to listings" className="-ml-1" />

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Left: gallery + details */}
        <div className="space-y-6">
          <Gallery images={images} title={title} />

          {/* Title & price */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {condition && (
                <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", CONDITION_STYLE[condition])}>
                  {CONDITION_LABEL[condition]}
                </span>
              )}
              {category && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500 capitalize">
                  {category}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl leading-snug">{title}</h1>
            <p className="mt-2 text-3xl font-extrabold text-emerald-600">{currency}{price.toLocaleString()}</p>
            <div className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-500">
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 text-gray-400 shrink-0">
                <path fillRule="evenodd" d="m7.539 14.841.003.003.002.002a.755.755 0 0 0 .912 0l.002-.002.003-.003.012-.009a5.57 5.57 0 0 0 .19-.153 15.173 15.173 0 0 0 2.046-2.082C11.81 13.235 13 11.255 13 9A5 5 0 0 0 3 9c0 2.255 1.19 4.235 2.292 5.597a15.173 15.173 0 0 0 2.046 2.082 8.994 8.994 0 0 0 .19.153l.012.009ZM8 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" clipRule="evenodd" />
              </svg>
              {location}{sublocation ? ` · ${sublocation}` : ""}
            </div>
          </div>

          {/* Description */}
          {description && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-2">
              <p className="text-sm font-bold text-gray-900">About this listing</p>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{description}</p>
            </div>
          )}

          {/* Delivery */}
          {delivery !== undefined && (
            <div className={cn(
              "rounded-2xl border p-4 space-y-1",
              delivery.available
                ? "border-emerald-100 bg-emerald-50"
                : "border-gray-100 bg-gray-50",
            )}>
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 20 20" fill="currentColor" className={cn("h-4 w-4 shrink-0", delivery.available ? "text-emerald-600" : "text-gray-400")}>
                  <path d="M6.5 3A1.5 1.5 0 0 0 5 4.5v.75H3.5A1.5 1.5 0 0 0 2 6.75v7.5A1.5 1.5 0 0 0 3.5 15.75h13A1.5 1.5 0 0 0 18 14.25v-7.5a1.5 1.5 0 0 0-1.5-1.5H15V4.5A1.5 1.5 0 0 0 13.5 3h-7ZM6.5 4.5h7V5.25h-7V4.5ZM3.5 6.75h13v7.5h-13v-7.5Z" />
                </svg>
                <span className={cn("text-sm font-semibold", delivery.available ? "text-emerald-800" : "text-gray-600")}>
                  {delivery.available ? "Delivery available" : "Collection only — no delivery"}
                </span>
              </div>
              {delivery.available && delivery.note && (
                <p className="text-xs text-emerald-700 pl-6">{delivery.note}</p>
              )}
            </div>
          )}

          {/* Reviews */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">
              Seller Reviews
            </h2>
            <ReviewsSection listingId={listing.id} sellerName={seller?.name ?? "Unknown Seller"} />
          </div>
        </div>

        {/* Right: seller card + contact */}
        <div className="space-y-4 lg:sticky lg:top-20 self-start">
          {/* Seller card */}
          {seller?.name && (
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700">
                  {seller.name.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-bold text-gray-900">{seller.name}</p>
                  <p className="text-xs text-gray-400">Seller on ZimConnect</p>
                </div>
              </div>

              {seller.phone && (
                <div className="flex flex-col gap-2.5">
                  <a
                    href={toWhatsAppHref(seller.phone, title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-semibold text-white hover:bg-[#1ebe5d] active:scale-[0.97] transition-all"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    Chat on WhatsApp
                  </a>
                  <a
                    href={`tel:${seller.phone}`}
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-[0.97] transition-all"
                  >
                    <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                    </svg>
                    {seller.phone}
                  </a>
                  <a
                    href="/dashboard/messages"
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-[0.97] transition-all"
                  >
                    <svg className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.43 2.524A41.29 41.29 0 0 1 10 2c2.236 0 4.43.18 6.57.524 1.437.231 2.43 1.49 2.43 2.902v5.148c0 1.413-.993 2.67-2.43 2.902a41.202 41.202 0 0 1-5.183.501.78.78 0 0 0-.528.224l-3.202 3.203A.75.75 0 0 1 6.375 17v-2.136a41.415 41.415 0 0 1-2.945-.34C1.993 14.271 1 13.012 1 11.6V5.426c0-1.413.993-2.67 2.43-2.902Z" clipRule="evenodd" />
                    </svg>
                    Send Message
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Safety tip */}
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 space-y-1.5">
            <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
              </svg>
              Safety Tips
            </p>
            <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
              <li>Meet in a safe, public place</li>
              <li>Inspect item before paying</li>
              <li>Don't send money in advance</li>
              <li>Trust your instincts</li>
            </ul>
          </div>

          {/* Save button */}
          <SaveButton listingId={listing.id} variant="full" />
        </div>
      </div>
    </div>
  );
}
