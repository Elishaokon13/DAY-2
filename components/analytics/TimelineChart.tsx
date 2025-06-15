"use client";

import { Card } from "../ui/card";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Tooltip,
  ResponsiveContainer,
  Bar,
} from "recharts";

interface TimelineChartProps {
  totalHolders: number;
  sorted: any[]; // Use a more specific type if possible
}

export function TimelineChart({ totalHolders, sorted }: TimelineChartProps) {
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

  return (
    <Card className="p-6 bg-[#1a1e2e] border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lime-500 text-xl font-mono">EARNINGS OVER TIME</h2>
      </div>

      <div className="mb-4">
        <p className="text-gray-400 font-mono text-sm mb-1">
          Unique Holders: <span className="text-white">{totalHolders}</span>
        </p>
      </div>

      <div className="h-72 w-full">
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
    </Card>
  );
}
