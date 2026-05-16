"use client";

import { useParams } from "next/navigation";
import { ListingDetailView } from "@/components/marketplace/ListingDetailView";

export default function DashboardListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <ListingDetailView id={id} backHref="/dashboard" backLabel="Back to dashboard" />;
}
