"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImagePreview {
  id: string;
  file: File;
  url: string; // object URL for preview
}

export interface ImageUploadProps {
  value: ImagePreview[];
  onChange: (images: ImagePreview[]) => void;
  max?: number;
  error?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

// ─── Component ────────────────────────────────────────────────────────────────

export function ImageUpload({ value, onChange, max = 5, error }: ImageUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const canAddMore = value.length < max;

  function validateAndAdd(files: FileList | null) {
    if (!files || files.length === 0) return;
    setFileError(null);

    const remaining = max - value.length;
    const incoming = Array.from(files).slice(0, remaining);
    const valid: ImagePreview[] = [];

    for (const file of incoming) {
      if (!ACCEPTED.includes(file.type)) {
        setFileError("Only JPEG, PNG, WebP, or GIF images are accepted.");
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setFileError(`"${file.name}" is too large. Max size is ${MAX_SIZE_MB}MB.`);
        continue;
      }
      valid.push({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) });
    }

    if (valid.length > 0) onChange([...value, ...valid]);
  }

  function remove(id: string) {
    const target = value.find((img) => img.id === id);
    if (target) URL.revokeObjectURL(target.url);
    onChange(value.filter((img) => img.id !== id));
  }

  // Drag-and-drop handlers
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => setDragOver(false), []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (canAddMore) validateAndAdd(e.dataTransfer.files);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canAddMore, value],
  );

  const displayError = error ?? fileError;

  return (
    <div className="space-y-3">
      {/* Previews */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {value.map((img, index) => (
            <div key={img.id} className="group relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={`Preview ${index + 1}`}
                className="h-full w-full rounded-lg object-cover border border-gray-200"
              />
              {/* Cover badge on first image */}
              {index === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Cover
                </span>
              )}
              {/* Remove button */}
              <button
                type="button"
                onClick={() => remove(img.id)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                aria-label={`Remove image ${index + 1}`}
              >
                <svg viewBox="0 0 12 12" fill="currentColor" className="h-3 w-3">
                  <path d="M6.707 6l2.647-2.646a.5.5 0 0 0-.708-.708L6 5.293 3.354 2.646a.5.5 0 0 0-.708.708L5.293 6 2.646 8.646a.5.5 0 0 0 .708.708L6 6.707l2.646 2.647a.5.5 0 0 0 .708-.708L6.707 6Z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {canAddMore && (
        <label
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors duration-150",
            dragOver
              ? "border-emerald-400 bg-emerald-50"
              : "border-gray-200 bg-gray-50 hover:border-emerald-300 hover:bg-emerald-50/50",
            displayError && "border-red-300 bg-red-50",
          )}
        >
          <svg
            className={cn("h-8 w-8", dragOver ? "text-emerald-500" : "text-gray-300")}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
            />
          </svg>
          <div>
            <span className="text-sm font-semibold text-emerald-600">Click to upload</span>
            <span className="text-sm text-gray-500"> or drag and drop</span>
          </div>
          <p className="text-xs text-gray-400">
            JPEG, PNG, WebP up to {MAX_SIZE_MB}MB · {value.length}/{max} images
          </p>
          <input
            type="file"
            accept={ACCEPTED.join(",")}
            multiple
            className="sr-only"
            onChange={(e) => validateAndAdd(e.target.files)}
          />
        </label>
      )}

      {/* Error */}
      {displayError && (
        <p role="alert" className="flex items-center gap-1.5 text-xs text-red-600">
          <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 shrink-0">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4.5zm0 6.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" />
          </svg>
          {displayError}
        </p>
      )}
    </div>
  );
}
