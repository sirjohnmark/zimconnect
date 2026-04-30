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

const CACHE: NextFetchRequestConfig = {
  revalidate: 600,
  tags: ["categories"],
};

function decodeHtml(value: string): string {
  // Named entities
  const named: Record<string, string> = {
    "&amp;":  "&",
    "&lt;":   "<",
    "&gt;":   ">",
    "&quot;": '"',
    "&apos;": "'",
    "&#039;": "'",
    "&nbsp;": " ",
  };
  return value
    .replace(/&[a-zA-Z]+;|&#\d+;|&#x[0-9a-fA-F]+;/g, (entity) => {
      if (named[entity]) return named[entity];
      // Decimal numeric entity — e.g. &#60;
      const dec = entity.match(/^&#(\d+);$/);
      if (dec) return String.fromCodePoint(Number(dec[1]));
      // Hex numeric entity — e.g. &#x3C;
      const hex = entity.match(/^&#x([0-9a-fA-F]+);$/i);
      if (hex) return String.fromCodePoint(parseInt(hex[1], 16));
      return entity;
    });
}

function normalizeCategory(category: Category): Category {
  return {
    ...category,
    name:
      typeof category.name === "string"
        ? decodeHtml(category.name)
        : category.name,
  };
}

/**
 * Use this when you need the full paginated DRF response:
 * { count, next, previous, results }
 */
export async function getCategoriesPage(
  params: GetCategoriesParams = {},
): Promise<PaginatedCategories> {
  const data = await api.get<PaginatedCategories>("/api/v1/categories/", {
    params: params as Record<string, string | number | undefined | null>,
    next: CACHE,
  });

  return {
    ...data,
    results: data.results.map(normalizeCategory),
  };
}

/**
 * Use this for normal frontend listing/dropdowns.
 * Returns Category[] directly.
 */
export async function getCategories(
  params: GetCategoriesParams = {},
): Promise<Category[]> {
  const data = await getCategoriesPage(params);
  return data.results;
}

export async function getCategoryTree(): Promise<Category[]> {
  const data = await api.get<Category[]>("/api/v1/categories/tree/", {
    next: CACHE,
  });

  return data.map(normalizeCategory);
}

export async function getCategory(id: number): Promise<Category> {
  const data = await api.get<Category>(`/api/v1/categories/${id}/`, {
    next: CACHE,
  });

  return normalizeCategory(data);
}

export interface CategoryInput {
  name: string;
  slug: string;
  description?: string;
  parent?: number | null;
  icon?: string;
  /** URL of the category hero image, or empty string to clear. */
  image?: string | null;
  display_order?: number;
  is_active?: boolean;
}

// Strip null image — backend expects binary (file upload), not a null JSON value.
// All other optional fields are sent as-is; undefined fields are omitted by JSON.stringify.
function buildPayload(data: CategoryInput | Partial<CategoryInput>): Record<string, unknown> {
  const { image, ...rest } = data;
  const payload: Record<string, unknown> = { ...rest };
  if (image) payload.image = image;
  return payload;
}

/**
 * Client-safe create/update/delete.
 * These DO NOT call revalidateTag because this file may be used by client components.
 */
export async function createCategory(data: CategoryInput): Promise<Category> {
  const payload = buildPayload(data);
  const result = await api.post<Category>("/api/v1/categories/", payload);
  return normalizeCategory(result);
}

export async function updateCategory(
  id: number,
  data: Partial<CategoryInput>,
): Promise<Category> {
  const payload = buildPayload(data);
  const result = await api.patch<Category>(`/api/v1/categories/${id}/`, payload);
  return normalizeCategory(result);
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete<void>(`/api/v1/categories/${id}/`);
}
