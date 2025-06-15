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
import { motion } from "framer-motion";

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
    router.back();
  };

  if (error || isBalanceError) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 text-red-400"
      >
        <h2 className="text-xl font-mono mb-4">Error Loading Analytics</h2>
        <Button 
          variant="outline" 
          className="mt-4 hover:bg-red-950/30 hover:text-red-400 border-red-800/30" 
          onClick={handleGoBack}
        >
          Go Back
        </Button>
      </motion.div>
    );
  }

  // Toggle between analytics dashboard and shareable card
  if (showShareableCard) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 md:p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-mono text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-emerald-400"
          >
            Shareable Analytics Card
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button
              className="bg-lime-900/30 border border-lime-700/50 hover:bg-lime-800/40 text-lime-400 py-4 px-4 font-mono tracking-wider transition-all duration-300 group"
              variant="outline"
              size="sm"
              onClick={() => setShowShareableCard(false)}
            >
              <Icon name="arrowLeft" size="sm" className="mr-2 transition-transform group-hover:-translate-x-1" />
              Back to Analytics
            </Button>
          </motion.div>
        </div>

        <ShareableAnalyticsCard
          handle={handle}
          profile={profile}
          totalEarnings={totalEarnings}
          totalPosts={totalPosts}
          avgTotalEarnings={avgTotalEarnings}
          totalVolume={totalVolume}
          totalHolders={totalHolders}
          sorted={sorted}
        />

        <div className="mt-6 text-gray-500 text-center text-xs">
          <p>Share your creator analytics with your audience or download for your records.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 md:p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div 
            className="cursor-pointer group" 
            onClick={() => handleGoBack()}
          >
            <Icon 
              name="arrowLeft" 
              size="sm" 
              className="mr-1 text-lime-400 transition-transform group-hover:-translate-x-1" 
            />
          </div>
          <h2 className="text-2xl font-mono text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-emerald-400">
            Creator Analytics
          </h2>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-2"
        >
          <Button
            className="bg-lime-900/30 border border-lime-700/50 hover:bg-lime-800/40 text-lime-400 py-4 px-4 font-mono tracking-wider transition-all duration-300 group"
            variant="outline"
            size="sm"
            onClick={() => setShowShareableCard(true)}
          >
            <Icon 
              name="share" 
              size="sm" 
              className="transition-transform group-hover:scale-110" 
            />
          </Button>
        </motion.div>
      </div>

      <div className="grid gap-6">
        {/* Creator Profile */}
        {isLoadingProfile ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-36 bg-gray-800/50 animate-pulse rounded-xl backdrop-blur-sm"
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a1e2e]/80 p-6 rounded-xl border border-gray-800/50 backdrop-blur-sm hover:border-gray-700/50 transition-all duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden group">
                <img
                  src={profile?.avatar?.medium || profile?.avatar?.small}
                  alt={profile?.displayName || profile?.handle || "Creator Avatar"}
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-lime-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              <div>
                <h2 className="text-xl font-mono text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-300">
                  {profile?.displayName}
                </h2>
                <p className="text-gray-400">@{profile?.handle}</p>
                {profile?.bio && (
                  <p className="text-gray-400 mt-2 normal-case text-sm w-full max-w-[460px] line-clamp-2">
                    {profile?.bio}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Creator Earnings */}
        {isLoadingBalance ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-36 bg-gray-800/50 animate-pulse rounded-xl backdrop-blur-sm"
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1a1e2e]/80 p-6 rounded-xl border border-gray-800/50 backdrop-blur-sm hover:border-gray-700/50 transition-all duration-300"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-[#13151F]/80 p-4 rounded-xl group hover:bg-[#13151F] transition-all duration-300"
              >
                <p className="text-gray-400 text-xs mb-1 font-mono">TOTAL EARNINGS</p>
                <p className="text-lime-400 text-xl font-bold group-hover:text-lime-300 transition-colors duration-300">
                  ${formatCompactNumber(Number(totalEarnings.toFixed(2)))}
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-[#13151F]/80 p-4 rounded-xl group hover:bg-[#13151F] transition-all duration-300"
              >
                <p className="text-gray-400 text-xs mb-1 font-mono">TRADING VOLUME</p>
                <p className="text-white text-xl font-bold group-hover:text-gray-200 transition-colors duration-300">
                  ${formatCompactNumber(Number(totalVolume.toFixed(2)))}
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-[#13151F]/80 p-4 rounded-xl group hover:bg-[#13151F] transition-all duration-300"
              >
                <p className="text-gray-400 text-xs mb-1 font-mono">POSTS</p>
                <p className="text-white text-xl font-bold group-hover:text-gray-200 transition-colors duration-300">
                  {totalPosts}
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-[#13151F]/80 p-4 rounded-xl group hover:bg-[#13151F] transition-all duration-300"
              >
                <p className="text-gray-400 text-xs mb-1 font-mono">AVG EARNINGS/POST</p>
                <p className="text-white text-xl font-bold group-hover:text-gray-200 transition-colors duration-300">
                  ${formatCompactNumber(Number(avgTotalEarnings.toFixed(2)))}
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}

        {isLoadingBalance ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-64 bg-gray-800/50 animate-pulse rounded-xl backdrop-blur-sm"
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full bg-[#1a1e2e]/80 p-6 rounded-xl border border-gray-800/50 backdrop-blur-sm hover:border-gray-700/50 transition-all duration-300"
          >
            <TimelineChart totalHolders={totalHolders} sorted={sorted} />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
