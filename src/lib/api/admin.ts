import { api } from "./client";
import type { PaginatedListings } from "./listings";
import type { PaginatedUsers } from "./users";

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers:         number;
  totalSellers:       number;
  totalBuyers:        number;
  totalListings:      number;
  pendingListings:    number;
  activeListings:     number;
  rejectedListings:   number;
  totalCategories:    number;
  newUsersToday:      number;
  newListingsToday:   number;
  totalConversations: number;
}

interface DashboardResponse {
  total_users:              number;
  total_sellers:            number;
  total_buyers:             number;
  total_listings:           number;
  total_listings_all:       number;
  total_listings_pending:   number;
  total_listings_rejected:  number;
  new_users_today:          number;
  new_listings_today:       number;
  total_conversations:      number;
  total_categories:         number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const data = await api.get<DashboardResponse>("/api/v1/admin/dashboard/");
  return {
    totalUsers:         data.total_users,
    totalSellers:       data.total_sellers,
    totalBuyers:        data.total_buyers,
    totalListings:      data.total_listings_all,
    pendingListings:    data.total_listings_pending,
    activeListings:     data.total_listings,
    rejectedListings:   data.total_listings_rejected,
    totalCategories:    data.total_categories,
    newUsersToday:      data.new_users_today,
    newListingsToday:   data.new_listings_today,
    totalConversations: data.total_conversations,
  };
}
