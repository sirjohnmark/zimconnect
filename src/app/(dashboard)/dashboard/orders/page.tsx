"use client";

import Link from "next/link";
import { BackButton } from "@/components/ui/BackButton";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = "pending" | "confirmed" | "completed" | "cancelled";

interface Order {
  id: string;
  listingTitle: string;
  listingId: string;
  seller: string;
  price: number;
  currency: string;
  status: OrderStatus;
  date: string;
  location: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ORDERS: Order[] = [
  {
    id: "ORD-1001",
    listingTitle: "Samsung Galaxy S24 Ultra — 256GB, Phantom Black",
    listingId: "1",
    seller: "Tinashe Moyo",
    price: 650,
    currency: "USD",
    status: "completed",
    date: "28 Mar 2026",
    location: "Harare",
  },
  {
    id: "ORD-1002",
    listingTitle: "Dell XPS 15 Laptop — i7, 16GB RAM",
    listingId: "4",
    seller: "Rudo Maziwisa",
    price: 850,
    currency: "USD",
    status: "confirmed",
    date: "30 Mar 2026",
    location: "Harare",
  },
  {
    id: "ORD-1003",
    listingTitle: "2-Bedroom Apartment — Avondale",
    listingId: "3",
    seller: "Chiedza Estates",
    price: 450,
    currency: "USD",
    status: "pending",
    date: "1 Apr 2026",
    location: "Harare",
  },
  {
    id: "ORD-1004",
    listingTitle: "Toyota Corolla 2019 — 45,000km",
    listingId: "2",
    seller: "Farai Ncube",
    price: 12500,
    currency: "USD",
    status: "cancelled",
    date: "15 Mar 2026",
    location: "Bulawayo",
  },
];

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  pending:   { label: "Pending",   className: "bg-amber-100 text-amber-700" },
  confirmed: { label: "Confirmed", className: "bg-blue-100 text-blue-700"  },
  completed: { label: "Completed", className: "bg-apple-blue/10 text-apple-blue" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-600"    },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, className } = STATUS_CONFIG[status];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", className)}>
      {label}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const total = MOCK_ORDERS.length;
  const completed = MOCK_ORDERS.filter((o) => o.status === "completed").length;
  const pending = MOCK_ORDERS.filter((o) => o.status === "pending" || o.status === "confirmed").length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <BackButton href="/dashboard" label="Dashboard" className="-ml-1 mb-2" />
        <h1 className="text-xl font-semibold text-gray-900">My Orders</h1>
        <p className="mt-1 text-sm text-gray-500">
          {total} order{total !== 1 ? "s" : ""} — {completed} completed, {pending} active
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Orders",    value: total,     color: "text-gray-900"    },
          { label: "Completed",       value: completed, color: "text-apple-blue" },
          { label: "Active",          value: pending,   color: "text-blue-600"    },
          { label: "Cancelled",       value: MOCK_ORDERS.filter(o => o.status === "cancelled").length, color: "text-red-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
            <p className={cn("mt-2 text-3xl font-bold", color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Orders list */}
      {MOCK_ORDERS.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-20 text-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-12 w-12 text-gray-300 mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
          </svg>
          <p className="text-sm font-semibold text-gray-600">No orders yet</p>
          <p className="mt-1 text-xs text-gray-400">Browse listings to start buying.</p>
          <Link href="/listings" className="mt-4 rounded-lg bg-apple-blue px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
            Browse Listings
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          {/* Table header — desktop only */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_140px_100px_120px_80px] gap-4 border-b border-gray-100 bg-gray-50 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <span>Listing</span>
            <span>Seller</span>
            <span>Price</span>
            <span>Date</span>
            <span>Status</span>
          </div>

          <div className="divide-y divide-gray-50">
            {MOCK_ORDERS.map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-3 px-6 py-4 sm:grid sm:grid-cols-[1fr_140px_100px_120px_80px] sm:items-center sm:gap-4"
              >
                {/* Listing info */}
                <div className="min-w-0">
                  <p className="text-xs font-mono text-gray-400 mb-0.5">{order.id}</p>
                  <Link
                    href={`/listings/${order.listingId}`}
                    className="text-sm font-semibold text-gray-900 hover:text-apple-blue transition-colors line-clamp-1"
                  >
                    {order.listingTitle}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">{order.location}</p>
                </div>

                {/* Seller */}
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-apple-blue/10 text-xs font-bold text-apple-blue">
                    {order.seller.charAt(0)}
                  </span>
                  <span className="text-sm text-gray-700 truncate">{order.seller}</span>
                </div>

                {/* Price */}
                <p className="text-sm font-bold text-apple-blue">
                  {order.currency} {order.price.toLocaleString()}
                </p>

                {/* Date */}
                <p className="text-sm text-gray-500">{order.date}</p>

                {/* Status */}
                <div>
                  <StatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Orders are managed through seller contact (Call / WhatsApp). Full order management coming soon.
      </p>
    </div>
  );
}
