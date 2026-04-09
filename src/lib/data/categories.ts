import type { Category } from "@/types/category";
import { USE_MOCK } from "./use-mock";

// ── Mock implementation ───────────────────────────────────────────────────────

async function fromMock(): Promise<Category[]> {
  const { MOCK_CATEGORIES } = await import("@/lib/mock/categories");
  return MOCK_CATEGORIES;
}

// ── API implementation (with mock fallback on failure) ────────────────────────

async function fromApi(params: { includeCount?: boolean }): Promise<Category[]> {
  try {
    const { getCategories } = await import("@/lib/api/categories");
    return await getCategories(params);
  } catch {
    // API unreachable — fall back to mock so the build never crashes
    const { MOCK_CATEGORIES } = await import("@/lib/mock/categories");
    return MOCK_CATEGORIES;
  }
}

// ── Public function ───────────────────────────────────────────────────────────

export interface GetCategoriesOptions {
  includeCount?: boolean;
}

export async function getCategories(options: GetCategoriesOptions = {}): Promise<Category[]> {
  return USE_MOCK ? fromMock() : fromApi(options);
}
