"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getListingImageUrl } from "@/lib/utils";
import type { ListingImage } from "@/types";

interface ListingGalleryProps {
  images: ListingImage[];
  title: string;
}

export default function ListingGallery({ images, title }: ListingGalleryProps) {
  // Sort by sort_order ascending; primary image first as tiebreak.
  const sorted = [...images].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.is_primary ? -1 : 1;
  });

  const primaryIndex = sorted.findIndex((img) => img.is_primary);
  const [activeIndex, setActiveIndex] = useState(primaryIndex >= 0 ? primaryIndex : 0);

  const activeImage = sorted[activeIndex] ?? null;

  function prev() {
    setActiveIndex((i) => (i === 0 ? sorted.length - 1 : i - 1));
  }
  function next() {
    setActiveIndex((i) => (i === sorted.length - 1 ? 0 : i + 1));
  }

  // ─── No images placeholder ────────────────────────────────────────────────
  if (sorted.length === 0) {
    return (
      <div className="aspect-[4/3] w-full rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
        <span className="text-6xl select-none" aria-hidden="true">
          📷
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ─── Main image ──────────────────────────────────────────────────── */}
      <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100 border border-slate-200">
        {activeImage && (
          <Image
            key={activeImage.id}
            src={getListingImageUrl(activeImage.storage_path)}
            alt={`${title} — image ${activeIndex + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 720px"
            className="object-cover"
            priority={activeIndex === 0}
          />
        )}

        {/* Navigation arrows — only visible when >1 image */}
        {sorted.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 hover:bg-black/60 transition-all focus:opacity-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 hover:bg-black/60 transition-all focus:opacity-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Counter pill */}
            <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white">
              {activeIndex + 1} / {sorted.length}
            </span>
          </>
        )}
      </div>

      {/* ─── Thumbnails ──────────────────────────────────────────────────── */}
      {sorted.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
          role="list"
          aria-label="Image thumbnails"
        >
          {sorted.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(idx)}
              aria-label={`View image ${idx + 1}`}
              aria-pressed={activeIndex === idx}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 ${
                activeIndex === idx
                  ? "border-brand-500 shadow-sm shadow-brand-500/30"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={getListingImageUrl(img.storage_path)}
                alt={`Thumbnail ${idx + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
