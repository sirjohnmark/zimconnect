export type ListingCondition = "new" | "like-new" | "good" | "fair" | "for-parts";

export type Listing = {
  id: string;
  title: string;
  price: number;
  location: string;
  condition: ListingCondition;
  category: string;
  description?: string;
  images: { url: string }[];
};
