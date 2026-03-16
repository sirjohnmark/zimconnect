"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, PackageOpen } from "lucide-react";
import { deleteListing } from "@/lib/actions/listings";
import { formatRelativeDate } from "@/lib/utils/format";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type { Listing, ListingStatus, Category } from "@/types";

interface ListingsTableProps {
  listings: Listing[];
  categories: Category[];
}

type BadgeVariant = "success" | "warning" | "danger" | "default";

const statusConfig: Record<ListingStatus, { label: string; variant: BadgeVariant }> = {
  active:   { label: "Active",   variant: "success"  },
  draft:    { label: "Draft",    variant: "warning"  },
  inactive: { label: "Inactive", variant: "default"  },
  sold:     { label: "Sold",     variant: "default"  },
  expired:  { label: "Expired",  variant: "danger"   },
  removed:  { label: "Removed",  variant: "danger"   },
  deleted:  { label: "Deleted",  variant: "danger"   },
};

function formatListingPrice(listing: Listing): string {
  if (listing.price_type === "free") return "Free";
  if (listing.price_type === "contact" || listing.price === null) return "—";
  return `$${listing.price.toLocaleString()}${listing.price_type === "negotiable" ? " (neg.)" : ""}`;
}

export default function ListingsTable({ listings, categories }: ListingsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  function openConfirm(id: string) {
    setConfirmId(id);
    setDeleteError(null);
  }

  function closeConfirm() {
    if (isPending) return;
    setConfirmId(null);
    setDeleteError(null);
  }

  function handleDelete() {
    if (!confirmId) return;
    startTransition(async () => {
      const result = await deleteListing(confirmId);
      if (result.error) {
        setDeleteError(result.error);
        return;
      }
      closeConfirm();
      router.refresh();
    });
  }

  // ─── Empty state ───────────────────────────────────────────────────────────
  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 rounded-xl border-2 border-dashed border-slate-200 bg-white text-center">
        <PackageOpen className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="text-base font-semibold text-slate-700">No listings yet</h3>
        <p className="mt-1 text-sm text-slate-400 max-w-xs">
          Post your first listing and reach buyers across Zimbabwe.
        </p>
        <Link
          href="/sell"
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
        >
          Post your first listing
        </Link>
      </div>
    );
  }

  // ─── Table ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="bg-slate-50">
                <th className="py-3 pl-4 pr-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Listing
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">
                  Category
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Price
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="py-3 pl-3 pr-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listings.map((listing) => {
                const cat = categoryMap.get(listing.category_id);
                const { label, variant } =
                  statusConfig[listing.status] ?? statusConfig.active;
                const thumb = listing.images?.[0] ?? null;

                return (
                  <tr key={listing.id} className="hover:bg-slate-50 transition-colors">
                    {/* Thumbnail + title */}
                    <td className="py-3 pl-4 pr-3">
                      <div className="flex items-center gap-3">
                        {/* Thumbnail */}
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200">
                          {thumb ? (
                            <Image
                              src={thumb}
                              alt={listing.title}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-xl select-none">
                              📷
                            </div>
                          )}
                        </div>
                        {/* Title + date */}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate max-w-[200px] sm:max-w-xs">
                            {listing.title}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {formatRelativeDate(listing.created_at)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-3 py-3 text-sm text-slate-600 hidden sm:table-cell">
                      {cat ? (
                        <span className="flex items-center gap-1.5">
                          {cat.icon && (
                            <span aria-hidden="true">{cat.icon}</span>
                          )}
                          {cat.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Price */}
                    <td className="px-3 py-3 text-sm font-medium text-slate-800 whitespace-nowrap">
                      {formatListingPrice(listing)}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3">
                      <Badge variant={variant}>{label}</Badge>
                    </td>

                    {/* Actions */}
                    <td className="py-3 pl-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/listings/${listing.id}/edit`}
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                          aria-label={`Edit ${listing.title}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </Link>
                        <button
                          onClick={() => openConfirm(listing.id)}
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                          aria-label={`Delete ${listing.title}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal open={!!confirmId} onClose={closeConfirm} title="Delete listing?">
        <p className="text-sm text-slate-600">
          This listing will be permanently removed and its images deleted. This action
          cannot be undone.
        </p>
        {deleteError && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {deleteError}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={closeConfirm} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            isLoading={isPending}
          >
            Delete listing
          </Button>
        </div>
      </Modal>
    </>
  );
}
