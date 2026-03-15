// TODO: implement — align with DB schema
export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  parent_id: string | null;
  listings_count: number;
  sort_order: number;
  created_at: string;
}

export interface CategoryWithChildren extends Category {
  children: Category[];
}
