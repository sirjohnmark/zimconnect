"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/useAuth";
import {
  getReviewsForListing,
  getSellerStats,
  hasReviewed,
  submitReview,
  toggleHelpful,
  type Review,
} from "@/lib/mock/reviews";
import { cn } from "@/lib/utils";

// ─── Star display ─────────────────────────────────────────────────────────────

function Stars({ rating, size = "sm", interactive = false, onChange }: {
  rating: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (r: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const sz = { sm: "h-3.5 w-3.5", md: "h-5 w-5", lg: "h-6 w-6" }[size];
  const active = interactive && hovered > 0 ? hovered : rating;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          viewBox="0 0 20 20"
          fill={s <= active ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={s <= active ? 0 : 1.5}
          className={cn(
            sz,
            s <= active ? "text-amber-400" : "text-gray-300",
            interactive && "cursor-pointer transition-colors hover:text-amber-400",
          )}
          onMouseEnter={() => interactive && setHovered(s)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onChange?.(s)}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
        </svg>
      ))}
    </div>
  );
}

// ─── Rating breakdown bar ─────────────────────────────────────────────────────

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-3 text-right text-gray-500 shrink-0">{label}</span>
      <svg viewBox="0 0 12 12" fill="currentColor" className="h-3 w-3 text-amber-400 shrink-0">
        <path d="M5.523 1.464c.18-.554.963-.554 1.144 0l.64 1.97h2.074c.583 0 .825.746.354 1.089L8.042 5.57l.64 1.97c.18.554-.453 1.013-.923.67L6 7.157l-1.759 1.054c-.47.344-1.103-.116-.923-.67l.64-1.97-1.693-1.047c-.47-.343-.229-1.089.354-1.089h2.074l.64-1.97Z" />
      </svg>
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right text-gray-400 shrink-0">{count}</span>
    </div>
  );
}

// ─── Review card ──────────────────────────────────────────────────────────────

function ReviewCard({ review, currentUserId }: { review: Review; currentUserId: string }) {
  const [helpful, setHelpful] = useState(review.helpful);
  const [voted, setVoted]     = useState(review.helpfulVoters.includes(currentUserId));
  const [expanded, setExpanded] = useState(false);

  function handleHelpful() {
    toggleHelpful(review.id, currentUserId);
    if (voted) { setHelpful((h) => h - 1); setVoted(false); }
    else       { setHelpful((h) => h + 1); setVoted(true); }
  }

  const date = new Date(review.createdAt).toLocaleDateString("en-ZW", {
    day: "numeric", month: "short", year: "numeric",
  });

  const isLong = review.comment.length > 200;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-3 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-apple-blue/10 text-sm font-bold text-apple-blue">
            {review.buyerInitial}
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-900">{review.buyerName}</p>
            <p className="text-xs text-gray-400">{date}</p>
          </div>
        </div>
        <Stars rating={review.rating} size="sm" />
      </div>

      {/* Comment */}
      <p className={cn("text-sm text-gray-700 leading-relaxed", !expanded && isLong && "line-clamp-3")}>
        {review.comment}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-medium text-apple-blue hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}

      {/* Helpful */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleHelpful}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
            voted
              ? "border-apple-blue/40 bg-light-gray text-apple-blue"
              : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700",
          )}
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M8.864.046C7.908-.193 7.02.53 6.956 1.466c-.072 1.051-.23 2.016-.428 2.59-.125.36-.479 1.013-1.044 1.672-.182.22-.475.345-.822.345H3.207a2 2 0 0 0-2 2v3.5a2 2 0 0 0 2 2h.8l.82.822A2 2 0 0 0 6.24 13h4.08a2 2 0 0 0 1.908-1.41L13.2 8.5a2 2 0 0 0-1.908-2.59H9.136c.04-.205.07-.415.09-.629.124-1.384-.23-2.497-.933-3.173L8.864.046Z" />
          </svg>
          Helpful {helpful > 0 && `(${helpful})`}
        </button>
      </div>
    </div>
  );
}

// ─── Write a review form ──────────────────────────────────────────────────────

function WriteReview({
  listingId,
  sellerId,
  sellerName,
  buyerName,
  buyerId,
  onSubmitted,
}: {
  listingId: string;
  sellerId: string;
  sellerName: string;
  buyerName: string;
  buyerId: string;
  onSubmitted: (r: Review) => void;
}) {
  const [rating, setRating]   = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError]     = useState("");
  const [submitting, setSub]  = useState(false);
  const [done, setDone]       = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError("Please select a star rating."); return; }
    if (comment.trim().length < 10) { setError("Comment must be at least 10 characters."); return; }
    setSub(true);
    const review = submitReview({
      listingId,
      sellerId,
      buyerId,
      buyerName,
      buyerInitial: buyerName.charAt(0).toUpperCase(),
      rating,
      comment: comment.trim(),
    });
    onSubmitted(review);
    setSub(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-apple-blue/20 bg-light-gray p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-apple-blue text-white">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-bold text-near-black">Review submitted!</p>
          <p className="text-xs text-apple-blue">Thank you. Your review is now visible to other buyers.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
      <p className="text-sm font-bold text-gray-900">Rate {sellerName}</p>

      {/* Star selector */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-600">Your rating *</label>
        <Stars rating={rating} size="lg" interactive onChange={(r) => { setRating(r); setError(""); }} />
        {rating > 0 && (
          <p className="text-xs text-gray-500">
            {["", "Poor", "Fair", "Good", "Very good", "Excellent"][rating]}
          </p>
        )}
      </div>

      {/* Comment */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-600">Your review *</label>
        <textarea
          value={comment}
          onChange={(e) => { setComment(e.target.value); setError(""); }}
          rows={4}
          placeholder="Describe your experience with this seller — was the product as described? Was the seller responsive and trustworthy?"
          className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue resize-none transition-colors"
        />
        <div className="flex items-center justify-between">
          {error ? <p className="text-xs text-red-500">{error}</p> : <span />}
          <p className={cn("text-xs", comment.length < 10 ? "text-gray-300" : "text-gray-400")}>{comment.length}/500</p>
        </div>
      </div>

      <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
        Reviews are public. Please be honest, respectful, and based on your genuine experience.
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl bg-apple-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-apple-blue disabled:opacity-50 active:scale-[0.97] transition-all"
      >
        {submitting ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

interface ReviewsSectionProps {
  listingId: string;
  sellerName: string;
}

export function ReviewsSection({ listingId, sellerName }: ReviewsSectionProps) {
  const { user, isLoading } = useAuth();
  const [reviews, setReviews]   = useState<Review[]>([]);
  const [mounted, setMounted]   = useState(false);
  const [alreadyReviewed, setAlready] = useState(false);
  const userDisplayName = `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || user?.username || "";
  const userId = user ? String(user.id) : null;

  useEffect(() => {
    const r = getReviewsForListing(listingId);
    setReviews(r);
    if (userId) setAlready(hasReviewed(listingId, userId));
    setMounted(true);
  }, [listingId, user, userId]);

  const stats = mounted ? getSellerStats(sellerName) : null;

  function handleNewReview(review: Review) {
    setReviews((prev) => [review, ...prev]);
    setAlready(true);
  }

  if (!mounted) {
    return (
      <div className="space-y-4">
        {[1, 2].map((n) => (
          <div key={n} className="rounded-2xl border border-gray-100 bg-white p-5 space-y-3 animate-pulse">
            <div className="flex gap-3">
              <div className="h-9 w-9 rounded-full bg-gray-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-28 rounded bg-gray-100" />
                <div className="h-3 w-16 rounded bg-gray-100" />
              </div>
            </div>
            <div className="h-3 w-full rounded bg-gray-100" />
            <div className="h-3 w-4/5 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      {stats && stats.total > 0 && (
        <div className="flex flex-col sm:flex-row gap-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          {/* Average score */}
          <div className="flex flex-col items-center justify-center sm:border-r sm:border-gray-100 sm:pr-6 sm:min-w-32">
            <p className="text-5xl font-extrabold text-gray-900">{stats.average}</p>
            <Stars rating={Math.round(stats.average)} size="md" />
            <p className="mt-1 text-xs text-gray-400">{stats.total} review{stats.total !== 1 ? "s" : ""}</p>
          </div>
          {/* Breakdown */}
          <div className="flex-1 space-y-1.5 justify-center flex flex-col">
            {[5, 4, 3, 2, 1].map((s) => (
              <RatingBar
                key={s}
                label={String(s)}
                count={stats.breakdown[s] ?? 0}
                total={stats.total}
              />
            ))}
          </div>
        </div>
      )}

      {/* Write a review */}
      {!isLoading && user && !alreadyReviewed && (
        <WriteReview
          listingId={listingId}
          sellerId={sellerName}
          sellerName={sellerName}
          buyerId={userId ?? ""}
          buyerName={userDisplayName}
          onSubmitted={handleNewReview}
        />
      )}

      {!isLoading && !user && (
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-center">
          <p className="text-sm text-gray-600">
            <a href="/login" className="font-semibold text-apple-blue hover:underline">Sign in</a> to leave a review for this seller.
          </p>
        </div>
      )}

      {!isLoading && userId && alreadyReviewed && reviews.some((r) => r.buyerId === userId) && (
        <div className="rounded-xl border border-apple-blue/10 bg-light-gray px-4 py-3 text-xs text-apple-blue font-medium">
          ✓ You have already reviewed this listing.
        </div>
      )}

      {/* Review list */}
      {reviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center">
          <p className="text-sm font-medium text-gray-500">No reviews yet</p>
          <p className="mt-1 text-xs text-gray-400">Be the first to review this seller.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} currentUserId={userId ?? "anonymous"} />
          ))}
        </div>
      )}
    </div>
  );
}
