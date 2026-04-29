import { api } from "./client";
import type { PaginatedListings } from "./listings";
import type { PaginatedUsers } from "./users";

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers:       number;
  totalSellers:     number;
  totalBuyers:      number;
  totalListings:    number;
  pendingListings:  number;
  activeListings:   number;
  rejectedListings: number;
  totalCategories:  number;
}

/**
 * Gather platform-wide stats in parallel.
 * Uses Promise.allSettled so a single 403/network error doesn't crash the whole dashboard —
 * failed counters fall back to 0.
 */
export async function getAdminStats(): Promise<AdminStats> {
  const [users, sellers, buyers, all, pending, active, rejected, cats] = await Promise.allSettled([
    api.get<PaginatedUsers>("/api/v1/users/",             { params: { page_size: 1 } }),
    api.get<PaginatedUsers>("/api/v1/users/",             { params: { role: "SELLER", page_size: 1 } }),
    api.get<PaginatedUsers>("/api/v1/users/",             { params: { role: "BUYER",  page_size: 1 } }),
    api.get<PaginatedListings>("/api/v1/admin/listings/", { params: { page_size: 1 } }),
    api.get<PaginatedListings>("/api/v1/admin/listings/", { params: { status: "PENDING",  page_size: 1 } }),
    api.get<PaginatedListings>("/api/v1/admin/listings/", { params: { status: "ACTIVE",   page_size: 1 } }),
    api.get<PaginatedListings>("/api/v1/admin/listings/", { params: { status: "REJECTED", page_size: 1 } }),
    api.get<{ count: number }>("/api/v1/categories/",    { params: { page_size: 1 } }),
  ]);

  return {
    totalUsers:       users.status     === "fulfilled" ? users.value.count     : 0,
    totalSellers:     sellers.status   === "fulfilled" ? sellers.value.count   : 0,
    totalBuyers:      buyers.status    === "fulfilled" ? buyers.value.count    : 0,
    totalListings:    all.status       === "fulfilled" ? all.value.count       : 0,
    pendingListings:  pending.status   === "fulfilled" ? pending.value.count   : 0,
    activeListings:   active.status    === "fulfilled" ? active.value.count    : 0,
    rejectedListings: rejected.status  === "fulfilled" ? rejected.value.count  : 0,
    totalCategories:  cats.status      === "fulfilled" ? cats.value.count      : 0,
  };
}
