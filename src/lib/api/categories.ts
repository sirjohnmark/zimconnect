import { api } from "./client";
import type { Category } from "@/types/category";

export interface GetCategoriesParams {
  page?: number;
  page_size?: number;
}

export interface PaginatedCategories {
  count: number;
  next: string | null;
  previous: string | null;
  results: Category[];
}

const CACHE: NextFetchRequestConfig = { revalidate: 600 };

export async function getCategories(params: GetCategoriesParams = {}): Promise<PaginatedCategories> {
  return api.get<PaginatedCategories>("/api/v1/categories/", {
    params: params as Record<string, string | number | undefined | null>,
    next: CACHE,
  });
}

export async function getCategoryTree(): Promise<Category[]> {
  return api.get<Category[]>("/api/v1/categories/tree/", { next: CACHE });
}

export async function getCategory(id: number): Promise<Category> {
  return api.get<Category>(`/api/v1/categories/${id}/`, { next: CACHE });
}
