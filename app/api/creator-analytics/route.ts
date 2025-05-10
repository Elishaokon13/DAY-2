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
    
    // Look for a possible Zora-generated wallet address
    // We'll need to examine connected addresses and coins to identify it
    let zoraGeneratedWallet = null;
    
    // First, see if we have a known mapping
    const knownWallets: Record<string, string> = {
      'defidevrelalt': '0xafc833331e494d72bc6568a011f614702ca3c892',
      // Add more mappings here as they're discovered
    };
    
    if (profile.handle && knownWallets[profile.handle]) {
      zoraGeneratedWallet = knownWallets[profile.handle].toLowerCase();
      console.log(`Using known Zora-generated wallet for ${profile.handle}: ${zoraGeneratedWallet}`);
    }
    
    // Create a list of the user's wallet addresses to check against
    const userWallets = [
      publicWallet,
      zoraGeneratedWallet
    ].filter(Boolean) as string[];
    
    console.log(`User's wallets to check:`, userWallets);
    
    // If we don't have any wallet addresses to check, we can't proceed
    if (userWallets.length === 0) {
      return NextResponse.json({ 
        error: 'No wallet addresses found for this profile',
        profile: profileData
      }, { status: 404 });
    }
    
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
    
    // We need a more comprehensive count of all posts (not just coins with balances)
    // First, use the count of created coins we've found
    let postsCount = createdCoins.length;
    
    // For creators with many posts, this count might not be complete
    // Log for debugging purposes
    console.log(`Initial posts count based on created coins: ${postsCount}`);
    
    // For users with a public wallet, we can attempt to fetch all created coins
    // even if they don't hold them anymore
    try {
      if (userWallets.length > 0 && fetchAll) {
        console.log(`Fetching all coins created by wallets: ${userWallets.join(', ')}`);
        
        // Fetch coins for each wallet
        for (const wallet of userWallets) {
          try {
            const response = await fetch(
              `https://api.zora.co/creator-coins?chainIds=8453&creator=${wallet}`, 
              { headers: { Accept: 'application/json' } }
            );
            
            if (response.ok) {
              const data = await response.json();
              if (data && Array.isArray(data.coins)) {
                console.log(`Found ${data.coins.length} coins created by wallet ${wallet}`);
                
                // Update the count if we found more coins than we previously knew about
                if (data.coins.length > postsCount) {
                  console.log(`Updating post count from ${postsCount} to ${data.coins.length}`);
                  postsCount = data.coins.length;
                }
              }
            }
          } catch (err) {
            console.error(`Error fetching additional coins for wallet ${wallet}:`, err);
            // Continue with existing count on error
          }
        }
      }
    } catch (err) {
      console.error('Error while attempting to get complete post count:', err);
      // Continue with existing count on error
    }
    
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