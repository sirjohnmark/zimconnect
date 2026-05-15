"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BackButton } from "@/components/ui/BackButton";
import { cn } from "@/lib/utils";
import { getMyOrders } from "@/lib/api/orders";
import type { Order, OrderStatus } from "@/lib/api/orders";

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  pending:   { label: "Pending",   className: "bg-amber-100 text-amber-700"       },
  confirmed: { label: "Confirmed", className: "bg-blue-100 text-blue-700"         },
  completed: { label: "Completed", className: "bg-apple-blue/10 text-apple-blue"  },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-600"           },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, className } = STATUS_CONFIG[status];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", className)}>
      {label}
    </span>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function sellerName(seller: Order["seller"]): string {
  const full = `${seller.first_name} ${seller.last_name}`.trim();
  return full || seller.username;
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex flex-col gap-3 px-6 py-4 sm:grid sm:grid-cols-[1fr_140px_100px_120px_80px] sm:items-center sm:gap-4">
      <div className="space-y-2">
        <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-56 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
      </div>
      <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
      <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
      <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
      <div className="h-5 w-16 animate-pulse rounded-full bg-gray-100" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyOrders()
      .then((res) => setOrders(res.results))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const total     = orders.length;
  const completed = orders.filter((o) => o.status === "completed").length;
  const active    = orders.filter((o) => o.status === "pending" || o.status === "confirmed").length;
  const cancelled = orders.filter((o) => o.status === "cancelled").length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <BackButton href="/dashboard" label="Dashboard" className="-ml-1 mb-2" />
        <h1 className="text-xl font-semibold text-gray-900">My Orders</h1>
        {!loading && (
          <p className="mt-1 text-sm text-gray-500">
            {total} order{total !== 1 ? "s" : ""} — {completed} completed, {active} active
          </p>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Orders", value: loading ? "—" : String(total),     color: "text-gray-900"   },
          { label: "Completed",    value: loading ? "—" : String(completed), color: "text-apple-blue" },
          { label: "Active",       value: loading ? "—" : String(active),    color: "text-blue-600"   },
          { label: "Cancelled",    value: loading ? "—" : String(cancelled), color: "text-red-500"    },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
            <p className={cn("mt-2 text-3xl font-bold", color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Orders list */}
      {loading || orders.length > 0 ? (
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
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                : orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex flex-col gap-3 px-6 py-4 sm:grid sm:grid-cols-[1fr_140px_100px_120px_80px] sm:items-center sm:gap-4"
                    >
                      {/* Listing info */}
                      <div className="min-w-0">
                        <p className="text-xs font-mono text-gray-400 mb-0.5">
                          {order.order_number ?? `#${order.id}`}
                        </p>
                        <Link
                          href={`/listings/${order.listing.slug ?? order.listing.id}`}
                          className="text-sm font-semibold text-gray-900 hover:text-apple-blue transition-colors line-clamp-1"
                        >
                          {order.listing.title}
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">{order.listing.location}</p>
                      </div>

                      {/* Seller */}
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-apple-blue/10 text-xs font-bold text-apple-blue">
                          {sellerName(order.seller).charAt(0).toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-700 truncate">{sellerName(order.seller)}</span>
                      </div>

                      {/* Price */}
                      <p className="text-sm font-bold text-apple-blue">
                        {order.currency} {parseFloat(order.amount).toLocaleString()}
                      </p>

                      {/* Date */}
                      <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>

                      {/* Status */}
                      <div>
                        <StatusBadge status={order.status} />
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        ) : (
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
      )}

      <p className="text-xs text-gray-400 text-center">
        Orders are managed through seller contact (Call / WhatsApp). Full order management coming soon.
      </p>
    </div>
  );
}
