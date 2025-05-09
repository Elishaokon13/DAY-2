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

// Mock creator coins data - used when the API fails to return data
const getCreatorMockCoins = () => {
  return [
    {
      address: "0x31bb5f5a4644d2ad26f7bcbff042a1834f222819",
      name: "Hapa Sushi",
      symbol: "Hapa Sushi",
      totalVolume: "7171.82037",
      volume24h: "0.0",
      uniqueHolders: "14",
      estimatedEarnings: 358.591,
      creatorAddress: "0xd91d9de054e294d9bebb7149955457300a9305cc"
    },
    {
      address: "0x9b41d403d679e7d8703b923a9a66a3f463d36711",
      name: "Talking to my therapist",
      symbol: "Talking to my therapist",
      totalVolume: "3362.175479",
      volume24h: "0.0",
      uniqueHolders: "16",
      estimatedEarnings: 168.109,
      creatorAddress: "0xd91d9de054e294d9bebb7149955457300a9305cc"
    },
    {
      address: "0xedbd267cfbc63561bef77b6776b49065f50faa08",
      name: "Sunrises in Denver are different",
      symbol: "Sunrises in Denver are different",
      totalVolume: "3112.940877",
      volume24h: "0.0",
      uniqueHolders: "17",
      estimatedEarnings: 155.647,
      creatorAddress: "0xd91d9de054e294d9bebb7149955457300a9305cc"
    }
  ];
};

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get('handle');
  const timeframe = req.nextUrl.searchParams.get('timeframe') || 'all'; // all, week, month
  const useMockData = req.nextUrl.searchParams.get('mock') === 'true';
  const forceTruthData = req.nextUrl.searchParams.get('mock') === 'false';

  if (!handle) {
    return NextResponse.json({ error: 'Missing Zora handle' }, { status: 400 });
  }

  // Clean up the handle input (remove @ if present)
  const cleanHandle = handle.trim().replace(/^@/, '');

  // Determine whether to use mock data
  // - If mock=false is specified, never use mock data (return empty results instead)
  // - If mock=true is specified, always use mock data
  // - Otherwise, use mock data as fallback when real data is unavailable
  const shouldUseMockData = useMockData || (!forceTruthData);

  try {
    console.log(`Fetching profile for ${cleanHandle}...`);
    
    // Get profile data
    const profileRes = await getProfile({ identifier: cleanHandle });
    
    // Extract profile information
    const profileData = profileRes?.data;
    
    if (!profileData?.profile) {
      console.log('Zora profile not found');
      
      if (forceTruthData) {
        return NextResponse.json({ 
          error: 'Profile not found',
          _isMockData: false
        }, { status: 404 });
      }
      
      // Return mock data instead of error for demo purposes
      if (shouldUseMockData) {
        console.log('Using mock data since profile not found');
        const mockCoins = getCreatorMockCoins();
        const totalEarnings = mockCoins.reduce((sum, coin) => sum + (coin.estimatedEarnings || 0), 0);
        const totalVolume = mockCoins.reduce((sum, coin) => sum + parseFloat(coin.totalVolume || '0'), 0);
        const postsCount = mockCoins.length;
        const averageEarningsPerPost = postsCount > 0 ? totalEarnings / postsCount : 0;
        
        return NextResponse.json({
          profileHandle: cleanHandle,
          displayName: cleanHandle,
          profileImage: null,
          bio: "Creator on Zora 🎨",
          _isMockData: true,
          metrics: {
            totalEarnings,
            totalVolume,
            posts: postsCount,
            averageEarningsPerPost,
          },
          createdCoins: mockCoins.map(coin => ({
            address: coin.address,
            name: coin.name,
            symbol: coin.symbol,
            totalVolume: coin.totalVolume,
            volume24h: coin.volume24h,
            uniqueHolders: coin.uniqueHolders,
            estimatedEarnings: parseFloat(coin.totalVolume || '0') * 0.05,
          })),
        }, { status: 200 });
      } else {
        return NextResponse.json({ 
          error: 'Profile not found',
          _isMockData: false 
        }, { status: 404 });
      }
    }
    
    const displayName =
      profileData?.profile?.displayName ||
      profileData?.profile?.handle ||
      cleanHandle;
    
    // The user's address from their profile's wallet
    const userAddress = profileData?.profile?.publicWallet?.walletAddress;
    
    if (!userAddress) {
      console.log('Could not determine creator address');
      
      if (forceTruthData) {
        return NextResponse.json({ 
          profileHandle: profileData?.profile?.handle,
          displayName,
          profileImage: profileData?.profile?.avatar?.medium || null,
          bio: profileData?.profile?.bio || null,
          _isMockData: false,
          metrics: {
            totalEarnings: 0,
            totalVolume: 0,
            posts: 0,
            averageEarningsPerPost: 0,
          },
          createdCoins: []
        }, { status: 200 });
      }
      
      if (shouldUseMockData) {
        console.log('Using mock data since wallet address not found');
        // Return mock data instead of error
        const mockCoins = getCreatorMockCoins();
        const totalEarnings = mockCoins.reduce((sum, coin) => sum + (coin.estimatedEarnings || 0), 0);
        const totalVolume = mockCoins.reduce((sum, coin) => sum + parseFloat(coin.totalVolume || '0'), 0);
        const postsCount = mockCoins.length;
        const averageEarningsPerPost = postsCount > 0 ? totalEarnings / postsCount : 0;
        
        return NextResponse.json({
          profileHandle: profileData?.profile?.handle,
          displayName,
          profileImage: profileData?.profile?.avatar?.medium || null,
          bio: profileData?.profile?.bio || "Creator on Zora 🎨",
          _isMockData: true,
          metrics: {
            totalEarnings,
            totalVolume,
            posts: postsCount,
            averageEarningsPerPost,
          },
          createdCoins: mockCoins,
        }, { status: 200 });
      } else {
        return NextResponse.json({ 
          profileHandle: profileData?.profile?.handle,
          displayName,
          profileImage: profileData?.profile?.avatar?.medium || null,
          bio: profileData?.profile?.bio || null,
          _isMockData: false,
          metrics: {
            totalEarnings: 0,
            totalVolume: 0,
            posts: 0,
            averageEarningsPerPost: 0,
          },
          createdCoins: []
        }, { status: 200 });
      }
    }

    // Handle mock data or API issues with a fallback approach
    let creatorCoins = [];
    let usedMockData = false;

    if (useMockData) {
      // Use mock data if requested
      console.log("Using mock data as requested");
      creatorCoins = getCreatorMockCoins();
      usedMockData = true;
    } else {
      try {
        // Try to get balance data from API
        const balancesRes = await getProfileBalances({ identifier: cleanHandle });
        
        if (balancesRes?.data?.profile?.coinBalances?.edges) {
          // Extract coin balances
          const balanceEdges = balancesRes.data.profile.coinBalances.edges || [];
          const coinBalances = balanceEdges.map(edge => edge.node);
          
          // Fetch detailed data for each coin to identify created ones
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
          creatorCoins = validCoins.filter(coin => 
            coin.creatorAddress?.toLowerCase() === userAddress.toLowerCase()
          );
          
          console.log(`Found ${creatorCoins.length} creator coins for ${cleanHandle}`);
          
          // Use mock data if no creator coins were found and mock data is not explicitly disabled
          if (creatorCoins.length === 0) {
            if (forceTruthData) {
              console.log(`No creator coins found for ${cleanHandle}, returning empty array`);
            } else if (shouldUseMockData) {
              console.log(`No creator coins found for ${cleanHandle}, using mock data`);
              creatorCoins = getCreatorMockCoins();
              usedMockData = true;
            }
          }
        } else {
          // API response doesn't have the expected structure
          if (forceTruthData) {
            console.log("API response doesn't contain coin balances, returning empty array");
          } else if (shouldUseMockData) {
            console.log("API response doesn't contain coin balances, using mock data");
            creatorCoins = getCreatorMockCoins();
            usedMockData = true;
          }
        }
      } catch (error) {
        // API call failed
        console.error("Error fetching balances:", error);
        if (forceTruthData) {
          console.log("API error, returning empty array as mock data is disabled");
        } else if (shouldUseMockData) {
          console.log("Using mock data due to API error");
          creatorCoins = getCreatorMockCoins();
          usedMockData = true;
        }
      }
    }

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
    const averageEarningsPerPost = posts > 0 ? totalEarnings / posts : 0;
    
    // Create a structured response
    const earningsData = {
      profileHandle: profileData?.profile?.handle,
      displayName,
      profileImage: profileData?.profile?.avatar?.medium || null,
      bio: profileData?.profile?.bio || "Creator on Zora",
      _isMockData: usedMockData,
      metrics: {
        totalEarnings,
        totalVolume,
        posts,
        averageEarningsPerPost,
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
    
    if (forceTruthData) {
      return NextResponse.json({ 
        error: 'Failed to fetch creator earnings',
        details: error instanceof Error ? error.message : String(error),
        _isMockData: false
      }, { status: 500 });
    }
    
    // Return mock data on error for demo purposes
    if (shouldUseMockData) {
      console.log('Using mock data due to error');
      const mockCoins = getCreatorMockCoins();
      const totalEarnings = mockCoins.reduce((sum, coin) => sum + (coin.estimatedEarnings || 0), 0);
      const totalVolume = mockCoins.reduce((sum, coin) => sum + parseFloat(coin.totalVolume || '0'), 0);
      const postsCount = mockCoins.length;
      const averageEarningsPerPost = postsCount > 0 ? totalEarnings / postsCount : 0;
      
      return NextResponse.json({
        profileHandle: cleanHandle,
        displayName: cleanHandle,
        profileImage: null,
        bio: "Creator on Zora 🎨",
        _isMockData: true,
        metrics: {
          totalEarnings,
          totalVolume,
          posts: postsCount,
          averageEarningsPerPost,
        },
        createdCoins: mockCoins.map(coin => ({
          address: coin.address,
          name: coin.name,
          symbol: coin.symbol,
          totalVolume: coin.totalVolume,
          volume24h: coin.volume24h,
          uniqueHolders: coin.uniqueHolders,
          estimatedEarnings: parseFloat(coin.totalVolume || '0') * 0.05,
        })),
      }, { status: 200 });
    } else {
      return NextResponse.json({ 
        error: 'Failed to fetch creator earnings',
        details: error instanceof Error ? error.message : String(error),
        _isMockData: false
      }, { status: 500 });
    }
  }
}

export type CreatorEarningsResponse = {
  profileHandle: string | null;
  displayName: string;
  profileImage: string | null;
  bio: string | null;
  _isMockData?: boolean;
  metrics: {
    totalEarnings: number;
    totalVolume: number;
    posts: number;
    averageEarningsPerPost: number;
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