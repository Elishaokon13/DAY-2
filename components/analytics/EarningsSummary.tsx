'use client';

import { useState, useEffect } from 'react';
import { CreatorEarningsResponse } from '@/app/api/creator-earnings/route';

interface EarningsSummaryProps {
  handle: string;
}

export function EarningsSummary({ handle }: EarningsSummaryProps) {
  const [metricsData, setMetricsData] = useState<CreatorEarningsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetricsData() {
      if (!handle) return;

      setLoading(true);
      setError(null);
      
      try {
        console.log(`EarningsSummary: Fetching creator earnings for ${handle}`);
        const response = await fetch(`/api/creator-earnings?handle=${encodeURIComponent(handle)}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching metrics data: ${response.statusText}`);
        }
        
        const data = await response.json();
        // console.log(`EarningsSummary: Data received:`, data);
        setMetricsData(data);
      } catch (err) {
        console.error('Failed to fetch metrics data:', err);
        setError('Failed to load metrics data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchMetricsData();
  }, [handle]);

  if (loading) {
    return (
      <div className="bg-[#1a1e2e] p-6 rounded-lg border border-gray-700 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/3 mb-6"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="h-24 bg-gray-700 rounded"></div>
          <div className="h-24 bg-gray-700 rounded"></div>
          <div className="h-24 bg-gray-700 rounded"></div>
          <div className="h-24 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !metricsData) {
    console.error('EarningsSummary: Error or no data:', error, metricsData);
    return (
      <div className="bg-[#1a1e2e] p-6 rounded-lg border border-gray-700">
        <p className="text-red-500">Failed to load earnings data.</p>
      </div>
    );
  }

  // Format numbers for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="bg-[#1a1e2e] p-6 rounded-lg border border-gray-700">
      <h3 className="text-xl font-mono text-white mb-6">Earnings Summary</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Total Earnings */}
        <div>
          <p className="text-gray-400 text-sm mb-1 font-mono">TOTAL EARNINGS</p>
          <p className="text-lime-400 text-2xl font-bold">
            {formatCurrency(metricsData.metrics.totalEarnings)}
          </p>
        </div>
        
        {/* Total Volume */}
        <div>
          <p className="text-gray-400 text-sm mb-1 font-mono">TRADING VOLUME</p>
          <p className="text-white text-2xl font-bold">
            {formatCurrency(metricsData.metrics.totalVolume)}
          </p>
        </div>
        
        {/* Posts Count */}
        <div>
          <p className="text-gray-400 text-sm mb-1 font-mono">POSTS</p>
          <p className="text-white text-2xl font-bold">
            {formatNumber(metricsData.metrics.posts)}
          </p>
        </div>
        
        {/* Avg Earnings Per Post */}
        <div>
          <p className="text-gray-400 text-sm mb-1 font-mono">AVG PER POST</p>
          <p className="text-white text-2xl font-bold">
            {formatCurrency(metricsData.metrics.avgEarningsPerPost)}
          </p>
        </div>
      </div>
      
      {/* If available, show additional metrics like growth rate, etc. */}
      {/* For future implementation */}
      
    </div>
  );
} 