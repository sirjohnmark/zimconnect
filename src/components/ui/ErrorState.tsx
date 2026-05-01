"use client";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = "Something went wrong",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-5xl">⚠️</div>

      <h2 className="mb-2 text-lg font-semibold text-gray-900">{message}</h2>

      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
