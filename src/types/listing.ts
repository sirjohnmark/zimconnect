// TODO: implement — align with DB schema
export type ListingStatus = "draft" | "active" | "sold" | "expired" | "deleted";
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
