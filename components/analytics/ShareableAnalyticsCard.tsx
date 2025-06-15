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
  const cardRef = useRef<HTMLDivElement>(null);

const captureImage = async (): Promise<string | null> => {
  if (!cardRef.current) {
    setErrorMessage("Card element not found");
    return null;
  }

  try {
    // Add a small delay to ensure DOM is ready
    await new Promise((resolve) => setTimeout(resolve, 100));

    const dataUrl = await htmlToImage.toPng(cardRef.current, {
      quality: 1.0,
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: "#0f1121",
      width: cardRef.current.offsetWidth,
      height: cardRef.current.offsetHeight,
      // Add these options for better compatibility
      skipAutoScale: true,
      // useCORS: true,
      // allowTaint: true,
    });

    return dataUrl;
  } catch (error) {
    console.error("Image capture failed:", error);
    setErrorMessage(
      `Failed to capture image: ${"Unknown error"}`,
    );
    return null;
  }
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

const downloadImage = async () => {
  setShareStatus("capturing");
  setErrorMessage(null);

  try {
    const dataUrl = await captureImage();
    if (!dataUrl) {
      setShareStatus("error");
      setErrorMessage("Failed to capture image for download");
      return;
    }

    // Convert data URL to blob for better browser compatibility
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Create object URL from blob
    const blobUrl = URL.createObjectURL(blob);

    // Create and trigger download
    const link = document.createElement("a");
    link.download = `${handle}-zora-analytics.png`;
    link.href = blobUrl;

    // Append to body, click, then remove (for better browser compatibility)
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the object URL
    URL.revokeObjectURL(blobUrl);

    setShareStatus("idle");
  } catch (error) {
    console.error("Download failed:", error);
    setErrorMessage("Download failed. Please try again.");
    setShareStatus("error");
  }
};
  // Share to Twitter
const shareToTwitter = async () => {
  setShareStatus("capturing");
  setErrorMessage(null);

  const dataUrl = await captureImage();
  if (!dataUrl) return setShareStatus("error");

  setShareStatus("uploading");

  try {
    const res = await fetch("/api/save-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: profile.displayName || handle,
        imageData: dataUrl,
      }),
    });

    const { blobUrl } = await res.json();

    const text = `Check out my creator analytics on Zora!`;
    const frameUrl = `${process.env.NEXT_PUBLIC_URL || window.location.origin}/frame/${handle}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text,
    )}&url=${encodeURIComponent(frameUrl)}`;

    window.open(twitterUrl, "_blank");
    setShareStatus("idle");
  } catch (err) {
    console.error("Twitter share error:", err);
    setErrorMessage("Twitter share failed.");
    setShareStatus("error");
  }
};
  // Share to Warpcast
const shareToFarcaster = async () => {
  setShareStatus("capturing");
  setErrorMessage(null);

  const dataUrl = await captureImage();
  if (!dataUrl) return setShareStatus("error");

  setShareStatus("uploading");

  try {
    const res = await fetch("/api/save-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: profile.displayName || handle,
        imageData: dataUrl,
      }),
    });

    const { blobUrl } = await res.json();
    const castUrl = `${process.env.NEXT_PUBLIC_URL || window.location.origin}/frame/${handle}`;
    const farcaster = (window as any).farcaster?.sdk;

    if (farcaster?.actions?.composeCast) {
      await farcaster.actions.composeCast({
        text: "Check out my creator analytics on Zora!",
        embeds: [castUrl],
      });
    } else {
      const fallbackUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(
        "Check out my creator analytics on Zora!",
      )}&url=${encodeURIComponent(castUrl)}`;
      window.open(fallbackUrl, "_blank");
    }

    setShareStatus("idle");
  } catch (err) {
    console.error("Farcaster share error:", err);
    setErrorMessage("Farcaster share failed.");
    setShareStatus("error");
  }
};

  // Button text based on status
  const getButtonText = (type: "download" | "twitter" | "farcaster") => {
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
      case "farcaster":
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
      {/* <div className="flex flex-wrap justify-center gap-3">
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
          onClick={shareToFarcaster}
          disabled={["capturing", "uploading", "sharing"].includes(shareStatus)}
          className="bg-[#8A63D2] hover:bg-[#7d5bc7] text-white"
          size="sm"
        >
          {getButtonText("farcaster")}
        </Button>
      </div> */}

      {errorMessage && (
        <p className="text-red-500 text-xs text-center mt-2">{errorMessage}</p>
      )}
    </div>
  );
}
