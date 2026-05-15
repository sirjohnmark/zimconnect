"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface CategoriesErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CategoriesError({ error, reset }: CategoriesErrorProps) {
  useEffect(() => {
    // Log to your error tracking service (e.g. Sentry) here
    console.error("[categories] fetch error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-red-200 bg-red-50 py-20 text-center">
      <svg
        className="mb-4 h-10 w-10 text-red-300"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
        />
      </svg>
      <p className="text-sm font-semibold text-red-700">Failed to load categories</p>
      <p className="mt-1 text-xs text-red-400">
        {error.message ?? "Something went wrong. Please try again."}
      </p>
      {error.digest && (
        <p className="mt-1 font-mono text-xs text-red-300">ID: {error.digest}</p>
      )}
      <Button variant="outline" size="sm" className="mt-5" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
