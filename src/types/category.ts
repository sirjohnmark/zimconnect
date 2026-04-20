export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string;
  parent: number | null;
  icon: string;
  image: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  children?: Category[];
  /** Optional listing count shown on the card (computed client-side) */
  count?: number;
};
