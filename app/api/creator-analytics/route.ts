import { NextRequest, NextResponse } from 'next/server';
import { getProfile, getProfileBalances, getCoin } from '@zoralabs/coins-sdk';
import { base } from 'viem/chains';

// Helper function to serialize BigInt values to strings
function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeBigInt(value);
    }
    return result;
  }
  
  return obj;
}

export async function GET(req: NextRequest) {
  const identifier = req.nextUrl.searchParams.get('identifier');
  const fetchAll = req.nextUrl.searchParams.get('fetchAll') === 'true';
  const additionalWallets = req.nextUrl.searchParams.get('wallets');
  
  if (!identifier) {
    return NextResponse.json({ error: 'Missing identifier parameter (wallet address or handle)' }, { status: 400 });
  }

  try {
    // Step 1: Get profile information
    console.log(`Getting profile for ${identifier}...`);
    const profileRes = await getProfile({ identifier });
    
    if (!profileRes?.data?.profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    const profile = profileRes.data.profile;
    
    // Debug the entire profile structure to find the Zora-generated wallet
    console.log('Complete profile structure:', JSON.stringify(profile, null, 2));
    
    // Prepare profile data response
    const profileData = {
      handle: profile.handle,
      displayName: profile.displayName,
      bio: profile.bio,
      avatar: profile.avatar?.medium || null,
      publicWallet: profile.publicWallet?.walletAddress || null
    };
    
    console.log(`Found profile: ${profileData.displayName || profileData.handle}`);
    console.log(`User wallet address: ${profileData.publicWallet}`);
    
    if (!profileData.publicWallet) {
      return NextResponse.json({ 
        error: 'No wallet address found for this profile',
        profile: profileData
      }, { status: 404 });
    }
    
    // Step 2: Get all coin balances for the user
    console.log(`Fetching balances for ${identifier}...`);
    let allBalances: any[] = [];
    let cursor = undefined;
    
    // Extract the public wallet address
    const publicWallet = profile.publicWallet?.walletAddress?.toLowerCase();
    
    // Create a list of the user's wallet addresses to check against
    let userWallets = [
      publicWallet,
      // Add the Zora-generated wallet if the user is defidevrelalt
      identifier === 'defidevrelalt' ? '0xafc833331e494d72bc6568a011f614702ca3c892'.toLowerCase() : null
    ].filter(Boolean) as string[];
    
    // Add any user-provided additional wallets
    if (additionalWallets) {
      try {
        const parsedWallets = JSON.parse(additionalWallets);
        if (Array.isArray(parsedWallets)) {
          const validWallets = parsedWallets
            .filter(wallet => typeof wallet === 'string' && wallet.startsWith('0x'))
            .map(wallet => wallet.toLowerCase());
          
          userWallets = [...userWallets, ...validWallets];
        }
      } catch (e) {
        // If parsing fails, try to process as a comma-separated string
        const walletArray = additionalWallets.split(',')
          .map(wallet => wallet.trim())
          .filter(wallet => wallet.startsWith('0x'))
          .map(wallet => wallet.toLowerCase());
        
        userWallets = [...userWallets, ...walletArray];
      }
    }
    
    // Remove duplicates
    userWallets = Array.from(new Set(userWallets));
    
    console.log(`User's wallets to check:`, userWallets);
    
    do {
      const balancesRes = await getProfileBalances({
        identifier,
        count: 50,
        after: cursor
      });
      
      const edges = balancesRes.data?.profile?.coinBalances?.edges || [];
      
      if (edges.length === 0) {
        break;
      }
      
      // Process each balance
      const pageBalances = edges.map(edge => {
        const nodeData = edge.node;
        // Use case-insensitive comparison for creator address
        const creatorAddress = nodeData.coin?.creatorAddress?.toLowerCase();
        
        // Check if creator address matches any of the user's wallets
        const isCreator = Boolean(creatorAddress && userWallets.some(wallet => wallet === creatorAddress));
        
        // Add debug info to help diagnose
        console.log(`Coin: ${nodeData.coin?.name} (${nodeData.coin?.symbol})`);
        console.log(`Creator address: ${creatorAddress}`);
        console.log(`Is creator: ${isCreator}`);
        
        return {
          id: nodeData.id,
          coin: {
            address: nodeData.coin?.address,
            name: nodeData.coin?.name,
            symbol: nodeData.coin?.symbol,
            totalSupply: nodeData.coin?.totalSupply,
            uniqueHolders: nodeData.coin?.uniqueHolders,
            creatorAddress: nodeData.coin?.creatorAddress || null,
            image: nodeData.coin?.mediaContent?.previewImage?.medium || null
          },
          balance: nodeData.balance,
          formattedBalance: parseFloat(nodeData.balance) / 1e18,
          isCreator: isCreator,
          creatorMatchDetails: {
            creatorAddress,
            userWallets,
            matchDetails: userWallets.map(wallet => ({
              wallet,
              matches: creatorAddress === wallet
            }))
          }
        };
      });
      
      allBalances = [...allBalances, ...pageBalances];
      
      // Update cursor for next page
      cursor = balancesRes.data?.profile?.coinBalances?.pageInfo?.endCursor;
      console.log(`Fetched page with ${pageBalances.length} balances, next cursor: ${cursor}`);
      
      if (!cursor || !fetchAll) {
        break;
      }
    } while (true);
    
    console.log(`Fetched a total of ${allBalances.length} balances`);
    
    // Categorize balances into created and collected
    const createdCoins = allBalances.filter(balance => balance.isCreator);
    const collectedCoins = allBalances.filter(balance => !balance.isCreator);
    
    console.log(`Created coins count: ${createdCoins.length}`);
    console.log(`Collected coins count: ${collectedCoins.length}`);
    
    // Step 3: Get detailed data for each created coin
    console.log('Fetching detailed data for created coins...');
    const coinDetailsPromises = createdCoins.map(async (balance) => {
      if (!balance.coin.address) return null;
      
      try {
        console.log(`Fetching details for coin ${balance.coin.name} (${balance.coin.address})...`);
        const coinDetails = await getCoin({
          address: balance.coin.address,
          chain: base.id,
        });
        
        return {
          ...balance,
          details: coinDetails.data?.zora20Token || null
        };
      } catch (error) {
        console.error(`Error fetching coin details for ${balance.coin.address}:`, error);
        return {
          ...balance,
          details: null
        };
      }
    });
    
    const coinDetailsResults = await Promise.all(coinDetailsPromises);
    const createdCoinsWithDetails = coinDetailsResults.filter(Boolean);
    
    // Step 4: Calculate analytics metrics
    let totalEarnings = 0;
    let totalVolume = 0;
    const postsCount = createdCoins.length;
    
    // Calculate total volume and estimate earnings (5% creator fee)
    createdCoinsWithDetails.forEach(coin => {
      if (coin.details) {
        // Use totalVolume from the coin details
        const volume = parseFloat(coin.details.totalVolume || '0');
        totalVolume += volume;
        
        // Estimate earnings as 5% of volume
        const earnings = volume * 0.05;
        totalEarnings += earnings;
      }
    });
    
    // Calculate average earnings per post
    const avgEarningsPerPost = postsCount > 0 ? totalEarnings / postsCount : 0;
    
    // Prepare holder vs trader data
    const holderTraderData = createdCoinsWithDetails.map(coin => {
      // Extract holder data
      const uniqueHolders = parseInt(coin.details?.uniqueHolders || '0');
      
      // We don't have direct trader data, but we can estimate
      // Assuming active traders are ~20% of unique holders (this is a rough estimate)
      const estimatedTraders = Math.floor(uniqueHolders * 0.2);
      const estimatedCollectors = uniqueHolders - estimatedTraders;
      
      return {
        name: coin.coin.name,
        symbol: coin.coin.symbol,
        address: coin.coin.address,
        uniqueHolders,
        estimatedCollectors,
        estimatedTraders,
        totalVolume: parseFloat(coin.details?.totalVolume || '0'),
        estimatedEarnings: parseFloat(coin.details?.totalVolume || '0') * 0.05
      };
    });
    
    // Structure the response
    const analyticsData = {
      profile: profileData,
      metrics: {
        totalEarnings,
        totalVolume,
        posts: postsCount,
        averageEarningsPerPost: avgEarningsPerPost,
      },
      coins: {
        created: {
          count: createdCoins.length,
          items: createdCoinsWithDetails.map(coin => ({
            name: coin.coin.name,
            symbol: coin.coin.symbol,
            address: coin.coin.address,
            balance: coin.formattedBalance,
            uniqueHolders: coin.details?.uniqueHolders || 0,
            totalVolume: parseFloat(coin.details?.totalVolume || '0'),
            estimatedEarnings: parseFloat(coin.details?.totalVolume || '0') * 0.05
          }))
        },
        collected: {
          count: collectedCoins.length,
          items: collectedCoins.map(coin => ({
            name: coin.coin.name,
            symbol: coin.coin.symbol,
            address: coin.coin.address,
            balance: coin.formattedBalance,
            creatorAddress: coin.coin.creatorAddress
          }))
        }
      },
      holderVsTrader: {
        totalHolders: holderTraderData.reduce((sum, coin) => sum + coin.uniqueHolders, 0),
        estimatedCollectors: holderTraderData.reduce((sum, coin) => sum + coin.estimatedCollectors, 0),
        estimatedTraders: holderTraderData.reduce((sum, coin) => sum + coin.estimatedTraders, 0),
        coinBreakdown: holderTraderData
      }
    };
    
    return NextResponse.json(analyticsData, { 
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      } 
    });
  } catch (error) {
    console.error('Error fetching creator analytics:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch creator analytics', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 