"use client";

import { type ComponentType } from "react";
import { useAdminGuard } from "@/lib/auth/useAdminGuard";

// Generic skeleton shown while the session is being restored
function AdminGuardSkeleton() {
  return (
    <div className="space-y-4 p-1">
      <div className="h-8 w-48 animate-pulse rounded-xl bg-gray-100" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
    </div>
  );
}

/**
 * HOC that gates a page component behind admin authentication.
 *
 * Usage:
 *   export default withAdminProtection(function MyAdminPage() { ... });
 *
 * Behaviour:
 *   - Session loading   → renders skeleton
 *   - No JWT or wrong role → redirects to /login (via useAdminGuard)
 *   - ADMIN / MODERATOR → renders the wrapped component
 */
export function withAdminProtection<P extends object>(
  WrappedComponent: ComponentType<P>,
) {
  function AdminProtectedPage(props: P) {
    const status = useAdminGuard();

    if (status === "loading") return <AdminGuardSkeleton />;

    // "denied" → redirect already fired in useAdminGuard; render nothing
    if (status === "denied") return null;

    return <WrappedComponent {...props} />;
  }

  AdminProtectedPage.displayName = `withAdminProtection(${
    WrappedComponent.displayName ?? WrappedComponent.name ?? "Component"
  })`;

  return AdminProtectedPage;
}
