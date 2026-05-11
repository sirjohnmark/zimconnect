"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/useAuth";
import {
  getCategoriesPage,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/api/categories";
import type { Category } from "@/types/category";
import type { CategoryInput } from "@/lib/api/categories";
import { ApiError, NetworkError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(val: string) {
  return val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

const EMPTY_FORM: CategoryInput = {
  name: "",
  slug: "",
  description: "",
  icon: "",
  image: null,
  display_order: 0,
  is_active: true,
  parent: null,
};

// ─── Category form modal ───────────────────────────────────────────────────────

function CategoryModal({
  category,
  allCategories,
  onSave,
  onClose,
  saving,
  apiError,
}: {
  category: Category | null;
  allCategories: Category[];
  onSave: (data: CategoryInput) => void;
  onClose: () => void;
  saving: boolean;
  apiError: string;
}) {
  const isEdit = category !== null;
  const [form, setForm] = useState<CategoryInput>(
    isEdit
      ? {
          name:          category.name,
          slug:          category.slug,
          description:   category.description ?? "",
          icon:          category.icon ?? "",
          image:         category.image,
          display_order: category.display_order,
          is_active:     category.is_active,
          parent:        category.parent,
        }
      : EMPTY_FORM,
  );
  const [nameError, setNameError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  function handleNameChange(val: string) {
    setForm((f) => ({
      ...f,
      name: val,
      slug: f.slug && isEdit ? f.slug : slugify(val),
    }));
    if (val.trim()) setNameError("");
  }

  function handleSubmit() {
    if (!form.name.trim()) { setNameError("Name is required."); return; }
    if (form.name.trim().length > 100) { setNameError("Name must be 100 characters or fewer."); return; }
    const slug = form.slug || slugify(form.name);
    if (slug.length > 120) { setNameError("Slug must be 120 characters or fewer."); return; }
    if (form.icon && form.icon.length > 50) { setNameError("Icon must be 50 characters or fewer."); return; }
    onSave({ ...form, name: form.name.trim(), slug });
  }

  const parentOptions = allCategories.filter((c) => c.id !== category?.id);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-16">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">
            {isEdit ? "Edit Category" : "New Category"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 p-6">
          {apiError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">
              {apiError}
            </div>
          )}

          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={nameRef}
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Electronics"
              maxLength={100}
              className={cn(
                "w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue",
                nameError ? "border-red-300 focus:ring-red-400" : "border-gray-200",
              )}
            />
            {nameError && <p className="text-xs text-red-500">{nameError}</p>}
          </div>

          {/* Slug */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
              placeholder="auto-generated"
              maxLength={120}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-mono text-gray-600 focus:outline-none focus:ring-2 focus:ring-apple-blue"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Description</label>
            <textarea
              value={form.description ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Short description shown on the category page…"
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue"
            />
          </div>

          {/* Icon + Display Order */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Icon</label>
              <input
                value={form.icon ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                placeholder="📱 or icon name"
                maxLength={50}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Display Order</label>
              <input
                type="number"
                min={0}
                value={form.display_order ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, display_order: Number(e.target.value) }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue"
              />
            </div>
          </div>

          {/* Parent */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Parent Category</label>
            <select
              value={form.parent ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, parent: e.target.value ? Number(e.target.value) : null }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue"
            >
              <option value="">— None (top-level) —</option>
              {parentOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ""}{c.name}</option>
              ))}
            </select>
          </div>

          {/* Active toggle */}
          <label className="flex cursor-pointer items-center gap-3">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
              <div className={cn(
                "h-5 w-9 rounded-full transition-colors",
                form.is_active ? "bg-apple-blue" : "bg-gray-300",
              )} />
              <div className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                form.is_active ? "translate-x-4" : "translate-x-0.5",
              )} />
            </div>
            <span className="text-xs font-semibold text-gray-700">
              {form.is_active ? "Active (visible to users)" : "Inactive (hidden)"}
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 rounded-xl bg-apple-blue py-2.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirmation modal ────────────────────────────────────────────────

function DeleteModal({
  category,
  onConfirm,
  onCancel,
  busy,
  error,
}: {
  category: Category;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
  error?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={busy ? undefined : onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-red-600">
            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Delete category?</h2>
          <p className="mt-1 text-xs text-gray-500">
            This will permanently delete{" "}
            <span className="font-semibold text-gray-700">
              {category.icon ? `${category.icon} ` : ""}{category.name}
            </span>
            . Any listings assigned to this category may be affected.
          </p>
        </div>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">
            {error}
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Table skeleton ───────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="border-b border-gray-50">
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-pulse rounded-xl bg-gray-100" />
              <div className="space-y-1.5">
                <div className="h-3 w-28 animate-pulse rounded bg-gray-100" />
                <div className="h-2.5 w-20 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          </td>
          <td className="px-4 py-3"><div className="h-3 w-40 animate-pulse rounded bg-gray-100" /></td>
          <td className="px-4 py-3"><div className="h-3 w-20 animate-pulse rounded bg-gray-100" /></td>
          <td className="px-4 py-3"><div className="h-5 w-14 animate-pulse rounded-full bg-gray-100" /></td>
          <td className="px-4 py-3"><div className="h-3 w-8 animate-pulse rounded bg-gray-100" /></td>
          <td className="px-4 py-3">
            <div className="flex justify-end gap-2">
              <div className="h-7 w-7 animate-pulse rounded-lg bg-gray-100" />
              <div className="h-7 w-7 animate-pulse rounded-lg bg-gray-100" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminCategoriesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "MODERATOR";

  const [categories,    setCategories]    = useState<Category[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [page,          setPage]          = useState(1);
  const [totalCount,    setTotalCount]    = useState(0);
  const [error,         setError]         = useState("");
  const [toast,         setToast]         = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [saving,        setSaving]        = useState(false);
  const [modalError,    setModalError]    = useState("");
  const [busyId,        setBusyId]        = useState<number | null>(null);

  const [modalCat,      setModalCat]      = useState<Category | null | undefined>(undefined);
  const [deleteTarget,  setDeleteTarget]  = useState<Category | null>(null);
  const [deleteError,   setDeleteError]   = useState("");

  const PAGE_SIZE = 50;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getCategoriesPage({ page, page_size: PAGE_SIZE });
      setCategories(data.results);
      setTotalCount(data.count);
    } catch (e: unknown) {
      setError(e instanceof ApiError && e.status === 403 ? "forbidden" : "unavailable");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSave(data: CategoryInput) {
    console.log("Submitting category:", data);
    setSaving(true);
    setModalError("");
    try {
      if (modalCat && modalCat.id) {
        const updated = await updateCategory(modalCat.id, data);
        setCategories((prev) => prev.map((c) => c.id === updated.id ? updated : c));
        showToast("Category updated.");
      } else {
        const created = await createCategory(data);
        setCategories((prev) => [created, ...prev]);
        setTotalCount((n) => n + 1);
        showToast("Category created.");
      }
      setModalCat(undefined);
    } catch (e: unknown) {
      setModalError(
        e instanceof NetworkError      ? "Unable to connect to server." :
        e instanceof ApiError && e.status === 403 ? "Permission denied." :
        e instanceof ApiError          ? e.message :
        "Failed to save category.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cat: Category) {
    setBusyId(cat.id);
    setDeleteError("");
    try {
      await deleteCategory(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      setTotalCount((n) => n - 1);
      setDeleteTarget(null);
      setDeleteError("");
      showToast("Category deleted.");
    } catch (e: unknown) {
      setDeleteError(
        e instanceof NetworkError      ? "Unable to connect to server." :
        e instanceof ApiError && e.status === 403 ? "Permission denied." :
        e instanceof ApiError          ? e.message :
        "Failed to delete category.",
      );
    } finally {
      setBusyId(null);
    }
  }

  function handleDeleteCancel() {
    setDeleteTarget(null);
    setDeleteError("");
  }

  // ─── Auth loading ──────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="max-w-4xl space-y-4">
        <div className="h-8 w-44 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
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

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return (
    <>
      <div className="max-w-4xl space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Category Management</h1>
            <p className="mt-0.5 text-xs text-gray-500">
              {!loading && !error && `${totalCount.toLocaleString()} categor${totalCount !== 1 ? "ies" : "y"} · `}
              Create and organise listing categories.
            </p>
          </div>
          <button
            onClick={() => { setModalCat(null); setModalError(""); }}
            className="flex items-center gap-1.5 rounded-xl bg-apple-blue px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            Add Category
          </button>
        </div>


        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Parent</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Order</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <TableSkeleton />
                ) : error === "forbidden" ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center">
                      <p className="text-sm font-semibold text-red-700">Permission denied</p>
                      <p className="mt-1 text-xs text-red-400">Try signing out and back in.</p>
                    </td>
                  </tr>
                ) : error === "unavailable" ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center">
                      <p className="text-sm font-semibold text-amber-700">Service unavailable</p>
                      <p className="mt-1 text-xs text-amber-400">Please try again in a few minutes.</p>
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center">
                      <p className="text-sm text-gray-400">No categories yet.</p>
                      <button
                        onClick={() => { setModalCat(null); setModalError(""); }}
                        className="mt-2 text-xs font-semibold text-apple-blue hover:underline"
                      >
                        Create your first category →
                      </button>
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => {
                    const isBusy = busyId === cat.id;
                    return (
                      <tr
                        key={cat.id}
                        className={cn(
                          "group transition-colors hover:bg-gray-50/70",
                          isBusy && "opacity-60",
                        )}
                      >
                        {/* Category name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-base leading-none">
                              {cat.icon ? cat.icon : (
                                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-gray-400">
                                  <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-900">{cat.name}</p>
                              <p className="text-[11px] font-mono text-gray-400">{cat.slug}</p>
                            </div>
                          </div>
                        </td>

                        {/* Description */}
                        <td className="px-4 py-3">
                          <span className="line-clamp-2 max-w-[220px] text-xs text-gray-500">
                            {cat.description || <span className="italic text-gray-300">No description</span>}
                          </span>
                        </td>

                        {/* Parent */}
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-500">
                            {cat.parent ? categoryMap[cat.parent] ?? `#${cat.parent}` : (
                              <span className="italic text-gray-300">Top-level</span>
                            )}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            cat.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500",
                          )}>
                            {cat.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        {/* Order */}
                        <td className="px-4 py-3">
                          <span className="text-xs tabular-nums text-gray-500">{cat.display_order}</span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit */}
                            <button
                              onClick={() => { setModalCat(cat); setModalError(""); }}
                              title="Edit"
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                            >
                              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                              </svg>
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => setDeleteTarget(cat)}
                              disabled={isBusy}
                              title="Delete"
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors"
                            >
                              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              ← Previous
            </button>
            <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Toast — fixed above all modals */}
      {toast && (
        <div className={cn(
          "fixed left-1/2 top-4 z-[60] -translate-x-1/2 rounded-xl border px-5 py-3 text-xs font-semibold shadow-lg",
          toast.type === "error"
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-green-200 bg-green-50 text-green-700",
        )}>
          {toast.msg}
        </div>
      )}

      {/* Category form modal — null = new, Category = edit, undefined = closed */}
      {modalCat !== undefined && (
        <CategoryModal
          category={modalCat}
          allCategories={categories}
          onSave={handleSave}
          onClose={() => setModalCat(undefined)}
          saving={saving}
          apiError={modalError}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteModal
          category={deleteTarget}
          busy={busyId === deleteTarget.id}
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={handleDeleteCancel}
          error={deleteError}
        />
      )}
    </>
  );
}
