export type ListingCondition = "new" | "like-new" | "good" | "fair" | "for-parts";

export type Listing = {
  id: string;
  title: string;
  price: number;
  location: string;
  sublocation?: string; // e.g. "CBD", "Chikanga", "Highlands", "Hintonville"
  condition?: ListingCondition;
  category: string;
  currency?: string;
  description?: string;
  images: { url: string }[];
  seller?: {
    name?: string;
    phone?: string;
  };
  delivery?: {
    available: boolean;
    note?: string; // e.g. "Deliver within Harare only — $5 fee"
  };
};
