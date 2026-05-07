import { api, ApiError } from "./client";
import { getStoredUser } from "@/lib/auth/auth";

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

// ─── Mock helpers ─────────────────────────────────────────────────────────────

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

let _mockOrders: Order[] = [];

function getMockUser(): OrderParticipant {
  const user = getStoredUser();
  return {
    id: user?.id ?? 1,
    username: user?.username ?? "me",
    first_name: user?.first_name ?? "Demo",
    last_name: user?.last_name ?? "User",
    profile_picture: null,
  };
}

function initMockOrders() {
  if (_mockOrders.length === 0) {
    const me = getMockUser();
    const seller: OrderParticipant = { id: 99, username: "seller_demo", first_name: "Demo", last_name: "Seller", profile_picture: null };
    _mockOrders = [
      {
        id: 1,
        order_number: "ORD-0001",
        listing: { id: 1, title: "Samsung Galaxy S21", slug: "samsung-galaxy-s21", location: "HARARE", primary_image: null },
        seller,
        buyer: me,
        amount: "350.00",
        currency: "USD",
        status: "confirmed",
        created_at: new Date(Date.now() - 2 * 86_400_000).toISOString(),
        updated_at: new Date(Date.now() - 86_400_000).toISOString(),
      },
      {
        id: 2,
        order_number: "ORD-0002",
        listing: { id: 2, title: "Leather Sofa", slug: "leather-sofa", location: "BULAWAYO", primary_image: null },
        seller,
        buyer: me,
        amount: "650.00",
        currency: "USD",
        status: "pending",
        created_at: new Date(Date.now() - 86_400_000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

export async function getMyOrders(page = 1): Promise<PaginatedOrders> {
  if (USE_MOCK) {
    initMockOrders();
    const pageSize = 10;
    const start = (page - 1) * pageSize;
    const results = _mockOrders.slice(start, start + pageSize);
    return { count: _mockOrders.length, next: null, previous: null, results };
  }
  return api.get<PaginatedOrders>("/api/v1/orders", { params: { page } });
}

export async function getOrder(id: number): Promise<Order> {
  if (USE_MOCK) {
    initMockOrders();
    const order = _mockOrders.find((o) => o.id === id);
    if (!order) throw new ApiError(404, "Not Found", "Order not found.");
    return order;
  }
  return api.get<Order>(`/api/v1/orders/${id}`);
}

export async function cancelOrder(id: number): Promise<Order> {
  if (USE_MOCK) {
    initMockOrders();
    const order = _mockOrders.find((o) => o.id === id);
    if (!order) throw new ApiError(404, "Not Found", "Order not found.");
    if (order.status !== "pending") throw new ApiError(400, "Bad Request", "Only pending orders can be cancelled.");
    order.status = "cancelled";
    order.updated_at = new Date().toISOString();
    return { ...order };
  }
  return api.post<Order>(`/api/v1/orders/${id}/cancel`, {});
}
