// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getCoin } from '@zoralabs/coins-sdk';
import { base } from 'viem/chains';

// Helper function to generate dates for the past n days
function generatePastDates(days: number): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    dates.push(date);
  }
  
  return dates;
}

// Helper to format date as 'YYYY-MM-DD'
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Generate mock timeline data
function generateMockTimelineData(period: number, totalVolume: number = 5000, coinName: string = "Sample Coin", coinSymbol: string = "SMPL") {
  const dates = generatePastDates(period);
  
  // Generate synthetic data
  let timelineData = dates.map((date, index) => {
    // More trading activity in the beginning, tapering off
    const dayIndex = index;
    const decayFactor = Math.exp(-dayIndex / (period * 0.3));
    
    // Allocate volume based on decay and add some randomness
    let dailyVolume = (totalVolume / period) * decayFactor * (0.7 + 0.6 * Math.random());
    
    // Calculate daily earnings (5% creator fee)
    const dailyEarnings = dailyVolume * 0.05;
    
    return {
      date: formatDate(date),
      volume: dailyVolume,
      earnings: dailyEarnings
    };
  });
  
  // Calculate cumulative values
  let cumulativeVolume = 0;
  let cumulativeEarnings = 0;
  
  timelineData = timelineData.map(day => {
    cumulativeVolume += day.volume;
    cumulativeEarnings += day.earnings;
    
    return {
      ...day,
      cumulativeVolume,
      cumulativeEarnings
    };
  });
  
  return {
    period,
    totalVolume,
    totalEarnings: totalVolume * 0.05,
    name: coinName,
    symbol: coinSymbol,
    timeline: timelineData
  };
}

export async function GET(req: NextRequest) {
  const coinAddress = req.nextUrl.searchParams.get('coinAddress') || req.nextUrl.searchParams.get('address');
  const period = req.nextUrl.searchParams.get('period') || '30'; // default to 30 days
  const useMockData = req.nextUrl.searchParams.get('mock') === 'true';
  
  if (!coinAddress) {
    return NextResponse.json({ error: 'Missing coin address' }, { status: 400 });
  }

  const periodDays = parseInt(period);
  
  if (isNaN(periodDays) || periodDays <= 0 || periodDays > 365) {
    return NextResponse.json({ 
      error: 'Invalid period. Must be a number between 1 and 365' 
    }, { status: 400 });
  }

  // Always use mock data for development/demo purposes
  const forceMockData = useMockData || false;

  if (forceMockData) {
    console.log(`Using mock data for earnings timeline for coin ${coinAddress}`);
    const mockData = generateMockTimelineData(periodDays);
    return NextResponse.json({
      address: coinAddress,
      ...mockData
    }, { status: 200 });
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
      const mockData = generateMockTimelineData(periodDays);
      return NextResponse.json({
        address: coinAddress,
        ...mockData
      }, { status: 200 });
    }

    // Get total volume and creation date
    const totalVolume = parseFloat(coin.totalVolume || '0');
    const volume24h = parseFloat(coin.volume24h || '0');
    const createdAt = new Date(coin.createdAt || new Date());
    
    // Calculate days since creation
    const now = new Date();
    const msSinceCreation = now.getTime() - createdAt.getTime();
    const daysSinceCreation = Math.floor(msSinceCreation / (1000 * 60 * 60 * 24));
    
    // In case the coin is newer than the requested period
    const actualPeriod = Math.min(periodDays, daysSinceCreation + 1);
    
    // Generate the timeline data
    const timelineData = generateMockTimelineData(
      actualPeriod,
      totalVolume,
      coin.name,
      coin.symbol
    );

    // Format response
    const response = {
      address: coinAddress,
      ...timelineData,
      note: 'This timeline contains synthetic data generated for demonstration purposes.'
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    });
  } catch (error) {
    console.error('Error generating earnings timeline:', error);
    // Return mock data on error for demo purposes
    const mockData = generateMockTimelineData(periodDays);
    return NextResponse.json({
      address: coinAddress,
      ...mockData
    }, { status: 200 });
  }
}

export type TimelineDataPoint = {
  date: string;
  volume: number;
  earnings: number;
  cumulativeVolume: number;
  cumulativeEarnings: number;
};

export type EarningsTimelineResponse = {
  address: string;
  name: string;
  symbol: string;
  period: number;
  totalVolume: number;
  totalEarnings: number;
  timeline: TimelineDataPoint[];
  note: string;
} 