/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import * as htmlToImage from "html-to-image";
import { Button } from "../ui/button";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from "recharts";
import { formatCompactNumber } from "@/lib/utils";

// Define new API response type
interface AnalyticsResults {
  profile: {
    handle: string;
    displayName?: string;
    bio?: string;
    avatar?: string;
    publicWallet?: string;
  };
  metrics: {
    totalEarnings: number;
    totalVolume: number;
    posts: number;
    averageEarningsPerPost: number;
  };
  coins: {
    created: {
      count: number;
      items: Array<{
        name: string;
        symbol: string;
        address: string;
        balance: number;
        uniqueHolders: number;
        totalVolume: number;
        estimatedEarnings: number;
      }>;
    };
    collected: {
      count: number;
      items: Array<any>;
    };
  };
  holderVsTrader: {
    totalHolders: number;
    estimatedCollectors: number;
    estimatedTraders: number;
    coinBreakdown: any[];
  };
}

interface ShareableAnalyticsCardProps {
  handle: string;
  profile: any; // Replace with actual profile type if available
  totalEarnings: any;
  totalVolume: any;
  totalPosts: any;
  totalHolders: any;
  avgTotalEarnings: any;
  sorted: any[]; // Replace with actual type if available
}

export function ShareableAnalyticsCard({
  handle,
  profile,
  totalEarnings,
  totalVolume,
  totalPosts,
  totalHolders,
  sorted,
  avgTotalEarnings,
}: ShareableAnalyticsCardProps) {
  const [shareStatus, setShareStatus] = useState<
    "idle" | "capturing" | "uploading" | "ready" | "sharing" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imgError, setImgError] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Handle image error
  const handleImageError = () => {
    console.log("Image failed to load, using fallback");
    setImgError(true);
  };

  const barChartData = sorted?.map((item) => {
    const earnings = parseFloat(
      item?.node?.coin?.creatorEarnings?.[0]?.amountUsd || "0",
    );
    const date = new Date(item?.node?.coin?.createdAt)
      .toISOString()
      .split("T")[0]; // "YYYY-MM-DD"
    return {
      date,
      earnings,
    };
  });

  // Download the card as an image
  const downloadImage = async () => {
    if (!cardRef.current) return;

    setShareStatus("capturing");
    setErrorMessage(null);

    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#0f1121",
        style: {
          borderRadius: "8px",
          overflow: "hidden",
        },
      });

      // Create download link
      const link = document.createElement("a");
      link.download = `${handle}-zora-analytics.png`;
      link.href = dataUrl;
      link.click();

      setShareStatus("idle");
    } catch (error) {
      console.error("❌ Failed to capture image:", error);
      setShareStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  };

  // Share to Twitter
  const shareToTwitter = async () => {
    if (!cardRef.current || !profile) return;

    setShareStatus("capturing");
    setErrorMessage(null);

    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#0f1121",
      });

      // Upload to server
      setShareStatus("uploading");

      const saveRes = await fetch("/api/save-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: profile.displayName || handle,
          imageData: dataUrl,
        }),
      });

      if (!saveRes.ok) {
        const errorText = await saveRes.text();
        throw new Error(`Image save failed: ${saveRes.status} - ${errorText}`);
      }

      const { blobUrl } = await saveRes.json();

      // Open Twitter share dialog
      const text = `Check out my creator analytics on Zora! Not financial advice. Just vibes.`;
      const url = encodeURIComponent(
        `${process.env.NEXT_PUBLIC_URL || window.location.origin}/frame/${handle}`,
      );
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`;

      window.open(twitterUrl, "_blank");
      setShareStatus("idle");
    } catch (error) {
      console.error("❌ Failed to share to Twitter:", error);
      setShareStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  };

  // Share to Warpcast
  const shareToWarpcast = async () => {
    if (!cardRef.current || !profile) return;

    setShareStatus("capturing");
    setErrorMessage(null);

    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#0f1121",
      });

      // Upload to server
      setShareStatus("uploading");

      const saveRes = await fetch("/api/save-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: profile.displayName || handle,
          imageData: dataUrl,
        }),
      });

      if (!saveRes.ok) {
        const errorText = await saveRes.text();
        throw new Error(`Image save failed: ${saveRes.status} - ${errorText}`);
      }

      const { blobUrl } = await saveRes.json();

      // Try to use Farcaster SDK if available
      try {
        const sdk = (window as any).farcaster?.sdk;
        if (sdk && sdk.actions && sdk.actions.composeCast) {
          await sdk.actions.composeCast({
            text: "Check out my creator analytics on Zora! Not financial advice. Just vibes.",
            embeds: [
              `${process.env.NEXT_PUBLIC_URL || window.location.origin}/frame/${handle}`,
            ],
          });
        } else {
          // Fallback to Warpcast website
          const text = `Check out my creator analytics on Zora! Not financial advice. Just vibes.`;
          const url = encodeURIComponent(
            `${process.env.NEXT_PUBLIC_URL || window.location.origin}/frame/${handle}`,
          );
          const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&url=${url}`;
          window.open(warpcastUrl, "_blank");
        }
      } catch (error) {
        console.error("Error using Farcaster SDK:", error);
        // Fallback to Warpcast website
        const text = `Check out my creator analytics on Zora! Not financial advice. Just vibes.`;
        const url = encodeURIComponent(
          `${process.env.NEXT_PUBLIC_URL || window.location.origin}/frame/${handle}`,
        );
        const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&url=${url}`;
        window.open(warpcastUrl, "_blank");
      }

      setShareStatus("idle");
    } catch (error) {
      console.error("❌ Failed to share to Warpcast:", error);
      setShareStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  };

  // Button text based on status
  const getButtonText = (type: "download" | "twitter" | "warpcast") => {
    if (shareStatus !== "idle" && shareStatus !== "error") {
      switch (shareStatus) {
        case "capturing":
          return "Capturing...";
        case "uploading":
          return "Uploading...";
        case "sharing":
          return "Opening...";
        default:
          return "Please wait...";
      }
    }

    switch (type) {
      case "download":
        return "Download Image";
      case "twitter":
        return "Share to Twitter";
      case "warpcast":
        return "Share to Warpcast";
    }
  };

  return (
    <div className="mb-6 space-y-4">
      {/* The actual card that will be captured for sharing */}
      <div
        ref={cardRef}
        className="bg-gradient-to-r from-[#0f1121] to-[#161a2c] p-6 rounded-lg border border-gray-700 max-w-xl mx-auto"
      >
        {/* Header with Zora branding */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-lime-500 font-bold text-lg font-mono">
            ZORA ANALYTICS
          </div>
        </div>

        {/* Profile section */}
        <div className="flex items-start space-x-4 mb-6">
          <div className="h-16 w-16 rounded-full overflow-hidden relative border-2 border-lime-500/30 shadow-lg shadow-lime-500/10 flex-shrink-0">
            <img
              src={profile?.avatar?.medium || profile?.avatar?.small}
              alt={profile?.displayName || profile?.handle || "Creator Avatar"}
              className="object-cover !w-16 !h-16 w-full h-full"
            />
          </div>

          <div>
            <h2 className="text-xl text-white font-bold">
              {profile.displayName || profile.handle || handle}
            </h2>
            <p className="text-gray-400 text-sm">@{profile.handle || handle}</p>
          </div>
        </div>

        {/* Key metrics grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#13151F] p-3 rounded-lg">
            <p className="text-gray-400 text-xs mb-1 font-mono">TOTAL EARNED</p>
            <p className="text-lime-400 text-xl font-bold">
              ${formatCompactNumber(Number(totalEarnings.toFixed(2)))}
            </p>
          </div>

          <div className="bg-[#13151F] p-3 rounded-lg">
            <p className="text-gray-400 text-xs mb-1 font-mono">COINS</p>
            <p className="text-white text-xl font-bold">{totalPosts}</p>
          </div>

          <div className="bg-[#13151F] p-3 rounded-lg">
            <p className="text-gray-400 text-xs mb-1 font-mono">AVG EARNINGS</p>
            <p className="text-lime-400 text-xl font-bold">
              ${formatCompactNumber(Number(avgTotalEarnings.toFixed(2)))}
            </p>
          </div>

          <div className="bg-[#13151F] p-3 rounded-lg">
            <p className="text-gray-400 text-xs mb-1 font-mono">TOTAL VOLUME</p>
            <p className="text-white text-xl font-bold">
              ${formatCompactNumber(Number(totalVolume.toFixed(2)))}
            </p>
          </div>
        </div>

        {/* Pie chart section */}
        <div className="bg-[#13151F] p-4 rounded-lg mb-4">
          <p className="text-gray-400 text-xs mb-2 font-mono">
            COLLECTOR BREAKDOWN
          </p>
          <div className="flex h-52 items-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                  tick={{ fill: "#999" }}
                />
                <YAxis
                  tickFormatter={(value) => `$${value}`}
                  tick={{ fill: "#999" }}
                />
                <Tooltip
                  formatter={(value) => `$${Number(value).toFixed(2)}`}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="earnings" fill="#8FE388" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Share buttons */}
      <div className="flex flex-wrap justify-center gap-3">
        <Button
          onClick={downloadImage}
          disabled={["capturing", "uploading", "sharing"].includes(shareStatus)}
          className="bg-gray-800 hover:bg-gray-700 text-white"
          size="sm"
        >
          {getButtonText("download")}
        </Button>

        <Button
          onClick={shareToTwitter}
          disabled={["capturing", "uploading", "sharing"].includes(shareStatus)}
          className="bg-[#1DA1F2] hover:bg-[#1a94df] text-white"
          size="sm"
        >
          {getButtonText("twitter")}
        </Button>

        <Button
          onClick={shareToWarpcast}
          disabled={["capturing", "uploading", "sharing"].includes(shareStatus)}
          className="bg-[#8A63D2] hover:bg-[#7d5bc7] text-white"
          size="sm"
        >
          {getButtonText("warpcast")}
        </Button>
      </div>

      {errorMessage && (
        <p className="text-red-500 text-xs text-center mt-2">{errorMessage}</p>
      )}
    </div>
  );
}
