import { revalidateTag } from "next/cache";
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

const CATEGORIES_TAG = "categories";
const CACHE: NextFetchRequestConfig = { revalidate: 600, tags: [CATEGORIES_TAG] };

export async function getCategories(params: GetCategoriesParams = {}): Promise<PaginatedCategories> {
  return api.get<PaginatedCategories>("/api/v1/categories", {
    params: params as Record<string, string | number | undefined | null>,
    next: CACHE,
  });
}

export async function getCategoryTree(): Promise<Category[]> {
  return api.get<Category[]>("/api/v1/categories/tree", { next: CACHE });
}

export async function getCategory(id: number): Promise<Category> {
  return api.get<Category>(`/api/v1/categories/${id}`, { next: CACHE });
}

export interface CategoryInput {
  name: string;
  slug: string;
  description?: string;
  parent?: number | null;
  icon?: string;
  display_order?: number;
  is_active?: boolean;
}

export async function createCategory(data: CategoryInput): Promise<Category> {
  const result = await api.post<Category>("/api/v1/categories", data);
  revalidateTag(CATEGORIES_TAG);
  return result;
}

export async function updateCategory(id: number, data: Partial<CategoryInput>): Promise<Category> {
  const result = await api.patch<Category>(`/api/v1/categories/${id}`, data);
  revalidateTag(CATEGORIES_TAG);
  return result;
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete<void>(`/api/v1/categories/${id}`);
  revalidateTag(CATEGORIES_TAG);
}
