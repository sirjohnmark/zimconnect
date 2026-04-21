"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";
import { SaveButton } from "@/components/marketplace/SaveButton";
import { ReviewsSection } from "@/components/marketplace/ReviewsSection";
import { getListing } from "@/lib/api/listings";
import type { Listing, ListingCondition } from "@/types/listing";
import { cn } from "@/lib/utils";

// ─── Condition badge ──────────────────────────────────────────────────────────

const CONDITION_STYLE: Record<ListingCondition, string> = {
  NEW:      "bg-apple-blue/10 text-apple-blue",
  LIKE_NEW: "bg-teal-100 text-teal-700",
  GOOD:     "bg-blue-100 text-blue-700",
  FAIR:     "bg-amber-100 text-amber-700",
  POOR:     "bg-red-100 text-red-700",
};

const CONDITION_LABEL: Record<ListingCondition, string> = {
  NEW: "New", LIKE_NEW: "Like New", GOOD: "Good", FAIR: "Fair", POOR: "Poor",
};

function formatCity(code: string): string {
  return code.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatPrice(price: string, currency: string): string {
  const num = parseFloat(price);
  return `${currency} ${isNaN(num) ? price : num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// ─── WhatsApp helper ──────────────────────────────────────────────────────────

function toWhatsAppHref(phone: string, title: string) {
  const digits = phone.replace(/\D/g, "");
  const intl   = digits.startsWith("263") ? digits : `263${digits.replace(/^0/, "")}`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(`Hi, I'm interested in your listing on Sanganai: "${title}". Is it still available?`)}`;
}

// ─── Image gallery ────────────────────────────────────────────────────────────

function Gallery({ images, primaryImage, title }: { images: { image: string }[]; primaryImage: string | null; title: string }) {
  const allImages = primaryImage
    ? [{ image: primaryImage }, ...images.filter((img) => img.image !== primaryImage)]
    : images;

  const [active, setActive] = useState(0);

  if (allImages.length === 0) {
    return (
      <div className="aspect-[4/3] w-full flex items-center justify-center rounded-2xl bg-gray-100">
        <svg className="h-16 w-16 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5a1.5 1.5 0 001.5 1.5z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gray-100">
        <Image
          src={allImages[active].image}
          alt={title}
          fill
          className="object-cover"
          priority
        />
        {allImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setActive((i) => (i - 1 + allImages.length) % allImages.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setActive((i) => (i + 1) % allImages.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </button>
          </>
        )}
      </div>
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {allImages.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative shrink-0 h-16 w-20 overflow-hidden rounded-lg border-2 transition-colors",
                i === active ? "border-apple-blue" : "border-transparent hover:border-gray-300",
              )}
            >
              <Image src={img.image} alt={`Photo ${i + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) { setNotFound(true); return; }

    getListing(numericId)
      .then(setListing)
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("404") || msg.includes("not found")) setNotFound(true);
        else setError("Failed to load listing. Please try again.");
      });
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => { setError(null); setListing(null); }}
          className="mt-3 text-sm font-medium text-apple-blue underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!listing) return <PageSkeleton />;

  const { id: listingId, title, price, currency, location, condition, description, images, primary_image, owner, category, is_featured } = listing;

  return (
    <div className="space-y-8">
      <BackButton href="/listings" label="Back to listings" className="-ml-1" />

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Left: gallery + details */}
        <div className="space-y-6">
          <Gallery images={images} primaryImage={primary_image} title={title} />

          {/* Title & price */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", CONDITION_STYLE[condition])}>
                {CONDITION_LABEL[condition]}
              </span>
              {is_featured && (
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-700">
                  Featured
                </span>
              )}
              {category && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
                  {category.name}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl leading-snug">{title}</h1>
            <p className="mt-2 text-3xl font-extrabold text-apple-blue">{formatPrice(price, currency)}</p>
            <div className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-500">
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 text-gray-400 shrink-0">
                <path fillRule="evenodd" d="m7.539 14.841.003.003.002.002a.755.755 0 0 0 .912 0l.002-.002.003-.003.012-.009a5.57 5.57 0 0 0 .19-.153 15.173 15.173 0 0 0 2.046-2.082C11.81 13.235 13 11.255 13 9A5 5 0 0 0 3 9c0 2.255 1.19 4.235 2.292 5.597a15.173 15.173 0 0 0 2.046 2.082 8.994 8.994 0 0 0 .19.153l.012.009ZM8 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" clipRule="evenodd" />
              </svg>
              {formatCity(location)}
            </div>
          </div>

          {/* Description */}
          {description && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-2">
              <p className="text-sm font-bold text-gray-900">About this listing</p>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{description}</p>
            </div>
          )}

          {/* Reviews */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Seller Reviews</h2>
            <ReviewsSection
              listingId={String(listingId)}
              sellerName={owner ? owner.username : "Unknown Seller"}
            />
          </div>
        </div>

        {/* Right: seller card + contact */}
        <div className="space-y-4 lg:sticky lg:top-20 self-start">
          {/* Seller card */}
          {owner && (
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-3">
                {owner.profile_picture ? (
                  <Image
                    src={owner.profile_picture}
                    alt={owner.username}
                    width={48}
                    height={48}
                    className="h-12 w-12 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-apple-blue/10 text-lg font-bold text-apple-blue">
                    {owner.username.charAt(0).toUpperCase()}
                  </span>
                )}
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {owner.username}
                  </p>
                  <p className="text-xs text-gray-400">Seller on Sanganai</p>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                {/* Contact functionality removed - ListingOwner type doesn't include phone */}
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
              <li>Don&apos;t send money in advance</li>
              <li>Trust your instincts</li>
            </ul>
          </div>

          {/* Save button */}
          <SaveButton listingId={String(listingId)} variant="full" />
        </div>
      </div>
    </div>
  );
}
