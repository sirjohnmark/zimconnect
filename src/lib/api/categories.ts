import { api, ApiError } from "./client";
import type { Category } from "@/types/category";
import { MOCK_CATEGORIES } from "@/lib/mock/categories";

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

// ─── Mock helpers ─────────────────────────────────────────────────────────────

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

let _mockCategories: Category[] = [...MOCK_CATEGORIES];
let _nextMockId = MOCK_CATEGORIES.length + 1;

// ─── HTML entity decoding ─────────────────────────────────────────────────────

function decodeHtml(value: string): string {
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
      const dec = entity.match(/^&#(\d+);$/);
      if (dec) return String.fromCodePoint(Number(dec[1]));
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

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Full paginated DRF response: { count, next, previous, results }
 */
export async function getCategoriesPage(
  params: GetCategoriesParams = {},
): Promise<PaginatedCategories> {
  if (USE_MOCK) {
    const page     = params.page      ?? 1;
    const pageSize = params.page_size ?? 50;
    const start    = (page - 1) * pageSize;
    const results  = _mockCategories.slice(start, start + pageSize);
    return { count: _mockCategories.length, next: null, previous: null, results };
  }

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
 * Flat Category[] — use for dropdowns and listings.
 */
export async function getCategories(
  params: GetCategoriesParams = {},
): Promise<Category[]> {
  const data = await getCategoriesPage(params);
  return data.results;
}

export async function getCategoryTree(): Promise<Category[]> {
  if (USE_MOCK) {
    return _mockCategories.filter((c) => c.parent === null);
  }

  const data = await api.get<Category[]>("/api/v1/categories/tree/", {
    next: CACHE,
  });

  return data.map(normalizeCategory);
}

export async function getCategory(id: number): Promise<Category> {
  if (USE_MOCK) {
    const cat = _mockCategories.find((c) => c.id === id);
    if (!cat) throw new ApiError(404, "Not Found", "Category not found.");
    return cat;
  }

  const data = await api.get<Category>(`/api/v1/categories/${id}/`, {
    next: CACHE,
  });

  return normalizeCategory(data);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

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
function buildPayload(data: CategoryInput | Partial<CategoryInput>): Record<string, unknown> {
  const { image, ...rest } = data;
  const payload: Record<string, unknown> = { ...rest };
  if (image) payload.image = image;
  return payload;
}

/**
 * Client-safe create/update/delete.
 * These do NOT call revalidateTag (client components can't).
 * Use categories.server.ts server actions when cache invalidation is needed.
 */
export async function createCategory(data: CategoryInput): Promise<Category> {
  if (USE_MOCK) {
    const cat: Category = {
      id:            _nextMockId++,
      name:          data.name,
      slug:          data.slug,
      description:   data.description ?? "",
      parent:        data.parent ?? null,
      icon:          data.icon ?? "",
      image:         data.image ?? null,
      is_active:     data.is_active ?? true,
      display_order: data.display_order ?? 0,
      created_at:    new Date().toISOString(),
      updated_at:    new Date().toISOString(),
    };
    _mockCategories = [cat, ..._mockCategories];
    return cat;
  }

  const payload = buildPayload(data);
  const result  = await api.post<Category>("/api/v1/categories/", payload);
  return normalizeCategory(result);
}

export async function updateCategory(
  id: number,
  data: Partial<CategoryInput>,
): Promise<Category> {
  if (USE_MOCK) {
    const idx = _mockCategories.findIndex((c) => c.id === id);
    if (idx === -1) throw new ApiError(404, "Not Found", "Category not found.");
    const updated: Category = {
      ..._mockCategories[idx],
      ...data,
      updated_at: new Date().toISOString(),
    };
    _mockCategories = _mockCategories.map((c) => (c.id === id ? updated : c));
    return updated;
  }

  const payload = buildPayload(data);
  const result  = await api.patch<Category>(`/api/v1/categories/${id}/`, payload);
  return normalizeCategory(result);
}

export async function deleteCategory(id: number): Promise<void> {
  if (USE_MOCK) {
    if (!_mockCategories.some((c) => c.id === id)) {
      throw new ApiError(404, "Not Found", "Category not found.");
    }
    _mockCategories = _mockCategories.filter((c) => c.id !== id);
    return;
  }

  await api.delete<void>(`/api/v1/categories/${id}/`);
}
