import { getDashboardStats } from "@/lib/queries/listings";
import ListingsChart from "@/components/dashboard/ListingsChart";

interface DashboardStatsProps {
  userId: string;
}

export default async function DashboardStats({ userId }: DashboardStatsProps) {
  const stats = await getDashboardStats(userId);
  return <ListingsChart stats={stats} />;
}
