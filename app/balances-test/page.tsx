'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function BalancesTestPage() {
  const [identifier, setIdentifier] = useState<string>('');
  const [results, setResults] = useState<any>(null);
  const [earningsData, setEarningsData] = useState<any>(null);
  const [rewardsData, setRewardsData] = useState<any>(null);
  const [timelineData, setTimelineData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchAll, setFetchAll] = useState<boolean>(false);
  const [period, setPeriod] = useState<string>('30');
  
  const fetchBalances = async () => {
    if (!identifier) return;

    setLoading(true);
    setError(null);
    
    try {
      // Fetch profile balances
      const response = await fetch(`/api/profile-balances?identifier=${encodeURIComponent(identifier)}&fetchAll=${fetchAll}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Profile balances response:', data);
      setResults(data);
      
      // Fetch creator earnings if we have a handle
      if (data.profile.handle) {
        fetchCreatorEarnings(data.profile.handle);
      }
      
      // Fetch creator rewards if we have a wallet address
      if (data.profile.publicWallet) {
        fetchCreatorRewards(data.profile.publicWallet);
      }
    } catch (err) {
      console.error('Failed to fetch balances:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCreatorEarnings = async (handle: string) => {
    try {
      const response = await fetch(`/api/creator-earnings?handle=${encodeURIComponent(handle)}`);
      
      if (!response.ok) {
        console.error(`Error fetching creator earnings: ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
      console.log('Creator earnings response:', data);
      setEarningsData(data);
      
      // Fetch earnings timeline for the first coin if available
      if (data.createdCoins && data.createdCoins.length > 0) {
        fetchEarningsTimeline(data.createdCoins[0].address);
      }
    } catch (err) {
      console.error('Failed to fetch creator earnings:', err);
    }
  };
  
  const fetchCreatorRewards = async (walletAddress: string) => {
    try {
      const response = await fetch(`/api/creator-rewards?address=${encodeURIComponent(walletAddress)}`);
      
      if (!response.ok) {
        console.error(`Error fetching creator rewards: ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
      console.log('Creator rewards response:', data);
      setRewardsData(data);
    } catch (err) {
      console.error('Failed to fetch creator rewards:', err);
    }
  };
  
  const fetchEarningsTimeline = async (coinAddress: string) => {
    try {
      const response = await fetch(`/api/earnings-timeline?coinAddress=${encodeURIComponent(coinAddress)}&period=${period}`);
      
      if (!response.ok) {
        console.error(`Error fetching earnings timeline: ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
      console.log('Earnings timeline response:', data);
      setTimelineData(data);
    } catch (err) {
      console.error('Failed to fetch earnings timeline:', err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBalances();
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    if (earningsData?.createdCoins?.length > 0) {
      fetchEarningsTimeline(earningsData.createdCoins[0].address);
    }
  };

  // Format currency for display
  const formatBalance = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 6
    }).format(value);
  };
  
  // Format currency with $ sign
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // Helper to format dates on X-axis
  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };
  
  // Custom tooltip formatter for charts
  const renderTooltip = (props: any) => {
    const { active, payload, label } = props;
    
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-black p-3 border border-gray-700 text-white font-mono text-sm">
          <p className="text-lime-400">{new Date(label).toLocaleDateString()}</p>
          <p>Earnings: {formatCurrency(data.earnings)}</p>
          <p className="text-xs text-gray-400">Volume: {formatCurrency(data.volume)}</p>
        </div>
      );
    }
    
    return null;
  };
  
  // Generate mock data for collector vs trader distribution
  const generateCollectorTraderData = () => {
    // In a real implementation, this would come from transaction analysis
    return [
      { name: 'Collectors', value: 70 },
      { name: 'Traders', value: 30 }
    ];
  };
  
  const COLORS = ['#4CAF50', '#FF9800'];

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4 text-lime-500 font-mono">ZORA Profile Balances Test</h1>
      
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
              {loading ? 'Fetching...' : 'Fetch Balances'}
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
              Fetch all pages (may take longer)
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
          
          {/* Creator Earnings Summary */}
          {earningsData && (
            <Card className="p-6 bg-[#1a1e2e] border border-gray-700">
              <h2 className="text-xl font-mono text-lime-500 mb-6">Creator Earnings Summary</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#13151F] p-3 rounded-lg">
                  <p className="text-gray-400 text-xs mb-1 font-mono">TOTAL EARNINGS</p>
                  <p className="text-lime-400 text-xl font-bold">
                    {formatCurrency(earningsData.metrics.totalEarnings)}
                  </p>
                </div>
                
                <div className="bg-[#13151F] p-3 rounded-lg">
                  <p className="text-gray-400 text-xs mb-1 font-mono">TOTAL VOLUME</p>
                  <p className="text-white text-xl font-bold">
                    {formatCurrency(earningsData.metrics.totalVolume)}
                  </p>
                </div>
                
                <div className="bg-[#13151F] p-3 rounded-lg">
                  <p className="text-gray-400 text-xs mb-1 font-mono">POSTS</p>
                  <p className="text-white text-xl font-bold">
                    {earningsData.metrics.posts}
                  </p>
                </div>
                
                <div className="bg-[#13151F] p-3 rounded-lg">
                  <p className="text-gray-400 text-xs mb-1 font-mono">AVG EARNINGS/POST</p>
                  <p className="text-white text-xl font-bold">
                    {formatCurrency(earningsData.metrics.averageEarningsPerPost)}
                  </p>
                </div>
              </div>
            </Card>
          )}
          
          {/* Creator Rewards */}
          {rewardsData && (
            <Card className="p-6 bg-[#1a1e2e] border border-gray-700">
              <h2 className="text-xl font-mono text-lime-500 mb-6">Creator Rewards</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#13151F] p-3 rounded-lg">
                  <p className="text-gray-400 text-xs mb-1 font-mono">TOTAL REWARDS</p>
                  <p className="text-lime-400 text-xl font-bold">
                    {formatCurrency(rewardsData.earnings.total)}
                  </p>
                </div>
                
                <div className="bg-[#13151F] p-3 rounded-lg">
                  <p className="text-gray-400 text-xs mb-1 font-mono">PROTOCOL REWARDS</p>
                  <p className="text-white text-xl font-bold">
                    {formatCurrency(rewardsData.earnings.protocolRewards.total)}
                  </p>
                </div>
                
                <div className="bg-[#13151F] p-3 rounded-lg">
                  <p className="text-gray-400 text-xs mb-1 font-mono">ETH ROYALTIES</p>
                  <p className="text-white text-xl font-bold">
                    {formatCurrency(rewardsData.earnings.secondaryRoyalties.eth.total)}
                  </p>
                </div>
              </div>
            </Card>
          )}
          
          {/* Earnings Timeline Chart */}
          {timelineData && (
            <Card className="p-6 bg-[#1a1e2e] border border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-mono text-lime-500">EARNINGS OVER TIME</h2>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePeriodChange('7')}
                    className={`px-3 py-1 rounded text-xs font-mono ${
                      period === '7'
                        ? 'bg-lime-700 text-white'
                        : 'bg-[#13151F] text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    7D
                  </button>
                  <button
                    onClick={() => handlePeriodChange('30')}
                    className={`px-3 py-1 rounded text-xs font-mono ${
                      period === '30'
                        ? 'bg-lime-700 text-white'
                        : 'bg-[#13151F] text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    30D
                  </button>
                  <button
                    onClick={() => handlePeriodChange('90')}
                    className={`px-3 py-1 rounded text-xs font-mono ${
                      period === '90'
                        ? 'bg-lime-700 text-white'
                        : 'bg-[#13151F] text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    90D
                  </button>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-400 font-mono text-sm mb-1">{timelineData.name} ({timelineData.symbol})</p>
                <p className="text-white font-mono text-lg">Daily Earnings</p>
              </div>
              
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData.timeline}>
                    <defs>
                      <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#32CD32" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#32CD32" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatXAxis} 
                      tick={{ fill: '#999' }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${value}`}
                      tick={{ fill: '#999' }}
                    />
                    <Tooltip content={renderTooltip} />
                    <Area 
                      type="monotone" 
                      dataKey="earnings" 
                      stroke="#32CD32" 
                      fillOpacity={1}
                      fill="url(#earningsGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
          
          {/* Collector vs Trader Analysis */}
          {earningsData && earningsData.createdCoins?.length > 0 && (
            <Card className="p-6 bg-[#1a1e2e] border border-gray-700">
              <h2 className="text-xl font-mono text-lime-500 mb-6">Audience Analysis</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-white font-mono mb-3">Collector vs Trader Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={generateCollectorTraderData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {generateCollectorTraderData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-white font-mono mb-3">Unique Holders by Post</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={earningsData.createdCoins.map(coin => ({
                          name: coin.name.length > 15 ? coin.name.substring(0, 15) + '...' : coin.name,
                          holders: parseInt(coin.uniqueHolders) || 0
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="name" tick={{ fill: '#999' }} />
                        <YAxis tick={{ fill: '#999' }} />
                        <Tooltip />
                        <Bar dataKey="holders" fill="#4CAF50" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </Card>
          )}
          
          {/* Balances Summary */}
          <Card className="p-6 bg-[#1a1e2e] border border-gray-700">
            <h2 className="text-xl font-mono text-lime-500 mb-6">Balances Summary</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#13151F] p-3 rounded-lg">
                <p className="text-gray-400 text-xs mb-1 font-mono">TOTAL COINS</p>
                <p className="text-lime-400 text-xl font-bold">
                  {results.balances.total}
                </p>
              </div>
              
              <div className="bg-[#13151F] p-3 rounded-lg">
                <p className="text-gray-400 text-xs mb-1 font-mono">CREATED</p>
                <p className="text-white text-xl font-bold">
                  {results.balances.created.count}
                </p>
              </div>
              
              <div className="bg-[#13151F] p-3 rounded-lg">
                <p className="text-gray-400 text-xs mb-1 font-mono">COLLECTED</p>
                <p className="text-white text-xl font-bold">
                  {results.balances.collected.count}
                </p>
              </div>
            </div>
          </Card>
          
          {/* Created Coins */}
          {results.balances.created.count > 0 && (
            <Card className="p-6 bg-[#1a1e2e] border border-gray-700">
              <h2 className="text-xl font-mono text-lime-500 mb-4">Created Coins</h2>
              <div className="space-y-4">
                {results.balances.created.coins.map((balance, index) => (
                  <div key={index} className="bg-[#13151F] p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      {balance.coin.image ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden relative flex-shrink-0">
                          <Image
                            src={balance.coin.image}
                            alt={balance.coin.name || balance.coin.symbol}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-lime-900/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-lime-500 text-sm font-bold">
                            {balance.coin.symbol || 'Z'}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="text-lime-500 font-bold">{balance.coin.name || 'Unnamed Coin'}</h3>
                        <p className="text-gray-400 text-sm">{balance.coin.symbol}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div>
                        <p className="text-gray-400 text-xs">Balance</p>
                        <p className="text-white font-mono">{formatBalance(balance.formattedBalance)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Unique Holders</p>
                        <p className="text-white">{balance.coin.uniqueHolders || '—'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
          
          {/* Collected Coins */}
          {results.balances.collected.count > 0 && (
            <Card className="p-6 bg-[#1a1e2e] border border-gray-700">
              <h2 className="text-xl font-mono text-lime-500 mb-4">Collected Coins</h2>
              <div className="space-y-4">
                {results.balances.collected.coins.slice(0, 10).map((balance, index) => (
                  <div key={index} className="bg-[#13151F] p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      {balance.coin.image ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden relative flex-shrink-0">
                          <Image
                            src={balance.coin.image}
                            alt={balance.coin.name || balance.coin.symbol}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-lime-900/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-lime-500 text-sm font-bold">
                            {balance.coin.symbol || 'Z'}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="text-white font-bold">{balance.coin.name || 'Unnamed Coin'}</h3>
                        <p className="text-gray-400 text-sm">{balance.coin.symbol}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div>
                        <p className="text-gray-400 text-xs">Balance</p>
                        <p className="text-white font-mono">{formatBalance(balance.formattedBalance)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Unique Holders</p>
                        <p className="text-white">{balance.coin.uniqueHolders || '—'}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {results.balances.collected.coins.length > 10 && (
                  <p className="text-gray-400 text-center text-sm italic">
                    Showing 10 of {results.balances.collected.coins.length} collected coins
                  </p>
                )}
              </div>
            </Card>
          )}
          
          {/* Pagination Info */}
          {results.pagination.nextCursor && (
            <Card className="p-4 bg-[#1a1e2e] border border-gray-700">
              <p className="text-gray-400 text-sm">
                More results available. Next cursor: <span className="text-lime-500 font-mono text-xs">{results.pagination.nextCursor}</span>
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
} 