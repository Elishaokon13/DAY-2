'use client';

import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { EarningsTimelineResponse, TimelineDataPoint } from '@/app/api/earnings-timeline/route';
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
  Area
} from 'recharts';

interface TimelineChartProps {
  coinAddress: string;
  initialPeriod?: string; // '7', '30', '90', 'all'
}

export function TimelineChart({ 
  coinAddress, 
  initialPeriod = '30' 
}: TimelineChartProps) {
  const [timelineData, setTimelineData] = useState<EarningsTimelineResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>(initialPeriod);
  const [chartType, setChartType] = useState<'earnings' | 'cumulative'>('earnings');

  useEffect(() => {
    async function fetchTimelineData() {
      if (!coinAddress) return;

      setLoading(true);
      setError(null);
      
      try {
        console.log(`TimelineChart: Fetching timeline data for coin ${coinAddress}, period ${period}`);
        const response = await fetch(
          `/api/earnings-timeline?coinAddress=${encodeURIComponent(coinAddress)}&period=${period}`
        );
        
        if (!response.ok) {
          throw new Error(`Error fetching timeline data: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`TimelineChart: Data received:`, data);
        
        if (data.timeline && Array.isArray(data.timeline)) {
          setTimelineData(data);
        } else {
          throw new Error('Invalid timeline data format');
        }
      } catch (err) {
        console.error('Failed to fetch timeline data:', err);
        setError('Failed to load timeline data. Please try again.');
        
        // Create mock data if there's an error
        const mockData = createMockTimelineData(parseInt(period));
        setTimelineData(mockData);
      } finally {
        setLoading(false);
      }
    }
    
    fetchTimelineData();
  }, [coinAddress, period]);

  // Create mock timeline data for fallback
  const createMockTimelineData = (days: number) => {
    const data = [];
    const now = new Date();
    let cumulativeEarnings = 0;
    let cumulativeVolume = 0;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      
      // Random daily values with a realistic trend
      const dailyVolume = 100 + Math.random() * 300;
      const dailyEarnings = dailyVolume * 0.05;
      
      cumulativeVolume += dailyVolume;
      cumulativeEarnings += dailyEarnings;
      
      data.push({
        date: date.toISOString().split('T')[0],
        volume: dailyVolume,
        earnings: dailyEarnings,
        cumulativeVolume,
        cumulativeEarnings,
      });
    }
    
    return data;
  };

  // Helper function to format currency
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

  // Custom tooltip formatter
  const renderTooltip = (props: any) => {
    const { active, payload, label } = props;
    
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-black p-3 border border-gray-700 text-white font-mono text-sm">
          <p className="text-lime-400">{new Date(label).toLocaleDateString()}</p>
          {chartType === 'earnings' ? (
            <p>Earnings: {formatCurrency(data.earnings)}</p>
          ) : (
            <p>Total Earnings: {formatCurrency(data.cumulativeEarnings)}</p>
          )}
          <p className="text-xs text-gray-400">Volume: {formatCurrency(chartType === 'earnings' ? data.volume : data.cumulativeVolume)}</p>
        </div>
      );
    }
    
    return null;
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  if (loading) {
    return (
      <div className="p-6 bg-[#1a1e2e] rounded-lg border border-gray-700 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="flex justify-between mb-4">
          <div className="h-8 bg-gray-700 rounded w-32"></div>
          <div className="h-8 bg-gray-700 rounded w-32"></div>
        </div>
        <div className="h-64 bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (error || !timelineData) {
    return (
      <div className="p-6 bg-[#1a1e2e] rounded-lg border border-red-700 text-red-500">
        <p>{error || 'No timeline data available'}</p>
      </div>
    );
  }

  return (
    <Card className="p-6 bg-[#1a1e2e] border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lime-500 text-xl font-mono">EARNINGS OVER TIME</h2>
        
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
        <p className="text-white font-mono text-lg">
          {chartType === 'earnings' ? 'Daily Earnings' : 'Cumulative Earnings'}
        </p>
      </div>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'earnings' ? (
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
          ) : (
            <LineChart data={timelineData.timeline}>
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
              <Line 
                type="monotone" 
                dataKey="cumulativeEarnings" 
                stroke="#8FE388" 
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      
      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="border-b border-gray-700 pb-2">
          <p className="text-gray-400 font-mono text-sm">TOTAL EARNINGS</p>
          <p className="text-lime-400 text-lg font-mono">
            {formatCurrency(timelineData.totalEarnings)}
          </p>
        </div>
        
        <div className="border-b border-gray-700 pb-2">
          <p className="text-gray-400 font-mono text-sm">TOTAL VOLUME</p>
          <p className="text-white text-lg font-mono">
            {formatCurrency(timelineData.totalVolume)}
          </p>
        </div>
      </div>
      
      <div className="mt-4 text-gray-500 text-xs italic">
        <p>* Chart data is based on estimated trading patterns and creator earnings</p>
      </div>
    </Card>
  );
} 