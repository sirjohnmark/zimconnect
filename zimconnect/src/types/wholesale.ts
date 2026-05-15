export type WholesaleCategory =
  | "agriculture"
  | "electronics"
  | "hardware"
  | "printing-machinery"
  | "catering"
  | "fashion"
  | "mining-equipment"
  | "transportation"
  | "general";

export type WholesaleListing = {
  id: string;
  title: string;
  description?: string;
  price: number;
  priceUnit: string; // e.g. "per kg", "per unit", "per box", "per dozen"
  moq: number; // minimum order quantity
  moqUnit: string; // e.g. "kg", "units", "boxes", "cartons"
  location: string;
  sublocation?: string;
  images: { url: string }[];
  seller: {
    id?: string;
    name?: string;
    phone: string;
  };
  category?: WholesaleCategory;
  delivery: {
    available: boolean;
    note?: string;
  };
  createdAt?: string;
};
