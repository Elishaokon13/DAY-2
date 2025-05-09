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

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address');
  const period = req.nextUrl.searchParams.get('period') || '30'; // default to 30 days
  
  if (!address) {
    return NextResponse.json({ error: 'Missing coin address' }, { status: 400 });
  }

  const periodDays = parseInt(period);
  
  if (isNaN(periodDays) || periodDays <= 0 || periodDays > 365) {
    return NextResponse.json({ 
      error: 'Invalid period. Must be a number between 1 and 365' 
    }, { status: 400 });
  }

  try {
    // Fetch coin details
    const coinResponse = await getCoin({
      address,
      chain: base.id,
    });
    
    const coin = coinResponse.data?.zora20Token;
    
    if (!coin) {
      return NextResponse.json({ error: 'Coin not found' }, { status: 404 });
    }

    // Get total volume and creation date
    const totalVolume = parseFloat(coin.totalVolume || '0');
    const volume24h = parseFloat(coin.volume24h || '0');
    const createdAt = new Date(coin.createdAt || new Date());
    
    // Create a synthetic dataset based on the total volume
    // In a real implementation, we would fetch historical transaction data
    // This is a demonstration implementation
    
    // Generate dates for the timeline
    const dates = generatePastDates(periodDays);
    
    // Calculate daily volumes and earnings
    // Using a basic model where trading is more active in the beginning
    // and creator earns 5% of volume
    
    // Calculate days since creation
    const now = new Date();
    const msSinceCreation = now.getTime() - createdAt.getTime();
    const daysSinceCreation = Math.floor(msSinceCreation / (1000 * 60 * 60 * 24));
    
    // In case the coin is newer than the requested period
    const actualPeriod = Math.min(periodDays, daysSinceCreation + 1);
    
    // Generate synthetic data
    const timelineData = dates.slice(-actualPeriod).map((date, index) => {
      // More trading activity in the beginning, tapering off
      const dayIndex = index;
      const decayFactor = Math.exp(-dayIndex / (actualPeriod * 0.3));
      
      // Allocate volume based on decay and add some randomness
      let dailyVolume = (totalVolume / actualPeriod) * decayFactor * (0.7 + 0.6 * Math.random());
      
      // Adjust the last day to match 24h volume if we're looking at 30 days or less
      if (index === actualPeriod - 1 && periodDays <= 30) {
        dailyVolume = volume24h;
      }
      
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
    
    const timelineWithCumulative = timelineData.map(day => {
      cumulativeVolume += day.volume;
      cumulativeEarnings += day.earnings;
      
      return {
        ...day,
        cumulativeVolume,
        cumulativeEarnings
      };
    });

    // Format response
    const response = {
      address,
      name: coin.name,
      symbol: coin.symbol,
      period: actualPeriod,
      totalVolume,
      totalEarnings: totalVolume * 0.05,
      timeline: timelineWithCumulative,
      note: 'This timeline contains synthetic data generated for demonstration purposes. For a production app, historical transaction data should be used.'
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    });
  } catch (error) {
    console.error('Error generating earnings timeline:', error);
    return NextResponse.json({
      error: 'Failed to generate earnings timeline'
    }, { status: 500 });
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