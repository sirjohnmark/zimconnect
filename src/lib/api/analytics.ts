import { api } from "./client";

export interface EngagementPoint {
  label: string;
  views: number;
  messages: number;
  saves: number;
}

export interface CategoryPoint {
  label: string;
  listings: number;
  views: number;
}

export interface DashboardAnalytics {
  total_views: number;
  weekly: EngagementPoint[];
  monthly: EngagementPoint[];
  by_category: CategoryPoint[];
}

export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  return api.get<DashboardAnalytics>("/api/v1/analytics/dashboard");
}
