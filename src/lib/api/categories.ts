import { api } from "./client";
import type { Category } from "@/types/category";

export interface GetCategoriesParams {
  includeCount?: boolean;
}

export interface GetCategoryParams {
  id: string;
}

// ISR: revalidate category list every 10 minutes (low-churn data)
const CATEGORIES_CACHE: NextFetchRequestConfig = { revalidate: 600 };

export async function getCategories(params: GetCategoriesParams = {}): Promise<Category[]> {
  return api.get<Category[]>("/categories", {
    params: { include_count: params.includeCount },
    next: CATEGORIES_CACHE,
  });
}

export async function getCategory({ id }: GetCategoryParams): Promise<Category> {
  return api.get<Category>(`/categories/${id}`, {
    next: CATEGORIES_CACHE,
  });
}
