"use client";

import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface UserStatsProps {
  coinAddress: string;
  totalHolders: number;
}

interface UserStatsData {
  traders: number;
  collectors: number;
  totalUsers: number;
  price: number;
  name: string;
  symbol: string;
}

export function UserStats({ coinAddress, totalHolders }: UserStatsProps) {
  const [statsData, setStatsData] = useState<UserStatsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserStats() {
      if (!coinAddress) return;

      setLoading(true);
      setError(null);

      try {
        console.log(`UserStats: Fetching data for coin ${coinAddress}`);
        const response = await fetch(
          `/api/collector-stats?coinAddress=${encodeURIComponent(coinAddress)}`,
        );

        if (!response.ok) {
          throw new Error(`Error fetching user stats: ${response.statusText}`);
        }

        const data = await response.json();
        // console.log(`UserStats: Data received:`, data);

        // Extract primitive values from the response objects
        setStatsData({
          traders:
            typeof data.traders === "object"
              ? data.traders.count
              : data.traders,
          collectors:
            typeof data.collectors === "object"
              ? data.collectors.count
              : data.collectors,
          totalUsers: data.totalUsers,
          price: data.price,
          name: data.name,
          symbol: data.symbol,
        });
      } catch (err) {
        console.error("Failed to fetch user stats:", err);
        setError("Failed to load user statistics");

        // Fallback to mock data for demonstration
        setStatsData({
          traders: 8,
          collectors: 12,
          totalUsers: 20,
          price: 0,
          name: "",
          symbol: "",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchUserStats();
  }, [coinAddress]);

  // Helper function to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Data preparation for pie chart
  const prepareChartData = () => {
    if (!statsData) return [];

    return [
      {
        name: "Collectors",
        value:
          typeof statsData.collectors === "object"
            ? statsData.collectors.count || 0
            : statsData.collectors,
      },
      {
        name: "Traders",
        value:
          typeof statsData.traders === "object"
            ? statsData.traders.count || 0
            : statsData.traders,
      },
    ];
  };

  // Colors for the pie chart
  const COLORS = ["#8FE388", "#F3BA4A"];

  if (loading) {
    return (
      <div className="p-6 bg-[#1a1e2e] rounded-lg border border-gray-700 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-40 bg-gray-700 rounded mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !statsData) {
    return (
      <div className="p-6 bg-[#1a1e2e] rounded-lg border border-red-700 text-red-500">
        <p>{error || "No collector stats available"}</p>
      </div>
    );
  }

  const chartData = prepareChartData();

  // Calculate percentages
  const traderPercentage =
    statsData.totalUsers > 0
      ? Math.round((statsData.traders / statsData.totalUsers) * 100)
      : 0;
  const collectorPercentage =
    statsData.totalUsers > 0
      ? Math.round((statsData.collectors / statsData.totalUsers) * 100)
      : 0;

  return (
    <Card className="p-6 bg-[#1a1e2e] border border-gray-700">
      <h2 className="text-lime-500 text-xl font-mono mb-4">
        COLLECTOR ANALYSIS
      </h2>

      <div className="mb-6">
        <p className="text-white font-mono text-sm">
          Total Holders: {totalHolders}
        </p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [`${value} holders`, ""]}
              contentStyle={{ backgroundColor: "#000", borderColor: "#333" }}
            />
            <Legend
              formatter={(value) => (
                <span style={{ color: "#fff", fontFamily: "monospace" }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-4">
        <div className="border-b border-gray-700 pb-2">
          <p className="text-gray-400 font-mono text-sm">COLLECTOR VOLUME</p>
          <p className="text-[#8FE388] text-lg font-mono">
            {formatCurrency(
              (typeof statsData.collectors === "object"
                ? statsData.collectors.count
                : statsData.collectors) * (statsData.price || 0),
            )}
          </p>
          <p className="text-gray-500 text-xs font-mono">
            {typeof statsData.collectors === "object"
              ? statsData.collectors.count
              : statsData.collectors}{" "}
            users
          </p>
        </div>

        <div className="border-b border-gray-700 pb-2">
          <p className="text-gray-400 font-mono text-sm">TRADER VOLUME</p>
          <p className="text-[#F3BA4A] text-lg font-mono">
            {formatCurrency(
              (typeof statsData.traders === "object"
                ? statsData.traders.count
                : statsData.traders) * (statsData.price || 0),
            )}
          </p>
          <p className="text-gray-500 text-xs font-mono">
            {typeof statsData.traders === "object"
              ? statsData.traders.count
              : statsData.traders}{" "}
            users
          </p>
        </div>
      </div>
    </Card>
  );
}
