import type { Category } from "@/types/category";

// ── Switch ────────────────────────────────────────────────────────────────────
// Set NEXT_PUBLIC_USE_MOCK=true in .env.local to use mock data.
// Remove or set to false to use the real Django API.

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

// ── Lazy imports keep bundle clean — only one path is ever evaluated ──────────

async function fromMock(): Promise<Category[]> {
  const { MOCK_CATEGORIES } = await import("@/lib/mock/categories");
  return MOCK_CATEGORIES;
}

async function fromApi(params: { includeCount?: boolean }): Promise<Category[]> {
  const { getCategories } = await import("@/lib/api/categories");
  return getCategories(params);
}

// ── Public function ───────────────────────────────────────────────────────────

export interface GetCategoriesOptions {
  includeCount?: boolean;
}

export async function getCategories(options: GetCategoriesOptions = {}): Promise<Category[]> {
  return USE_MOCK ? fromMock() : fromApi(options);
}
