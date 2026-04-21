import type { Category } from "@/types/category";

export interface GetCategoriesOptions {
  page?: number;
  page_size?: number;
}

export async function getCategories(options: GetCategoriesOptions = {}): Promise<Category[]> {
  const { getCategories: getApiCategories } = await import("@/lib/api/categories");
  const response = await getApiCategories(options);
  return response.results;
}
