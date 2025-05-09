// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getProfile, getProfileBalances, getCoin } from '@zoralabs/coins-sdk';
import { base } from 'viem/chains';

// Define a type for the Zora token to make TypeScript happy
interface Zora20Token {
  address: string;
  name: string;
  symbol: string;
  totalVolume: string;
  volume24h: string;
  uniqueHolders: string;
  creatorAddress?: string;
  createdAt?: string;
  [key: string]: any;
}

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get('handle');
  const timeframe = req.nextUrl.searchParams.get('timeframe') || 'all'; // all, week, month

  if (!handle) {
    return NextResponse.json({ error: 'Missing Zora handle' }, { status: 400 });
  }

  // Clean up the handle input (remove @ if present)
  const cleanHandle = handle.trim().replace(/^@/, '');

  try {
    console.log(`Fetching profile for ${cleanHandle}...`);
    // Get profile and balances data
    const [profileRes, balancesRes] = await Promise.all([
      getProfile({ identifier: cleanHandle }),
      getProfileBalances({ identifier: cleanHandle }),
    ]);

    console.log("Profile response:", JSON.stringify(profileRes.data, null, 2));
    console.log("Balances response:", JSON.stringify(balancesRes.data, null, 2));

    // Extract profile information
    const profileData = profileRes?.data;
    
    if (!profileData?.profile) {
      console.log('Zora profile not found');
      return NextResponse.json({ error: 'Zora profile not found' }, { status: 404 });
    }
    
    const displayName =
      profileData?.profile?.displayName ||
      profileData?.profile?.handle ||
      cleanHandle;

    // Extract coin balances
    const balanceEdges = balancesRes?.data?.profile?.coinBalances?.edges || [];
    console.log("Balance edges:", JSON.stringify(balanceEdges, null, 2));
    
    const coinBalances = balanceEdges.map(edge => edge.node);
    console.log("Coin balances:", JSON.stringify(coinBalances, null, 2));
    
    // The user's address from their profile's wallet
    // Using publicWallet.walletAddress
    const userAddress = profileData?.profile?.publicWallet?.walletAddress;
    
    if (!userAddress) {
      return NextResponse.json({ 
        error: 'Could not determine creator address' 
      }, { status: 400 });
    }

    // Fetch detailed data for each coin to identify created ones and get earnings data
    const coinDetailsPromises = coinBalances.map(async ({ coin }) => {
      if (!coin?.address) return null;
      
      try {
        const coinDetails = await getCoin({
          address: coin.address,
          chain: base.id,
        });
        
        return coinDetails.data?.zora20Token;
      } catch (error) {
        console.error(`Error fetching coin details for ${coin.address}:`, error);
        return null;
      }
    });

    const coinDetailsResults = await Promise.all(coinDetailsPromises);
    // Remove nulls and undefineds first
    const validCoins = coinDetailsResults.filter(Boolean);
    // Then filter by creator address
    const creatorCoins = validCoins.filter(coin => 
      coin.creatorAddress?.toLowerCase() === userAddress.toLowerCase()
    );

    // Calculate total earnings and other metrics
    let totalEarnings = 0;
    let totalVolume = 0;
    let posts = creatorCoins.length;

    creatorCoins.forEach(coin => {
      // For total volume, use the totalVolume field
      totalVolume += parseFloat(coin.totalVolume || '0');
      
      // For earnings, we have to estimate based on creator fees (typically 5-10%)
      // This is an approximation - real earnings would require fetching all transactions
      const estimatedEarnings = parseFloat(coin.totalVolume || '0') * 0.05; // Assuming 5% creator fees
      totalEarnings += estimatedEarnings;
    });

    // Calculate averages
    const avgEarningsPerPost = posts > 0 ? totalEarnings / posts : 0;

    // Format time-based metrics based on the timeframe parameter
    // In a full implementation, we would filter transactions by date
    // For now, we'll return all data regardless of timeframe
    
    // Create a structured response
    const earningsData = {
      profileHandle: profileData?.profile?.handle,
      displayName,
      profileImage: profileData?.profile?.avatar?.medium || null,
      metrics: {
        totalEarnings,
        totalVolume,
        posts,
        avgEarningsPerPost,
      },
      createdCoins: creatorCoins.map(coin => ({
        address: coin.address,
        name: coin.name,
        symbol: coin.symbol,
        totalVolume: coin.totalVolume,
        volume24h: coin.volume24h,
        uniqueHolders: coin.uniqueHolders,
        estimatedEarnings: parseFloat(coin.totalVolume || '0') * 0.05,
      })),
    };

    return NextResponse.json(earningsData, { 
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      } 
    });
  } catch (error) {
    console.error('Error fetching creator earnings:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch creator earnings data',
    }, { status: 500 });
  }
}

export type CreatorEarningsResponse = {
  profileHandle: string | null;
  displayName: string;
  profileImage: string | null;
  metrics: {
    totalEarnings: number;
    totalVolume: number;
    posts: number;
    avgEarningsPerPost: number;
  };
  createdCoins: Array<{
    address: string;
    name: string;
    symbol: string;
    totalVolume: string;
    volume24h: string;
    uniqueHolders: string;
    estimatedEarnings: number;
  }>;
} 