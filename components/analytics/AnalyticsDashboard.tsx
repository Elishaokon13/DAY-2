'use client';

import { useState, useEffect } from 'react';
import { EarningsSummary } from './EarningsSummary';
import { UserStats } from './UserStats';
import { TimelineChart } from './TimelineChart';
import { Button } from '../ui/button';
import { CreatorProfile } from './CreatorProfile';
import { ShareableAnalyticsCard } from './ShareableAnalyticsCard';

// Define types for the new API response
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
      items: Array<{
        name: string;
        symbol: string;
        address: string;
        balance: number;
        creatorAddress?: string;
      }>;
    };
  };
  holderVsTrader: {
    totalHolders: number;
    estimatedCollectors: number;
    estimatedTraders: number;
    coinBreakdown: any[];
  };
}

interface AnalyticsDashboardProps {
  handle: string;
  onBack?: () => void;
}

export function AnalyticsDashboard({ handle, onBack }: AnalyticsDashboardProps) {
  const [creatorData, setCreatorData] = useState<AnalyticsResults | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);
  const [showShareableCard, setShowShareableCard] = useState<boolean>(false);

  useEffect(() => {
    async function fetchCreatorData() {
      if (!handle) return;

      setLoading(true);
      setError(null);
      
      try {
        console.log(`Fetching creator data for handle: ${handle}`);
        // Use the new creator-analytics API instead of creator-earnings
        const response = await fetch(`/api/creator-analytics?identifier=${encodeURIComponent(handle)}&fetchAll=true`);
        
        if (!response.ok) {
          throw new Error(`Error fetching creator data: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Creator data fetched:", data);
        setCreatorData(data);
        
        // Set the first coin as selected by default if available
        if (data.coins.created.items && data.coins.created.items.length > 0) {
          setSelectedCoin(data.coins.created.items[0].address);
        }
      } catch (err) {
        console.error('Failed to fetch creator data:', err);
        setError('Failed to load creator data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchCreatorData();
  }, [handle]);

  if (loading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/3 mb-8"></div>
        <div className="grid gap-6">
          <div className="h-64 bg-gray-700 rounded"></div>
          <div className="grid grid-cols-2 gap-6">
            <div className="h-64 bg-gray-700 rounded"></div>
            <div className="h-64 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-500">
        <h2 className="text-xl font-mono mb-4">Error Loading Analytics</h2>
        <p>{error}</p>
        {onBack && (
          <Button 
            variant="outline"
            className="mt-4"
            onClick={onBack}
          >
            Go Back
          </Button>
        )}
      </div>
    );
  }

  // If no data is available
  if (!creatorData) {
    return (
      <div className="p-6 text-red-500">
        <h2 className="text-xl font-mono mb-4">No Data Available</h2>
        <p>Unable to load creator data.</p>
        {onBack && (
          <Button 
            variant="outline"
            className="mt-4"
            onClick={onBack}
          >
            Go Back
          </Button>
        )}
      </div>
    );
  }

  // If no coins created yet
  if (!creatorData.coins.created.items || creatorData.coins.created.items.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-mono text-lime-500 mb-6">Creator Analytics</h2>
        <div className="bg-[#1a1e2e] p-6 rounded-lg border border-gray-700">
          <p className="text-white mb-4">No creator coins found for @{handle}</p>
          <p className="text-gray-400 mb-6">Once you create coins on Zora, your earnings analytics will appear here.</p>
          {onBack && (
            <Button 
              variant="outline"
              onClick={onBack}
            >
              Go Back
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Toggle between analytics dashboard and shareable card
  if (showShareableCard) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-mono text-lime-500">Shareable Analytics Card</h2>
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
          <p>Share your creator analytics with your audience or download for your records.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-mono text-lime-500">Creator Analytics</h2>
        <div className="flex gap-2">
          <Button 
            className="bg-lime-900/30 border border-lime-700/50 hover:bg-lime-800/40 text-lime-400 py-4 px-4 font-mono tracking-wider transition-colors duration-300"
            variant="outline"
            size="sm"
            onClick={() => setShowShareableCard(true)}
          >
            Create Shareable Card
          </Button>
          
          {onBack && (
            <Button 
              className="bg-lime-900/30 border border-lime-700/50 hover:bg-lime-800/40 text-lime-400 py-4 px-4 font-mono tracking-wider transition-colors duration-300"
              variant="outline"
              size="sm"
              onClick={onBack}
            >
              Search for another creator
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        {/* Creator Profile */}
        <div className="bg-[#1a1e2e] p-6 rounded-lg border border-gray-700">
          <div className="flex items-start gap-4">
            {creatorData.profile.avatar ? (
              <div className="w-16 h-16 rounded-full overflow-hidden relative">
                <img 
                  src={creatorData.profile.avatar} 
                  alt={creatorData.profile.displayName || creatorData.profile.handle} 
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-lime-900/20 flex items-center justify-center">
                <span className="text-lime-500 text-xl font-bold">
                  {(creatorData.profile.displayName || creatorData.profile.handle)?.charAt(0)?.toUpperCase() || 'Z'}
                </span>
              </div>
            )}
            
            <div>
              <h2 className="text-xl font-mono text-white">{creatorData.profile.displayName || creatorData.profile.handle}</h2>
              <p className="text-gray-400">@{creatorData.profile.handle}</p>
              {creatorData.profile.bio && <p className="text-gray-400 mt-2 text-sm">{creatorData.profile.bio}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-[#13151F] p-3 rounded-lg">
              <p className="text-gray-400 text-xs mb-1 font-mono">TOTAL EARNINGS</p>
              <p className="text-lime-400 text-xl font-bold">
                ${creatorData.metrics.totalEarnings.toFixed(2)}
              </p>
            </div>
            
            <div className="bg-[#13151F] p-3 rounded-lg">
              <p className="text-gray-400 text-xs mb-1 font-mono">TRADING VOLUME</p>
              <p className="text-white text-xl font-bold">
                ${creatorData.metrics.totalVolume.toFixed(2)}
              </p>
            </div>
            
            <div className="bg-[#13151F] p-3 rounded-lg">
              <p className="text-gray-400 text-xs mb-1 font-mono">POSTS</p>
              <p className="text-white text-xl font-bold">
                {creatorData.metrics.posts}
              </p>
            </div>
            
            <div className="bg-[#13151F] p-3 rounded-lg">
              <p className="text-gray-400 text-xs mb-1 font-mono">AVG EARNINGS/POST</p>
              <p className="text-white text-xl font-bold">
                ${creatorData.metrics.averageEarningsPerPost.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Coin Selector */}
        {creatorData.coins.created.items.length > 1 && (
          <div className="bg-[#1a1e2e] p-4 rounded-lg border border-gray-700">
            <p className="text-gray-400 font-mono text-sm mb-2">SELECT COIN FOR DETAILED ANALYTICS</p>
            <div className="flex flex-wrap gap-2">
              {creatorData.coins.created.items.map((coin) => (
                <button
                  key={coin.address}
                  onClick={() => setSelectedCoin(coin.address)}
                  className={`px-3 py-2 rounded font-mono text-sm ${
                    selectedCoin === coin.address
                      ? 'bg-lime-700 text-white'
                      : 'bg-[#13151F] text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  {coin.name} ({coin.symbol})
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Detailed Analytics for Selected Coin */}
        {selectedCoin && (
          <div className="grid md:grid-cols-2 gap-6">
            <UserStats coinAddress={selectedCoin} />
            <TimelineChart coinAddress={selectedCoin} />
          </div>
        )}
      </div>
      
      <div className="mt-8 text-gray-500 text-center text-xs">
        <p>Data displayed is based on estimates and may not reflect actual earnings.</p>
      </div>
    </div>
  );
} 