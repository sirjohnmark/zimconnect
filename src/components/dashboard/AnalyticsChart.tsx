"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import type { EngagementPoint, CategoryPoint } from "@/lib/api/analytics";

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-gray-500 capitalize">{p.name}:</span>
          <span className="font-semibold text-gray-800">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Tab toggle ───────────────────────────────────────────────────────────────

function Tabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-lg border border-gray-100 bg-gray-50 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
            value === o.value
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function ChartEmptyState({ height, message }: { height: number; message: string }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-100 bg-gray-50"
      style={{ height }}
    >
      <p className="text-sm text-gray-400 text-center px-4">{message}</p>
    </div>
  );
}

// ─── Views & engagement chart ─────────────────────────────────────────────────

export function EngagementChart({
  weekly,
  monthly,
}: {
  weekly: EngagementPoint[];
  monthly: EngagementPoint[];
}) {
  const [range, setRange] = useState<"weekly" | "monthly">("weekly");
  const data = range === "weekly" ? weekly : monthly;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-apple-blue mb-0.5">Analytics</p>
          <h3 className="text-base font-bold text-gray-900">Listing Engagement</h3>
          <p className="text-xs text-gray-400 mt-0.5">Views, messages, and saves over time</p>
        </div>
        <Tabs
          options={[{ label: "7 days", value: "weekly" }, { label: "12 months", value: "monthly" }]}
          value={range}
          onChange={setRange}
        />
      </div>

      {data.length === 0 ? (
        <ChartEmptyState
          height={220}
          message="No engagement data yet. Post a listing to start tracking views, messages, and saves."
        />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradMessages" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradSaves" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
            <Area type="monotone" dataKey="views"    name="Views"    stroke="#10b981" strokeWidth={2} fill="url(#gradViews)"    dot={false} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="messages" name="Messages" stroke="#6366f1" strokeWidth={2} fill="url(#gradMessages)" dot={false} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="saves"    name="Saves"    stroke="#f43f5e" strokeWidth={2} fill="url(#gradSaves)"    dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Category breakdown chart ─────────────────────────────────────────────────

export function CategoryChart({ data }: { data: CategoryPoint[] }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-apple-blue mb-0.5">Breakdown</p>
        <h3 className="text-base font-bold text-gray-900">Views by Category</h3>
        <p className="text-xs text-gray-400 mt-0.5">How your listings perform across categories</p>
      </div>

      {data.length === 0 ? (
        <ChartEmptyState
          height={200}
          message="No category data yet."
        />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="views" name="Views" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
