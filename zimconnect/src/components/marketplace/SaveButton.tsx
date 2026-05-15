"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { isSaved } from "@/lib/mock/saved";
import { saveListing, unsaveListing, isSavedRemote } from "@/lib/api/buyers";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface SaveButtonProps {
  listingId: string;
  /** "icon" = just the heart icon, "full" = icon + label */
  variant?: "icon" | "full";
  className?: string;
}

export function SaveButton({ listingId, variant = "icon", className }: SaveButtonProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [saved, setSaved] = useState(false);
  const [hydrating, setHydrating] = useState(true);

  const isBuyer = user?.role === "BUYER";
  const numericId = Number(listingId);

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && isBuyer) {
      isSavedRemote(numericId)
        .then(setSaved)
        .catch(() => setSaved(isSaved(listingId)))
        .finally(() => setHydrating(false));
    } else {
      setSaved(false);
      setHydrating(false);
    }
  }, [isLoading, isAuthenticated, isBuyer, numericId, listingId]);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!isBuyer) return;

    const prev = saved;
    setSaved(!saved); // optimistic update

    try {
      if (!saved) {
        await saveListing(numericId);
      } else {
        await unsaveListing(numericId);
      }
    } catch {
      setSaved(prev); // revert on error
    }
  }

  // Sellers and admins don't use save
  if (!isLoading && isAuthenticated && !isBuyer) return null;

  if (hydrating) {
    return (
      <Skeleton
        className={cn(
          variant === "icon" ? "h-8 w-8 rounded-full" : "h-9 w-20 rounded-lg",
          className,
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={saved ? "Remove from saved" : "Save listing"}
      aria-pressed={saved}
      className={cn(
        "flex items-center gap-1.5 rounded-full transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue",
        variant === "icon"
          ? "p-1.5 hover:bg-black/10 active:scale-90"
          : "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold shadow-sm hover:bg-gray-50 active:scale-[0.97]",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        strokeWidth={2}
        className={cn(
          "h-5 w-5 transition-colors duration-150",
          saved
            ? "fill-rose-500 stroke-rose-500"
            : variant === "icon"
              ? "fill-none stroke-white drop-shadow"
              : "fill-none stroke-gray-500",
        )}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
        />
      </svg>
      {variant === "full" && (
        <span className={cn("text-sm", saved ? "text-rose-500" : "text-gray-600")}>
          {saved ? "Saved" : "Save"}
        </span>
      )}
    </button>
  );
}
