"use client";

import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { useSearchParams } from "next/navigation";
import React from "react";

export default function AnalyticsPage() {
  const searchParams = useSearchParams();
  const creator = searchParams.get("creator");

  return (
    <div>
      <AnalyticsDashboard handle={creator ?? ""} />
    </div>
  );
}
