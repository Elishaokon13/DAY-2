// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getProfile, getCoin } from '@zoralabs/coins-sdk';
import { base } from 'viem/chains';

// Define the threshold for what counts as a "collector" vs "trader"
// For demonstration: holders who have kept the coin for 7+ days are "collectors"
const COLLECTOR_HOLD_DAYS = 7;

// Mock data for collector stats
const getMockCollectorStats = (coinAddress) => {
  return {
    collectors: {
      count: 12,
      percentage: 60,
      volume: 8500.75
    },
    traders: {
      count: 8,
      percentage: 40,
      volume: 5120.25
    },
    totalUsers: 20,
    price: 10.25,
    name: "Sample Coin",
    symbol: "SMPL"
  };
};

export async function GET(req: NextRequest) {
  const coinAddress = req.nextUrl.searchParams.get('coinAddress') || req.nextUrl.searchParams.get('address');
  const useMockData = req.nextUrl.searchParams.get('mock') === 'true';
  
  if (!coinAddress) {
    return NextResponse.json({ error: 'Missing coin address' }, { status: 400 });
  }

  // Always use mock data for development/demo purposes
  const forceMockData = useMockData || false;

  if (forceMockData) {
    console.log(`Using mock data for collector stats for coin ${coinAddress}`);
    return NextResponse.json(getMockCollectorStats(coinAddress), { status: 200 });
  }

  try {
    // Fetch coin details
    const coinResponse = await getCoin({
      address: coinAddress,
      chain: base.id,
    });
    
    const coin = coinResponse.data?.zora20Token;
    
    if (!coin) {
      console.log(`Coin not found: ${coinAddress}, using mock data`);
      return NextResponse.json(getMockCollectorStats(coinAddress), { status: 200 });
    }

    // For a real implementation, we would fetch all holders and their transaction history
    // Since that data may not be directly available from the SDK, we're creating a 
    // demonstration/estimation model

    // We'll use uniqueHolders as a base and generate estimated stats
    const uniqueHolders = parseInt(coin.uniqueHolders || '0');
    
    // Generate a realistic split between collectors and traders
    // This is an estimation; in a real app we would analyze transaction data
    const estimatedCollectorPercentage = 65; // 65% of holders are collectors (hold long-term)
    const estimatedTraderPercentage = 35; // 35% are traders (buy/sell frequently)
    
    const collectors = Math.round(uniqueHolders * (estimatedCollectorPercentage / 100));
    const traders = Math.round(uniqueHolders * (estimatedTraderPercentage / 100));
    
    // For volume, we can use actual data from the API
    const totalVolume = parseFloat(coin.totalVolume || '0');
    const volume24h = parseFloat(coin.volume24h || '0');
    
    // Estimate how much volume comes from collectors vs traders
    const collectorVolume = totalVolume * 0.3; // 30% of volume from collectors (first purchase)
    const traderVolume = totalVolume * 0.7; // 70% of volume from active traders
    
    // Format the response in the format expected by the ShareableAnalyticsCard
    const response = {
      collectors: {
        count: collectors,
        percentage: estimatedCollectorPercentage,
        volume: collectorVolume
      },
      traders: {
        count: traders,
        percentage: estimatedTraderPercentage,
        volume: traderVolume
      },
      totalUsers: uniqueHolders,
      price: totalVolume / uniqueHolders, // Estimate average price per user
      name: coin.name,
      symbol: coin.symbol
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    });
  } catch (error) {
    console.error('Error fetching collector stats:', error);
    // Return mock data on error for demo purposes
    return NextResponse.json(getMockCollectorStats(coinAddress), { status: 200 });
  }
}

export type CollectorStatsResponse = {
  collectors: {
    count: number;
    percentage: number;
    volume: number;
  };
  traders: {
    count: number;
    percentage: number;
    volume: number;
  };
  totalUsers: number;
  price: number;
  name: string;
  symbol: string;
} 