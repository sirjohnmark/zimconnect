export type ListingStatus = "draft" | "active" | "inactive" | "sold" | "expired" | "deleted" | "removed";

/** Status values an admin may assign when moderating a listing. */
export type AdminModerationStatus = "active" | "inactive" | "removed";
export type ListingCondition = "new" | "used_like_new" | "used_good" | "used_fair" | "for_parts";
export type PriceType = "fixed" | "negotiable" | "free" | "contact";

export interface Listing {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number | null;
  price_type: PriceType;
  condition: ListingCondition;
  status: ListingStatus;
  category_id: string;
  user_id: string;
  location: string;
  images: string[];
  views_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

export interface ListingFilters {
  category_id?: string;
  location?: string;
  min_price?: number;
  max_price?: number;
  condition?: ListingCondition;
  query?: string;
  sort?: "newest" | "oldest" | "price_asc" | "price_desc";
  page?: number;
  limit?: number;
}

export type CreateListingInput = Omit<Listing, "id" | "slug" | "user_id" | "views_count" | "created_at" | "updated_at">;
export type UpdateListingInput = Partial<CreateListingInput>;

// ─── Detail-page joined types ──────────────────────────────────────────────

/** One row from the listing_images table. */
export interface ListingImage {
  id: string;
  listing_id: string;
  storage_path: string;
  sort_order: number;
  is_primary: boolean;
}

/** Seller profile fields exposed on the listing detail page. */
export interface SellerProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  location: string | null;
  phone: string | null;
  is_verified: boolean;
  listings_count: number;
}

/** Category fields joined directly onto the listing. */
export interface ListingCategory {
  id: string;
  name: string;
  slug: string;
  /** Raw DB column name — emoji or URL. */
  icon_url: string | null;
}

/**
 * Listing row + listing_images array + seller profile + category.
 * Returned by getListingBySlug for the detail page.
 */
export interface ListingWithDetails extends Omit<Listing, "images"> {
  listing_images: ListingImage[];
  seller: SellerProfile | null;
  category: ListingCategory | null;
}
