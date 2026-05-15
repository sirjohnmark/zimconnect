import { api } from "./client";

export type OrderStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface OrderListing {
  id: number;
  title: string;
  slug: string;
  location: string;
  primary_image: string | null;
}

export interface OrderParticipant {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  profile_picture: string | null;
}

export interface Order {
  id: number;
  order_number: string;
  listing: OrderListing;
  seller: OrderParticipant;
  buyer: OrderParticipant;
  amount: string;      // decimal string e.g. "650.00"
  currency: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface PaginatedOrders {
  count: number;
  next: string | null;
  previous: string | null;
  results: Order[];
}

export async function getMyOrders(page = 1): Promise<PaginatedOrders> {
  return api.get<PaginatedOrders>("/api/v1/orders", { params: { page } });
}

export async function getOrder(id: number): Promise<Order> {
  return api.get<Order>(`/api/v1/orders/${id}`);
}

export async function cancelOrder(id: number): Promise<Order> {
  return api.post<Order>(`/api/v1/orders/${id}/cancel`, {});
}
