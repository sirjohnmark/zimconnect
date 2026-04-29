"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/useAuth";
import { ApiError } from "@/lib/api/client";
import type { Category } from "@/types/category";
import type { CategoryInput } from "@/lib/api/categories";

const EMPTY: CategoryInput = { name: "", slug: "", description: "", icon: "", image: null, display_order: 0, is_active: true, parent: null };

function slugify(val: string) {
  return val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function AdminCategoriesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CategoryInput>(EMPTY);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isAdmin = user?.role === "ADMIN" || user?.role === "MODERATOR";

  async function load() {
    try {
      const { getCategories } = await import("@/lib/api/categories");
      const res = await getCategories({ page_size: 100 });
      setCategories(res);
      setError("");
    } catch (e: unknown) {
      setError(e instanceof ApiError && e.status === 403 ? "forbidden" : "unavailable");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  function startEdit(cat: Category) {
    setEditId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon,
      image: cat.image,
      display_order: cat.display_order,
      is_active: cat.is_active,
      parent: cat.parent,
    });
    setError("");
    setSuccess("");
  }

  function cancelEdit() {
    setEditId(null);
    setForm(EMPTY);
    setError("");
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const { createCategory, updateCategory } = await import("@/lib/api/categories");
      if (editId !== null) {
        await updateCategory(editId, form);
        setSuccess("Category updated.");
      } else {
        await createCategory({ ...form, slug: form.slug || slugify(form.name) });
        setSuccess("Category created.");
      }
      setEditId(null);
      setForm(EMPTY);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save category.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this category? This cannot be undone.")) return;
    try {
      const { deleteCategory } = await import("@/lib/api/categories");
      await deleteCategory(id);
      setSuccess("Category deleted.");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete category.");
    }
  }

  if (authLoading) {
    return (
      <div className="max-w-3xl space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm font-semibold text-gray-900">Admin access required</p>
        <p className="mt-1 text-xs text-gray-500">Only admins and moderators can manage categories.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Manage Categories</h1>
        {editId === null && (
          <button
            onClick={() => { setEditId(-1); setForm(EMPTY); setError(""); setSuccess(""); }}
            className="rounded-full bg-apple-blue px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
          >
            + Add Category
          </button>
        )}
      </div>

      {/* Form */}
      {editId !== null && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 space-y-4">
          <p className="text-sm font-bold text-gray-900">{editId === -1 ? "New Category" : "Edit Category"}</p>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: f.slug || slugify(e.target.value) }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue"
                placeholder="e.g. Electronics"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Slug</label>
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue"
                placeholder="auto-generated"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Icon (emoji or URL)</label>
              <input
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue"
                placeholder="📱"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Display Order</label>
              <input
                type="number"
                value={form.display_order}
                onChange={(e) => setForm((f) => ({ ...f, display_order: Number(e.target.value) }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Image URL</label>
            <input
              value={form.image ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, image: e.target.value || null }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue"
              placeholder="https://…"
            />
            <p className="text-xs text-gray-400">Hero image shown on the category browse page. Leave blank to use no image.</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Parent Category</label>
            <select
              value={form.parent ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, parent: e.target.value ? Number(e.target.value) : null }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue"
            >
              <option value="">— None (top-level) —</option>
              {categories
                .filter((c) => c.id !== editId)
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_active"
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-apple-blue"
            />
            <label htmlFor="is_active" className="text-xs font-semibold text-gray-700">Active (visible to users)</label>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-apple-blue px-5 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? "Saving…" : editId === -1 ? "Create" : "Save Changes"}
            </button>
            <button onClick={cancelEdit} className="rounded-full border border-gray-200 px-5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {success && <p className="text-xs font-semibold text-green-600">{success}</p>}
      {error && error !== "unavailable" && error !== "forbidden" && <p className="text-xs text-red-500">{error}</p>}

      {/* List */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 animate-pulse bg-gray-50 m-3 rounded-xl" />)
        ) : error === "forbidden" ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm font-semibold text-red-700">Permission denied</p>
            <p className="mt-1 text-xs text-red-500">Your account does not have admin access. Try signing out and back in.</p>
          </div>
        ) : error === "unavailable" ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm font-semibold text-amber-700">We are currently unavailable</p>
            <p className="mt-1 text-xs text-amber-500">Please come back in a few minutes.</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">No categories yet.</div>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                {cat.icon && <span className="text-lg leading-none">{cat.icon}</span>}
                <div>
                  <p className="text-sm font-semibold text-gray-900">{cat.name}</p>
                  <p className="text-xs text-gray-400">{cat.slug}{!cat.is_active && <span className="ml-2 text-amber-500">inactive</span>}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => startEdit(cat)} className="rounded-lg px-3 py-1 text-xs font-semibold text-apple-blue hover:bg-apple-blue/5 transition-colors">Edit</button>
                <button onClick={() => handleDelete(cat.id)} className="rounded-lg px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
