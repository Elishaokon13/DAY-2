'use client';

import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { CollectorStatsResponse } from '@/app/api/collector-stats/route';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface UserStatsProps {
  coinAddress: string;
}

export function UserStats({ coinAddress }: UserStatsProps) {
  const [stats, setStats] = useState<CollectorStatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      if (!coinAddress) return;

      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/collector-stats?address=${encodeURIComponent(coinAddress)}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching collector stats: ${response.statusText}`);
        }
        
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch collector stats:', err);
        setError('Failed to load collector data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchStats();
  }, [coinAddress]);

  // Helper function to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Data preparation for pie chart
  const prepareChartData = () => {
    if (!stats) return [];
    
    return [
      { name: 'Collectors', value: stats.stats.collectors },
      { name: 'Traders', value: stats.stats.traders }
    ];
  };

  // Colors for the pie chart
  const COLORS = ['#8FE388', '#F3BA4A'];

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

  if (error || !stats) {
    return (
      <div className="p-6 bg-[#1a1e2e] rounded-lg border border-red-700 text-red-500">
        <p>{error || 'No collector stats available'}</p>
      </div>
    );
  }

  const chartData = prepareChartData();

  return (
    <Card className="p-6 bg-[#1a1e2e] border border-gray-700">
      <h2 className="text-lime-500 text-xl font-mono mb-4">COLLECTOR ANALYSIS</h2>
      
      <div className="mb-6">
        <p className="text-gray-400 font-mono text-sm mb-2">{stats.name} ({stats.symbol})</p>
        <p className="text-white font-mono text-sm">Total Holders: {stats.stats.uniqueHolders}</p>
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
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`${value} holders`, '']}
              contentStyle={{ backgroundColor: '#000', borderColor: '#333' }}
            />
            <Legend 
              formatter={(value) => <span style={{color: '#fff', fontFamily: 'monospace'}}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-2 gap-6 mt-4">
        <div className="border-b border-gray-700 pb-2">
          <p className="text-gray-400 font-mono text-sm">COLLECTOR VOLUME</p>
          <p className="text-[#8FE388] text-lg font-mono">{formatCurrency(stats.stats.collectorVolume)}</p>
          <p className="text-gray-500 text-xs font-mono">{stats.stats.collectors} users</p>
        </div>
        
        <div className="border-b border-gray-700 pb-2">
          <p className="text-gray-400 font-mono text-sm">TRADER VOLUME</p>
          <p className="text-[#F3BA4A] text-lg font-mono">{formatCurrency(stats.stats.traderVolume)}</p>
          <p className="text-gray-500 text-xs font-mono">{stats.stats.traders} users</p>
        </div>
      </div>
      
      <div className="mt-4 text-gray-500 text-xs italic">
        <p>* Collector/trader classification is based on estimated holding patterns</p>
      </div>
    </Card>
  );
} 