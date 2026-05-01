"use client";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-5xl">📦</div>

      <h2 className="mb-2 text-xl font-semibold text-gray-900">{title}</h2>

      {description && (
        <p className="mb-4 text-sm text-gray-500">{description}</p>
      )}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="rounded-xl bg-apple-blue px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
