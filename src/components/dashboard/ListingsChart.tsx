"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { DashboardStats } from "@/lib/queries/listings";

interface ListingsChartProps {
  stats: DashboardStats;
}

const STATUS_COLORS: Record<string, string> = {
  Active: "#1a7a4a",
  Inactive: "#94a3b8",
  Sold: "#f59e0b",
};

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`mt-1 text-3xl font-black ${color}`}>{value}</p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-slate-800">{payload[0].payload.title}</p>
      <p className="text-slate-500">
        {payload[0].value} view{payload[0].value !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

export default function ListingsChart({ stats }: ListingsChartProps) {
  const statusData = [
    { name: "Active", value: stats.active },
    { name: "Inactive", value: stats.inactive },
    { name: "Sold", value: stats.sold },
  ];

  return (
    <div className="space-y-6">
      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Listings" value={stats.total} color="text-slate-900" />
        <StatCard label="Active" value={stats.active} color="text-brand-600" />
        <StatCard label="Sold" value={stats.sold} color="text-amber-500" />
        <StatCard label="Total Views" value={stats.totalViews.toLocaleString()} color="text-slate-900" />
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status breakdown bar */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Listings by status</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={statusData} barSize={40}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                width={24}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {statusData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={STATUS_COLORS[entry.name] ?? "#1a7a4a"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top listings by views */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Top listings by views</h3>
          {stats.topByViews.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-slate-400">
              No views yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={stats.topByViews}
                layout="vertical"
                barSize={18}
                margin={{ left: 8 }}
              >
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="title"
                  width={100}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9" }} />
                <Bar dataKey="views_count" fill="#1a7a4a" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
