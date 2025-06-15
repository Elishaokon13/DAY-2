/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { ShareableAnalyticsCard } from "./ShareableAnalyticsCard";
import { Icon } from "@/components/ui/Icon";
import { useRouter } from "next/navigation";
import { useUserProfile } from "../hooks/getUserProfile";
import { useUserBalances } from "../hooks/getUserBalance";
import { formatCompactNumber } from "@/lib/utils";
import { TimelineChart } from "./TimelineChart";

interface AnalyticsDashboardProps {
  handle: string;
}

export function AnalyticsDashboard({ handle }: AnalyticsDashboardProps) {
  const [showShareableCard, setShowShareableCard] = useState<boolean>(false);

  const { profile, loading: isLoadingProfile, error } = useUserProfile(handle);
  const {
    sorted,
    totalEarnings,
    totalPosts,
    totalVolume,
    totalHolders,
    isLoadingBalance,
    isBalanceError,
  } = useUserBalances(handle);

  const avgTotalEarnings = Number(totalEarnings) / Number(totalPosts || 1);

  const router = useRouter();
  const handleGoBack = () => {
    if (router) {
      router.back();
    } else {
      window.history.back();
    }
  };

  // if (isLoadingProfile) {
  //   return (
  //     <div className="p-6 animate-pulse">
  //       <div className="h-8 bg-gray-700 rounded w-1/3 mb-8"></div>
  //       <div className="grid gap-6">
  //         <div className="h-64 bg-gray-700 rounded"></div>
  //         <div className="grid grid-cols-2 gap-6">
  //           <div className="h-64 bg-gray-700 rounded"></div>
  //           <div className="h-64 bg-gray-700 rounded"></div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  if (error || isBalanceError) {
    return (
      <div className="p-6 text-red-500">
        <h2 className="text-xl font-mono mb-4">Error Loading Analytics</h2>
        {/* <p>{error.message}</p> */}

        <Button variant="outline" className="mt-4" onClick={handleGoBack}>
          Go Back
        </Button>
      </div>
    );
  }

  // If no coins created yet
  // if (
  //   !profile
  // ) {
  //   return (
  //     <div className="p-6">
  //       <div className="flex items-center gap-3 mb-6">
  //         <div className="cursor-pointer" onClick={() => handleGoBack()}>
  //           <Icon name="arrowLeft" size="sm" className="mr-1 text-lime-400" />
  //         </div>
  //         <h2 className="text-2xl font-mono text-lime-500">
  //           Creator Analytics
  //         </h2>
  //       </div>
  //       <div className="bg-[#1a1e2e] p-6 rounded-lg border border-gray-700">
  //         <p className="text-white mb-4">
  //           No creator coins found for @{handle}
  //         </p>
  //         <p className="text-gray-400 mb-6">
  //           Once you create coins on Zora, your earnings analytics will appear
  //           here.
  //         </p>
  //         <Button variant="outline" onClick={handleGoBack}>
  //           Go Back
  //         </Button>
  //       </div>
  //     </div>
  //   );
  // }

  // Toggle between analytics dashboard and shareable card
  if (showShareableCard) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-mono text-lime-500">
            Shareable Analytics Card
          </h2>
          <Button
            className="bg-lime-900/30 border border-lime-700/50 hover:bg-lime-800/40 text-lime-400 py-4 px-4 font-mono tracking-wider transition-colors duration-300"
            variant="outline"
            size="sm"
            onClick={() => setShowShareableCard(false)}
          >
            Back to Analytics
          </Button>
        </div>

        <ShareableAnalyticsCard handle={handle} />

        <div className="mt-6 text-gray-500 text-center text-xs">
          <p>
            Share your creator analytics with your audience or download for your
            records.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="cursor-pointer" onClick={() => handleGoBack()}>
            <Icon name="arrowLeft" size="sm" className="mr-1 text-lime-400" />
          </div>
          <h2 className="text-2xl font-mono text-lime-500">
            Creator Analytics
          </h2>
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-lime-900/30 border border-lime-700/50 hover:bg-lime-800/40 text-lime-400 py-4 px-4 font-mono tracking-wider transition-colors duration-300"
            variant="outline"
            size="sm"
            onClick={() => setShowShareableCard(true)}
          >
            <Icon name="share" size="sm" className="justify-center" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Creator Profile */}
        {isLoadingProfile ? (
          <div className="h-36 bg-gray-700 animate-pulse rounded"></div>
        ) : (
          <div className="bg-[#1a1e2e] p-6 rounded-lg border border-gray-700">
            <div className="flex items-start gap-4">
              <div className="!w-16 !h-16  rounded-full overflow-hidden relative">
                <img
                  src={profile?.avatar?.medium || profile?.avatar?.small}
                  alt={
                    profile?.displayName || profile?.handle || "Creator Avatar"
                  }
                  className="object-cover !w-16 !h-16 w-full h-full"
                />
              </div>

              <div>
                <h2 className="text-xl font-mono text-white">
                  {profile?.displayName}
                </h2>
                <p className="text-gray-400">@{profile?.handle}</p>
                {profile?.bio && (
                  <p className="text-gray-400 mt-2 normal-case text-sm w-full max-w-[460px]">
                    {profile?.bio}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Creator Earnings */}
        {isLoadingBalance ? (
          <div className="h-36 bg-gray-700 animate-pulse rounded"></div>
        ) : (
          <div className="bg-[#1a1e2e] p-6 rounded-lg border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#13151F] p-3 rounded-lg">
                <p className="text-gray-400 text-xs mb-1 font-mono">
                  TOTAL EARNINGS
                </p>
                <p className="text-lime-400 text-xl font-bold">
                  ${formatCompactNumber(Number(totalEarnings.toFixed(2)))}
                </p>
              </div>

              <div className="bg-[#13151F] p-3 rounded-lg">
                <p className="text-gray-400 text-xs mb-1 font-mono">
                  TRADING VOLUME
                </p>
                <p className="text-white text-xl font-bold">
                  ${formatCompactNumber(Number(totalVolume.toFixed(2)))}
                </p>
              </div>

              <div className="bg-[#13151F] p-3 rounded-lg">
                <p className="text-gray-400 text-xs mb-1 font-mono">POSTS</p>
                <p className="text-white text-xl font-bold">{totalPosts}</p>
              </div>

              <div className="bg-[#13151F] p-3 rounded-lg">
                <p className="text-gray-400 text-xs mb-1 font-mono">
                  AVG EARNINGS/POST
                </p>
                <p className="text-white text-xl font-bold">
                  ${formatCompactNumber(Number(avgTotalEarnings.toFixed(2)))}
                </p>
              </div>
            </div>
          </div>
        )}

        {isLoadingBalance ? (
          <div className="h-64 bg-gray-700 animate-pulse rounded"></div>
        ) : (
          <div className="w-full">
            <TimelineChart totalHolders={totalHolders} sorted={sorted} />
          </div>
        )}
      </div>

      {/* <div className="mt-8 text-gray-500 text-center text-xs">
        <p>
          Data displayed is based on estimates and may not reflect actual
          earnings.
        </p>
      </div> */}
    </div>
  );
}
