import { cache } from "react";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Image from "next/image";
import { ChevronLeft, MapPin, Eye, Clock, Tag } from "lucide-react";
import type { Metadata } from "next";
import { getListingBySlug, getSimilarListings } from "@/lib/queries/listings";
import { getListingImageUrl } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import ListingGallery from "@/components/listings/ListingGallery";
import SellerContactCard from "@/components/listings/SellerContactCard";
import ListingCard from "@/components/listings/ListingCard";
import type { PageProps, Listing } from "@/types";

export const revalidate = 60;

// Cache the DB call so generateMetadata and the page share one query per request.
const fetchListing = cache(getListingBySlug);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatPrice(price: number | null, priceType: string): string {
  if (priceType === "free") return "Free";
  if (priceType === "contact" || price === null) return "Contact for price";
  const formatted = `$${price.toLocaleString()}`;
  return priceType === "negotiable" ? `${formatted} · Negotiable` : formatted;
}

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" });
}

const CONDITION_LABELS: Record<string, string> = {
  new: "New",
  used_like_new: "Like new",
  used_good: "Good condition",
  used_fair: "Fair condition",
  for_parts: "For parts",
};

// ---------------------------------------------------------------------------
// SEO metadata
// ---------------------------------------------------------------------------
export async function generateMetadata({
  params,
}: PageProps<{ slug: string }>): Promise<Metadata> {
  const { slug } = await params;
  const listing = await fetchListing(slug);
  if (!listing) return { title: "Listing not found — ZimConnect" };

  const description =
    listing.description.length > 155
      ? listing.description.slice(0, 152) + "…"
      : listing.description;

  const primaryImage =
    listing.listing_images.find((img) => img.is_primary) ??
    listing.listing_images[0] ??
    null;

  const ogImage = primaryImage
    ? getListingImageUrl(primaryImage.storage_path)
    : undefined;

  return {
    title: `${listing.title} | ZimConnect`,
    description,
    openGraph: {
      title: listing.title,
      description,
      images: ogImage ? [{ url: ogImage }] : [],
      type: "website",
      siteName: "ZimConnect",
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function ListingPage({
  params,
}: PageProps<{ slug: string }>) {
  const { slug } = await params;
  const listing = await fetchListing(slug);
  if (!listing) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [similar] = await Promise.all([
    getSimilarListings(listing.category_id, listing.id).catch(() => []),
  ]);

  const { category, seller } = listing;
  const isSeller = user?.id === listing.user_id;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">

        {/* ── SECTION A: Breadcrumb ───────────────────────────────────────── */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm flex-wrap">
          <Link href="/" className="text-slate-500 hover:text-brand-600 transition-colors">
            Home
          </Link>
          <span className="text-slate-300" aria-hidden="true">/</span>
          {category && (
            <>
              <Link
                href={`/category/${category.slug}`}
                className="text-slate-500 hover:text-brand-600 transition-colors"
              >
                {category.icon_url && (
                  <span className="mr-1" aria-hidden="true">{category.icon_url}</span>
                )}
                {category.name}
              </Link>
              <span className="text-slate-300" aria-hidden="true">/</span>
            </>
          )}
          <span className="text-slate-700 font-medium truncate max-w-[200px] sm:max-w-sm">
            {listing.title.length > 40 ? listing.title.slice(0, 40) + "…" : listing.title}
          </span>
        </nav>

        {/* Back link — mobile only */}
        <Link
          href={category ? `/category/${category.slug}` : "/search"}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-5 sm:hidden transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Link>

        {/* ── Main grid ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">

          {/* Left column */}
          <div className="space-y-6">

            {/* ── SECTION B: Gallery ──────────────────────────────────────── */}
            <ListingGallery images={listing.listing_images} title={listing.title} />

            {/* ── SECTION C: Title, price, badges ─────────────────────────── */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {listing.is_featured && (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                    ⭐ Featured
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  <Tag className="w-3 h-3" />
                  {CONDITION_LABELS[listing.condition] ?? listing.condition}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-slate-900 leading-snug">
                {listing.title}
              </h1>

              {/* Price */}
              <p className={`text-2xl font-bold ${
                listing.price_type === "free"
                  ? "text-green-600"
                  : listing.price_type === "contact"
                  ? "text-slate-500 text-lg"
                  : "text-slate-900"
              }`}>
                {formatPrice(listing.price, listing.price_type)}
              </p>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-500">
                {listing.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {listing.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  {formatRelativeDate(listing.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 shrink-0" />
                  {listing.views_count.toLocaleString()} views
                </span>
              </div>
            </div>

            {/* ── SECTION D: Description ───────────────────────────────────── */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                Description
              </h2>
              <div className="text-sm text-slate-700 leading-relaxed">
                {listing.description.split("\n").map((line, i) => (
                  <Fragment key={i}>
                    {line}
                    <br />
                  </Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Right column — sticky on desktop */}
          <div className="space-y-4 lg:sticky lg:top-24">

            {/* ── SECTION E: Seller contact card ──────────────────────────── */}
            {seller ? (
              isSeller ? (
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Your listing</p>
                  <Link
                    href={`/listings/${listing.id}/edit`}
                    className="flex w-full items-center justify-center rounded-xl border border-brand-600 px-4 py-3 text-sm font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    Edit listing
                  </Link>
                </div>
              ) : (
                <SellerContactCard
                  seller={seller}
                  listingTitle={listing.title}
                  listingId={listing.id}
                  currentUserId={user?.id ?? null}
                />
              )
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 text-center shadow-sm">
                Seller information unavailable
              </div>
            )}

            {/* Category card */}
            {category && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500 mb-1">Category</p>
                <Link
                  href={`/category/${category.slug}`}
                  className="flex items-center gap-2 text-sm font-medium text-slate-800 hover:text-brand-600 transition-colors"
                >
                  {category.icon_url && (
                    <span aria-hidden="true">{category.icon_url}</span>
                  )}
                  {category.name}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── SECTION F: Similar listings ────────────────────────────────── */}
        {similar.length > 0 && (
          <section className="mt-12 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">More like this</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {similar.map((item) => {
                // Resolve display image
                const primaryImg =
                  item.listing_images.find((i) => i.is_primary) ??
                  item.listing_images[0] ??
                  null;
                const imageUrl = primaryImg
                  ? getListingImageUrl(primaryImg.storage_path)
                  : null;

                // Cast to Listing-compatible shape for ListingCard
                const cardListing = {
                  ...item,
                  images: imageUrl ? [imageUrl] : [],
                  status: "active",
                  condition: "used_good",
                  is_featured: false,
                  category_id: listing.category_id,
                  user_id: "",
                  views_count: 0,
                  created_at: "",
                  updated_at: "",
                  expires_at: null,
                  description: "",
                } as unknown as Listing;

                return <ListingCard key={item.id} listing={cardListing} />;
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
