"use client";

import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { useSearchParams } from "next/navigation";

export function AnalyticsPageClient() {
  const searchParams = useSearchParams();
  const creator = searchParams.get("creator");

  return <AnalyticsDashboard handle={creator ?? ""} />;
}