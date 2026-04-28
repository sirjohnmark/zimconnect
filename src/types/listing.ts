export type ListingCondition = "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "POOR";
export type ListingStatus   = "DRAFT" | "PENDING" | "ACTIVE" | "SOLD" | "ARCHIVED" | "REJECTED";
export type ListingCurrency = "USD" | "ZWL";

export type ListingImage = {
  id: number;
  image: string;  // URL
  caption: string;
  display_order: number;
  is_primary: boolean;
};

export type ListingOwner = {
  id: number;
  username: string;
  profile_picture: string | null;
  created_at?: string;
};

export type ListingCategory = {
  /** Present in the nested listing response — use when pre-populating an edit form. */
  id?: number;
  name: string;
  slug: string;
};

export type Listing = {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: string;            // decimal string e.g. "5000.00"
  currency: ListingCurrency;
  condition: ListingCondition;
  status: ListingStatus;
  location: string;         // Zimbabwe city code e.g. "HARARE"
  category: ListingCategory;
  owner: ListingOwner;
  images: ListingImage[];
  primary_image: string | null;   // present in list view
  is_featured: boolean;
  views_count: number;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};
