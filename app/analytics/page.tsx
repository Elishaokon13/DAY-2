import React, { Suspense } from "react";
import { AnalyticsPageClient } from "./AnalyticsPageClient";

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-8"></div>
          <div className="grid gap-6">
            <div className="h-64 bg-gray-700 rounded"></div>

            <div className="grid grid-cols-2 gap-6">
              <div className="h-64 bg-gray-700 rounded"></div>
              <div className="h-64 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      }
    >
      <AnalyticsPageClient />
    </Suspense>
  );
}
