"use client";

import { Card } from "../ui/card";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
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
        <p className="text-gray-400 font-mono text-sm">
          Unique Holders: <span className="text-white">{totalHolders}</span>
        </p>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={barChartData}>
            <defs>
              <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8FE388" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8FE388" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => {
                const d = new Date(date);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
              tick={{ fill: "#999" }}
              stroke="#666"
            />
            <YAxis
              tickFormatter={(value) => `$${value}`}
              tick={{ fill: "#999" }}
              stroke="#666"
            />
            <Tooltip
              formatter={(value) => `$${Number(value).toFixed(2)}`}
              labelStyle={{ color: "#fff" }}
              contentStyle={{
                backgroundColor: 'rgba(17, 17, 17, 0.9)',
                border: '1px solid rgba(107, 114, 128, 0.3)',
                borderRadius: '8px',
              }}
            />
            <Area 
              type="monotone" 
              dataKey="earnings" 
              stroke="#8FE388"
              strokeWidth={2}
              fill="url(#colorEarnings)"
              name="Earnings"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
