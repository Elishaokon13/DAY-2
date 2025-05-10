'use client';

import { useState, useEffect } from 'react';
import { EarningsSummary } from './EarningsSummary';
import { UserStats } from './UserStats';
import { TimelineChart } from './TimelineChart';
import { Button } from '../ui/button';
import { CreatorProfile } from './CreatorProfile';
import { ShareableAnalyticsCard } from './ShareableAnalyticsCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
      processed: number;
      totalCount: number;
      hasMore: boolean;
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
  meta?: {
    isCached: boolean;
    fetchedAt: string;
    fetchType: string;
    pagesProcessed: number;
    limitApplied: number;
  };
}

interface AnalyticsDashboardProps {
  handle: string;
  onBack?: () => void;
}

export function AnalyticsDashboard({ handle, onBack }: AnalyticsDashboardProps) {
  const [creatorData, setCreatorData] = useState<AnalyticsResults | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState<boolean>(false);
  const [fullDataLoading, setFullDataLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);
  const [showShareableCard, setShowShareableCard] = useState<boolean>(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Initial data load - fast load with limited data
  useEffect(() => {
    async function fetchInitialData() {
      if (!handle) return;

      setLoading(true);
      setError(null);
      
      try {
        console.log(`Fetching initial data for handle: ${handle}`);
        // Use the initialLoadOnly parameter to get faster results
        const response = await fetch(`/api/creator-analytics?identifier=${encodeURIComponent(handle)}&initialLoadOnly=true`);
        
        if (!response.ok) {
          throw new Error(`Error fetching creator data: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Initial creator data fetched:", data);
        setCreatorData(data);
        setInitialLoadComplete(true);
        
        // Set the first coin as selected by default if available
        if (data.coins.created.items && data.coins.created.items.length > 0) {
          setSelectedCoin(data.coins.created.items[0].address);
        }
      } catch (err) {
        console.error('Failed to fetch initial creator data:', err);
        setError('Failed to load creator data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchInitialData();
  }, [handle]);

  // Load full data after initial data is displayed
  useEffect(() => {
    async function fetchFullData() {
      if (!initialLoadComplete || !handle || !creatorData?.coins.created.hasMore) return;

      setFullDataLoading(true);
      
      try {
        console.log(`Fetching complete data for handle: ${handle}`);
        // Use a higher limit to get more data
        const response = await fetch(`/api/creator-analytics?identifier=${encodeURIComponent(handle)}&fetchAll=true&limit=50`);
        
        if (!response.ok) {
          throw new Error(`Error fetching complete creator data: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Complete creator data fetched:", data);
        setCreatorData(data);
        
      } catch (err) {
        console.error('Failed to fetch complete creator data:', err);
        // Don't set error - we already have initial data
      } finally {
        setFullDataLoading(false);
      }
    }
    
    fetchFullData();
  }, [initialLoadComplete, handle, creatorData?.coins.created.hasMore]);

  // Function to manually reload full data
  const loadMoreData = async () => {
    if (!handle) return;
    
    setFullDataLoading(true);
    
    try {
      // Skip cache to force fresh data
      const response = await fetch(`/api/creator-analytics?identifier=${encodeURIComponent(handle)}&fetchAll=true&limit=100&skipCache=true`);
      
      if (!response.ok) {
        throw new Error(`Error fetching more creator data: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("More creator data fetched:", data);
      setCreatorData(data);
    } catch (err) {
      console.error('Failed to fetch more creator data:', err);
    } finally {
      setFullDataLoading(false);
    }
  };

  // Pagination handlers
  const totalPages = creatorData ? Math.ceil(creatorData.coins.created.items.length / pageSize) : 0;
  
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Get paginated coins
  const getPaginatedCoins = () => {
    if (!creatorData) return [];
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return creatorData.coins.created.items.slice(startIndex, endIndex);
  };

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

        {/* Data loading status */}
        {fullDataLoading && (
          <div className="bg-[#1a1e2e] p-3 rounded-lg border border-gray-700">
            <div className="flex items-center justify-center">
              <div className="animate-spin h-4 w-4 border-2 border-lime-500 rounded-full border-t-transparent mr-2"></div>
              <p className="text-gray-400 text-sm">Loading complete data...</p>
            </div>
          </div>
        )}
        
        {/* Data completeness info */}
        {creatorData.meta && creatorData.coins.created.hasMore && !fullDataLoading && (
          <div className="bg-[#1a1e2e] p-3 rounded-lg border border-gray-700">
            <div className="flex flex-col sm:flex-row items-center justify-between">
              <p className="text-gray-400 text-sm mb-2 sm:mb-0">
                Showing {creatorData.coins.created.processed} of {creatorData.coins.created.count} coins
                {creatorData.meta.isCached && " (cached data)"}
              </p>
              <Button 
                className="bg-lime-900/30 border border-lime-700/50 hover:bg-lime-800/40 text-lime-400 font-mono"
                variant="outline"
                size="sm"
                onClick={loadMoreData}
              >
                Load More Data
              </Button>
            </div>
          </div>
        )}
        
        {/* Paginated Coin Selector */}
        {creatorData.coins.created.items.length > 0 && (
          <div className="bg-[#1a1e2e] p-4 rounded-lg border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-400 font-mono text-sm">SELECT COIN FOR DETAILED ANALYTICS</p>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">
                  Page {currentPage} of {totalPages} 
                  ({pageSize} coins per page, {creatorData.coins.created.items.length} total)
                </span>
                <div className="flex gap-1">
                  <Button 
                    onClick={goToPrevPage}
                    disabled={currentPage <= 1}
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 flex items-center justify-center"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={goToNextPage}
                    disabled={currentPage >= totalPages}
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 flex items-center justify-center"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {getPaginatedCoins().map((coin) => (
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
            
            {/* Page selector */}
            {totalPages > 5 && (
              <div className="mt-4 flex justify-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Calculate page numbers to show centered around current page
                  const pageOffset = Math.max(0, currentPage - 3);
                  const pageNum = i + 1 + pageOffset;
                  
                  // Only show up to totalPages
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <Button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      className={`h-8 w-8 p-0 ${
                        pageNum === currentPage ? 'bg-lime-700 text-white' : ''
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="flex items-center text-gray-500">...</span>
                    <Button
                      onClick={() => setCurrentPage(totalPages)}
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>
            )}
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