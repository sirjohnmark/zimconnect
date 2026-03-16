import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { getListingBySlug } from "@/lib/queries/listings";
import { getListingImageUrl } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import ListingGallery from "@/components/listings/ListingGallery";
import ListingDetails from "@/components/listings/ListingDetails";
import ListingMeta from "@/components/listings/ListingMeta";
import SellerContactCard from "@/components/listings/SellerContactCard";
import type { PageProps } from "@/types";

// Cache the DB call so generateMetadata and the page component share one query
// per request rather than hitting Supabase twice.
const fetchListing = cache(getListingBySlug);

// ─── SEO metadata ─────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: PageProps<{ slug: string }>): Promise<Metadata> {
  const { slug } = await params;
  const listing = await fetchListing(slug);

  if (!listing) {
    return { title: "Listing not found — ZimConnect" };
  }

  const description =
    listing.description.length > 160
      ? listing.description.slice(0, 157) + "…"
      : listing.description;

  // Use the primary image as the OG image if available.
  const primaryImage =
    listing.listing_images.find((img) => img.is_primary) ??
    listing.listing_images[0] ??
    null;

  const ogImage = primaryImage
    ? getListingImageUrl(primaryImage.storage_path)
    : undefined;

  return {
    title: `${listing.title} — ZimConnect`,
    description,
    openGraph: {
      title: listing.title,
      description,
      images: ogImage ? [{ url: ogImage }] : [],
      type: "website",
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function ListingPage({
  params,
}: PageProps<{ slug: string }>) {
  const { slug } = await params;
  const listing = await fetchListing(slug);

  if (!listing) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { category, seller } = listing;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* ─── Breadcrumb ────────────────────────────────────────────────── */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm">
          <Link
            href="/"
            className="text-slate-500 hover:text-brand-600 transition-colors"
          >
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
                  <span className="mr-1" aria-hidden="true">
                    {category.icon_url}
                  </span>
                )}
                {category.name}
              </Link>
              <span className="text-slate-300" aria-hidden="true">/</span>
            </>
          )}
          <span className="text-slate-700 font-medium truncate max-w-[200px] sm:max-w-xs">
            {listing.title}
          </span>
        </nav>

        {/* ─── Back link (mobile) ─────────────────────────────────────────── */}
        <Link
          href={category ? `/category/${category.slug}` : "/search"}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-5 sm:hidden transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Link>

        {/* ─── Main grid ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
          {/* Left column: gallery + details */}
          <div className="space-y-8">
            <ListingGallery
              images={listing.listing_images}
              title={listing.title}
            />
            <ListingDetails listing={listing} />
          </div>

          {/* Right column: seller + meta (sticky on desktop) */}
          <div className="space-y-4 lg:sticky lg:top-24">
            {seller ? (
              <SellerContactCard
                seller={seller}
                listingTitle={listing.title}
                listingId={listing.id}
                currentUserId={user?.id ?? null}
              />
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 text-center shadow-sm">
                Seller information unavailable
              </div>
            )}
            <ListingMeta listing={listing} />
          </div>
        </div>
      </div>
    </div>
  );
}
