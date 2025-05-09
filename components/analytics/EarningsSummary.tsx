'use client';

import { useState, useEffect } from 'react';
import { CreatorEarningsResponse } from '@/app/api/creator-earnings/route';
import { Card } from '../ui/card';

interface EarningsSummaryProps {
  handle: string;
}

export function EarningsSummary({ handle }: EarningsSummaryProps) {
  const [earnings, setEarnings] = useState<CreatorEarningsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEarnings() {
      if (!handle) return;

      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/creator-earnings?handle=${encodeURIComponent(handle)}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching earnings: ${response.statusText}`);
        }
        
        const data = await response.json();
        setEarnings(data);
      } catch (err) {
        console.error('Failed to fetch earnings data:', err);
        setError('Failed to load earnings data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchEarnings();
  }, [handle]);

  // Helper function to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  if (loading) {
    return (
      <div className="p-6 bg-[#1a1e2e] rounded-lg border border-gray-700 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !earnings) {
    return (
      <div className="p-6 bg-[#1a1e2e] rounded-lg border border-red-700 text-red-500">
        <p>{error || 'No earnings data available'}</p>
      </div>
    );
  }

  return (
    <Card className="p-6 bg-[#1a1e2e] border border-gray-700">
      <h2 className="text-lime-500 text-xl font-mono mb-4">EARNINGS SUMMARY</h2>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="border-b border-gray-700 pb-2">
          <p className="text-gray-400 font-mono text-sm">TOTAL EARNINGS</p>
          <p className="text-white text-2xl font-mono">{formatCurrency(earnings.metrics.totalEarnings)}</p>
        </div>
        
        <div className="border-b border-gray-700 pb-2">
          <p className="text-gray-400 font-mono text-sm">TRADING VOLUME</p>
          <p className="text-white text-2xl font-mono">{formatCurrency(earnings.metrics.totalVolume)}</p>
        </div>
        
        <div className="border-b border-gray-700 pb-2">
          <p className="text-gray-400 font-mono text-sm">POSTS</p>
          <p className="text-white text-2xl font-mono">{earnings.metrics.posts}</p>
        </div>
        
        <div className="border-b border-gray-700 pb-2">
          <p className="text-gray-400 font-mono text-sm">AVG PER POST</p>
          <p className="text-white text-2xl font-mono">{formatCurrency(earnings.metrics.avgEarningsPerPost)}</p>
        </div>
      </div>
      
      {earnings.createdCoins.length > 0 && (
        <div className="mt-6">
          <h3 className="text-gray-400 font-mono text-sm mb-3">TOP EARNING POSTS</h3>
          
          <div className="space-y-2">
            {earnings.createdCoins
              .sort((a, b) => parseFloat(b.totalVolume) - parseFloat(a.totalVolume))
              .slice(0, 3)
              .map((coin) => (
                <div key={coin.address} className="flex justify-between items-center border-b border-gray-700 pb-2">
                  <div className="flex-1">
                    <p className="text-white font-mono">{coin.name}</p>
                    <p className="text-gray-400 font-mono text-xs">{coin.symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lime-400 font-mono">{formatCurrency(coin.estimatedEarnings)}</p>
                    <p className="text-gray-400 font-mono text-xs">Vol: {formatCurrency(parseFloat(coin.totalVolume))}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
      
      <div className="mt-4 text-gray-500 text-xs italic">
        <p>* Earnings are estimated based on 5% creator fees from total trading volume</p>
      </div>
    </Card>
  );
} 