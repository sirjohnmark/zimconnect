// src/lib/api/categories.server.ts

"use server";

import { revalidateTag } from "next/cache";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryInput,
} from "./categories";

const CATEGORIES_TAG = "categories";

export async function createCategoryAction(data: CategoryInput) {
  const result = await createCategory(data);
  revalidateTag(CATEGORIES_TAG, { expire: 0 });
  return result;
}

export async function updateCategoryAction(
  id: number,
  data: Partial<CategoryInput>,
) {
  const result = await updateCategory(id, data);
  revalidateTag(CATEGORIES_TAG, { expire: 0 });
  return result;
}

export async function deleteCategoryAction(id: number) {
  await deleteCategory(id);
  revalidateTag(CATEGORIES_TAG, { expire: 0 });
}