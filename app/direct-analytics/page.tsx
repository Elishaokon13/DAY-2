'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

// Define types for the API response
interface CoinDetail {
  name: string;
  symbol: string;
  address: string;
  balance: number;
  uniqueHolders: number;
  totalVolume: number;
  estimatedEarnings: number;
  creatorAddress?: string;
  creatorMatchDetails?: {
    creatorAddress: string;
    publicWallet: string;
    matchesPublic: boolean;
  };
}

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
      items: CoinDetail[];
    };
    collected: {
      count: number;
      items: CoinDetail[];
    };
  };
  holderVsTrader: {
    totalHolders: number;
    estimatedCollectors: number;
    estimatedTraders: number;
    coinBreakdown: any[];
  };
}

export default function DirectAnalyticsPage() {
  const [identifier, setIdentifier] = useState<string>('');
  const [results, setResults] = useState<AnalyticsResults | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchAll, setFetchAll] = useState<boolean>(false);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  
  const fetchAnalytics = async () => {
    if (!identifier) return;

    setLoading(true);
    setError(null);
    setResults(null);
    
    try {
      const response = await fetch(`/api/creator-analytics?identifier=${encodeURIComponent(identifier)}&fetchAll=${fetchAll}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Analytics response:', data);
      setResults(data);
    } catch (err: unknown) {
      console.error('Failed to fetch analytics:', err);
      setError((err as Error).message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAnalytics();
  };

  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // Format number with comma separators
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };
  
  // Generate time-based volume data (demo)
  const generateVolumeData = (totalVolume: number) => {
    const data = [];
    const now = new Date();
    const days = 30;
    
    // Generate decreasing volume over time
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      
      // More volume in the past, decreasing over time
      const factor = 1 - (i / (days * 2));
      const dailyVolume = (totalVolume / (days * 3)) * factor;
      
      data.push({
        date: date.toISOString().split('T')[0],
        volume: dailyVolume,
        earnings: dailyVolume * 0.05
      });
    }
    
    return data;
  };

  // Format the holder vs trader data for the pie chart
  const prepareHolderTraderPieData = (data: any) => {
    if (!data) return [];
    
    return [
      { name: 'Collectors', value: data.estimatedCollectors },
      { name: 'Traders', value: data.estimatedTraders }
    ];
  };
  
  const COLORS = ['#4CAF50', '#FF9800'];

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4 text-lime-500 font-mono">ZORA Creator Direct Analytics</h1>
      
      <Card className="p-6 bg-[#1a1e2e] border border-gray-700 mb-6">
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex gap-2 mb-4">
            <Input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter Zora handle or address"
              className="bg-[#13151F] border-gray-700 text-white"
            />
            <Button 
              type="submit" 
              disabled={loading || !identifier}
              className="bg-lime-900/30 border border-lime-700/50 hover:bg-lime-800/40 text-lime-400 font-mono"
            >
              {loading ? 'Fetching...' : 'Fetch Analytics'}
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="fetchAll"
              checked={fetchAll}
              onChange={(e) => setFetchAll(e.target.checked)}
              className="h-4 w-4 rounded border-gray-700 bg-[#13151F] text-lime-500"
            />
            <label htmlFor="fetchAll" className="text-sm text-gray-300">
              Fetch all pages (for more accurate results)
            </label>
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="showDiagnostics"
              checked={showDiagnostics}
              onChange={(e) => setShowDiagnostics(e.target.checked)}
              className="h-4 w-4 rounded border-gray-700 bg-[#13151F] text-lime-500"
            />
            <label htmlFor="showDiagnostics" className="text-sm text-gray-300">
              Show diagnostics (debugging)
            </label>
          </div>
        </form>
        
        <div className="text-gray-400 text-sm mb-4">
          <p>Try with:</p>
          <ul className="list-disc list-inside">
            <li>base (Zora handle)</li>
            <li>defidevrelalt (Zora handle)</li>
            <li>0xd91d9de054e294d9bebb7149955457300a9305cc (address)</li>
          </ul>
        </div>
      </Card>
      
      {error && (
        <Card className="p-6 bg-[#1a1e2e] border border-red-700 mb-6">
          <p className="text-red-500">{error}</p>
        </Card>
      )}
      
      {loading && (
        <Card className="p-6 bg-[#1a1e2e] border border-gray-700 mb-6">
          <div className="flex items-center justify-center space-x-2 animate-pulse">
            <div className="w-4 h-4 bg-lime-500 rounded-full"></div>
            <div className="w-4 h-4 bg-lime-500 rounded-full delay-75"></div>
            <div className="w-4 h-4 bg-lime-500 rounded-full delay-150"></div>
          </div>
          <p className="text-center text-gray-400 mt-4">Loading analytics data, please wait...</p>
        </Card>
      )}
      
      {results && (
        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="p-6 bg-[#1a1e2e] border border-gray-700">
            <div className="flex items-start gap-4">
              {results.profile.avatar ? (
                <div className="w-16 h-16 rounded-full overflow-hidden relative">
                  <Image
                    src={results.profile.avatar}
                    alt={results.profile.displayName || results.profile.handle}
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-lime-900/20 flex items-center justify-center">
                  <span className="text-lime-500 text-xl font-bold">
                    {(results.profile.displayName || results.profile.handle)?.charAt(0)?.toUpperCase() || 'Z'}
                  </span>
                </div>
              )}
              
              <div>
                <h2 className="text-xl font-mono text-white">{results.profile.displayName || results.profile.handle}</h2>
                {results.profile.handle && <p className="text-gray-400">@{results.profile.handle}</p>}
                {results.profile.bio && <p className="text-gray-400 mt-2 text-sm">{results.profile.bio}</p>}
              </div>
            </div>
            
            {results.profile.publicWallet && (
              <div className="mt-4">
                <p className="text-gray-400 text-xs font-mono">WALLET</p>
                <p className="text-white text-xs break-all font-mono">{results.profile.publicWallet}</p>
              </div>
            )}
          </Card>
          
          {/* Analytics Summary */}
          <Card className="p-6 bg-[#1a1e2e] border border-gray-700">
            <h2 className="text-xl font-mono text-lime-500 mb-6">Creator Metrics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#13151F] p-3 rounded-lg">
                <p className="text-gray-400 text-xs mb-1 font-mono">TOTAL EARNINGS</p>
                <p className="text-lime-400 text-xl font-bold">
                  {formatCurrency(results.metrics.totalEarnings)}
                </p>
              </div>
              
              <div className="bg-[#13151F] p-3 rounded-lg">
                <p className="text-gray-400 text-xs mb-1 font-mono">TRADING VOLUME</p>
                <p className="text-white text-xl font-bold">
                  {formatCurrency(results.metrics.totalVolume)}
                </p>
              </div>
              
              <div className="bg-[#13151F] p-3 rounded-lg">
                <p className="text-gray-400 text-xs mb-1 font-mono">POSTS</p>
                <p className="text-white text-xl font-bold">
                  {results.metrics.posts}
                </p>
              </div>
              
              <div className="bg-[#13151F] p-3 rounded-lg">
                <p className="text-gray-400 text-xs mb-1 font-mono">AVG EARNINGS/POST</p>
                <p className="text-white text-xl font-bold">
                  {formatCurrency(results.metrics.averageEarningsPerPost)}
                </p>
              </div>
            </div>
          </Card>
          
          {/* Charts Section */}
          {results.metrics.totalVolume > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Holder vs Trader Distribution */}
              <Card className="p-6 bg-[#1a1e2e] border border-gray-700">
                <h3 className="text-lg font-mono text-lime-500 mb-4">Collector vs Trader Distribution</h3>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={prepareHolderTraderPieData(results.holderVsTrader)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {prepareHolderTraderPieData(results.holderVsTrader).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatNumber(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-[#13151F] p-3 rounded-lg">
                    <p className="text-gray-400 text-xs mb-1">COLLECTORS</p>
                    <p className="text-green-400 font-bold">
                      {formatNumber(results.holderVsTrader.estimatedCollectors)}
                    </p>
                  </div>
                  <div className="bg-[#13151F] p-3 rounded-lg">
                    <p className="text-gray-400 text-xs mb-1">TRADERS</p>
                    <p className="text-orange-400 font-bold">
                      {formatNumber(results.holderVsTrader.estimatedTraders)}
                    </p>
                  </div>
                </div>
              </Card>
              
              {/* Volume Over Time */}
              <Card className="p-6 bg-[#1a1e2e] border border-gray-700">
                <h3 className="text-lg font-mono text-lime-500 mb-4">Trading Volume (30 Days)</h3>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={generateVolumeData(results.metrics.totalVolume)}>
                      <defs>
                        <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#9333EA" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#9333EA" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getMonth() + 1}/${date.getDate()}`;
                        }} 
                        tick={{ fill: '#999' }}
                      />
                      <YAxis 
                        tickFormatter={(value) => `$${value.toFixed(0)}`}
                        tick={{ fill: '#999' }}
                      />
                      <Tooltip 
                        formatter={(value) => formatCurrency(value as number)}
                        labelFormatter={(label) => new Date(label as string).toLocaleDateString()}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="volume" 
                        stroke="#9333EA" 
                        fillOpacity={1}
                        fill="url(#volumeGradient)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}
          
          {/* Diagnostics Panel - Only shown when enabled */}
          {showDiagnostics && (
            <Card className="p-6 bg-[#1a1e2e] border border-yellow-700">
              <h2 className="text-xl font-mono text-yellow-500 mb-4">Diagnostics Panel</h2>
              
              <div className="space-y-4">
                <div className="bg-[#13151F] p-4 rounded-lg">
                  <h3 className="font-mono text-yellow-400 mb-2">Creator Match Debugging</h3>
                  
                  <div className="mb-3">
                    <p className="text-gray-400 text-xs font-mono">USER PUBLIC WALLET</p>
                    <p className="text-white break-all font-mono">{results.profile.publicWallet || 'N/A'}</p>
                  </div>
                  
                  <h4 className="text-gray-300 mt-4 mb-2">Created Coins Details</h4>
                  {results.coins.created.items.map((coin, i) => (
                    <div key={`created-${i}`} className="border border-gray-700 p-3 rounded-md mb-3">
                      <p className="text-white font-medium">{coin.name} ({coin.symbol})</p>
                      <p className="text-gray-400 text-xs mt-1">Creator Address:</p>
                      <p className="text-white break-all font-mono text-xs">{coin.creatorAddress || 'Unknown'}</p>
                      <p className="mt-2 text-green-400 font-mono text-xs">Identified as created by you ✓</p>
                    </div>
                  ))}
                  
                  <h4 className="text-gray-300 mt-4 mb-2">First 5 Collected Coins Details</h4>
                  {results.coins.collected.items.slice(0, 5).map((coin, i) => (
                    <div key={`collected-${i}`} className="border border-gray-700 p-3 rounded-md mb-3">
                      <p className="text-white font-medium">{coin.name} ({coin.symbol})</p>
                      <p className="text-gray-400 text-xs mt-1">Creator Address:</p>
                      <p className="text-white break-all font-mono text-xs">{coin.creatorAddress || 'Unknown'}</p>
                      <p className="mt-2 text-yellow-400 font-mono text-xs">Identified as collected by you</p>
                      
                      {/* Compare addresses to help debug */}
                      {coin.creatorAddress && results.profile.publicWallet && (
                        <div className="mt-2 p-2 bg-[#1E1E2D] rounded">
                          <p className="text-xs text-gray-400">Address Match Check:</p>
                          <p className="text-xs text-gray-300">
                            Creator: <span className="font-mono">{coin.creatorAddress.toLowerCase()}</span>
                          </p>
                          <p className="text-xs text-gray-300">
                            Your wallet: <span className="font-mono">{results.profile.publicWallet.toLowerCase()}</span>
                          </p>
                          <p className="text-xs mt-1">
                            {coin.creatorAddress.toLowerCase() === results.profile.publicWallet.toLowerCase() ? 
                              <span className="text-green-400">Addresses match! Should be categorized as created.</span> : 
                              <span className="text-gray-400">Addresses don't match. Correctly categorized as collected.</span>
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
          
          {/* Created Coins */}
          {results.coins.created.count > 0 && (
            <Card className="p-6 bg-[#1a1e2e] border border-gray-700">
              <h2 className="text-xl font-mono text-lime-500 mb-4">Created Coins</h2>
              
              <div className="space-y-4">
                {results.coins.created.items.map((coin, index) => (
                  <div key={index} className="bg-[#13151F] p-4 rounded-lg">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="text-lime-500 font-bold">{coin.name || 'Unnamed Coin'}</h3>
                        <p className="text-gray-400 text-sm">{coin.symbol}</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-gray-400 text-xs">Earnings</p>
                        <p className="text-white font-mono">{formatCurrency(coin.estimatedEarnings)}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div>
                        <p className="text-gray-400 text-xs">Your Balance</p>
                        <p className="text-white font-mono">{coin.balance.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Volume</p>
                        <p className="text-white font-mono">{formatCurrency(coin.totalVolume)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Unique Holders</p>
                        <p className="text-white">{formatNumber(coin.uniqueHolders)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
          
          {/* Collected Coins */}
          {results.coins.collected.count > 0 && (
            <Card className="p-6 bg-[#1a1e2e] border border-gray-700">
              <h2 className="text-xl font-mono text-lime-500 mb-4">Collected Coins</h2>
              <div className="space-y-4">
                {results.coins.collected.items.slice(0, 10).map((coin, index) => (
                  <div key={index} className="bg-[#13151F] p-4 rounded-lg">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="text-white font-bold">{coin.name || 'Unnamed Coin'}</h3>
                        <p className="text-gray-400 text-sm">{coin.symbol}</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-gray-400 text-xs">Balance</p>
                        <p className="text-white font-mono">{coin.balance.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {results.coins.collected.items.length > 10 && (
                  <p className="text-gray-400 text-center text-sm italic">
                    Showing 10 of {results.coins.collected.items.length} collected coins
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
} 