import { NextRequest, NextResponse } from 'next/server';
import { getProfile, getProfileBalances, getCoin } from '@zoralabs/coins-sdk';
import { base } from 'viem/chains';

// In-memory cache
const CACHE = new Map<string, {
  data: any,
  timestamp: number
}>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache time

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

// Process balances in batches
async function processCoinBatchesInParallel(coins: any[], batchSize = 5) {
  const results = [];
  const batches = [];
  
  // Split coins into batches
  for (let i = 0; i < coins.length; i += batchSize) {
    batches.push(coins.slice(i, i + batchSize));
  }
  
  // Process batches in parallel
  for (const batch of batches) {
    const batchPromises = batch.map(async (balance) => {
      if (!balance.coin.address) return null;
      
      const cacheKey = `coin_details_${balance.coin.address}`;
      // Check if we have a cache hit
      if (CACHE.has(cacheKey)) {
        const cached = CACHE.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          console.log(`Cache hit for coin ${balance.coin.name}`);
          return {
            ...balance,
            details: cached.data
          };
        }
      }
      
      try {
        console.log(`Fetching details for coin ${balance.coin.name} (${balance.coin.address})...`);
        const coinDetails = await getCoin({
          address: balance.coin.address,
          chain: base.id,
        });
        
        const detailsData = coinDetails.data?.zora20Token || null;
        
        // Cache the result
        CACHE.set(cacheKey, {
          data: detailsData,
          timestamp: Date.now()
        });
        
        return {
          ...balance,
          details: detailsData
        };
      } catch (error) {
        console.error(`Error fetching coin details for ${balance.coin.address}:`, error);
        return {
          ...balance,
          details: null
        };
      }
    });
    
    // Wait for the current batch to complete before moving to the next
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results.filter(Boolean);
}

export async function GET(req: NextRequest) {
  const identifier = req.nextUrl.searchParams.get('identifier');
  const fetchAll = req.nextUrl.searchParams.get('fetchAll') === 'true';
  const initialLoadOnly = req.nextUrl.searchParams.get('initialLoadOnly') === 'true';
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '25');
  const skipCache = req.nextUrl.searchParams.get('skipCache') === 'true';
  
  if (!identifier) {
    return NextResponse.json({ error: 'Missing identifier parameter (wallet address or handle)' }, { status: 400 });
  }

  // Generate cache key based on the request parameters
  const cacheKey = `creator_analytics_${identifier}_${fetchAll}_${initialLoadOnly}_${limit}`;
  
  // Check cache first
  if (!skipCache && CACHE.has(cacheKey)) {
    const cached = CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Cache hit for ${identifier}`);
      return NextResponse.json(cached.data, { 
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Cache': 'HIT'
        } 
      });
    }
  }

  try {
    // Step 1: Get profile information
    console.log(`Getting profile for ${identifier}...`);
    const profileRes = await getProfile({ identifier });
    
    if (!profileRes?.data?.profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    const profile = profileRes.data.profile;
    
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
    
    // Fetch initial balances to analyze for patterns that might indicate a Zora-generated wallet
    if (!zoraGeneratedWallet) {
      try {
        console.log(`Trying to discover Zora-generated wallet for ${identifier}...`);
        
        const initialBalancesRes = await getProfileBalances({
          identifier,
          count: 20 // Fetch first few balances to analyze
        });
        
        const edges = initialBalancesRes.data?.profile?.coinBalances?.edges || [];
        
        if (edges.length > 0) {
          // Look for patterns in creator addresses
          // If multiple coins have the same creator address (not matching publicWallet)
          // it might be a Zora-generated wallet
          const creatorAddresses = edges
            .map(edge => edge.node.coin?.creatorAddress?.toLowerCase())
            .filter(Boolean) as string[];
          
          // Count occurrences of each address
          const addressCounts = creatorAddresses.reduce((acc: Record<string, number>, addr: string) => {
            acc[addr] = (acc[addr] || 0) + 1;
            return acc;
          }, {});
          
          // Find addresses that appear multiple times and aren't the public wallet
          const potentialWallets = Object.entries(addressCounts)
            .filter(([addr, count]) => count > 2 && addr !== publicWallet)
            .sort((a, b) => b[1] - a[1]); // Sort by count, highest first
          
          if (potentialWallets.length > 0) {
            zoraGeneratedWallet = potentialWallets[0][0];
            console.log(`Discovered potential Zora-generated wallet: ${zoraGeneratedWallet} (appeared in ${potentialWallets[0][1]} coins)`);
          }
        }
      } catch (err) {
        console.error('Error attempting to discover Zora-generated wallet:', err);
        // Continue without a generated wallet
      }
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
    
    // Set maximum pages to fetch for initial loads to avoid long wait times
    const maxPagesToFetch = initialLoadOnly ? 2 : (fetchAll ? 100 : 5);
    let pagesProcessed = 0;
    
    do {
      // Check if we've reached the limit for this request type
      if (pagesProcessed >= maxPagesToFetch) {
        console.log(`Reached maximum pages (${maxPagesToFetch}) for ${initialLoadOnly ? 'initial load' : (fetchAll ? 'full load' : 'standard load')}`);
        break;
      }
      
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
          isCreator: isCreator
        };
      });
      
      allBalances = [...allBalances, ...pageBalances];
      pagesProcessed++;
      
      // Update cursor for next page
      cursor = balancesRes.data?.profile?.coinBalances?.pageInfo?.endCursor;
      console.log(`Fetched page ${pagesProcessed} with ${pageBalances.length} balances, next cursor: ${cursor}`);
      
      if (!cursor) {
        break;
      }
    } while (true);
    
    console.log(`Fetched a total of ${allBalances.length} balances across ${pagesProcessed} pages`);
    
    // Categorize balances into created and collected
    const createdCoins = allBalances.filter(balance => balance.isCreator);
    const collectedCoins = allBalances.filter(balance => !balance.isCreator);
    
    console.log(`Created coins count: ${createdCoins.length}`);
    console.log(`Collected coins count: ${collectedCoins.length}`);
    
    // Step 3: Get detailed data for each created coin - use our batch processing
    console.log('Fetching detailed data for created coins in parallel batches...');
    
    // Limit the number of created coins we process in detail to avoid long wait times
    const createdCoinsToProcess = createdCoins.slice(0, limit);
    
    if (createdCoins.length > limit) {
      console.log(`Processing only ${limit} of ${createdCoins.length} created coins for performance`);
    }
    
    const createdCoinsWithDetails = await processCoinBatchesInParallel(createdCoinsToProcess);
    
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
    // even if they don't hold them anymore - but only if we're doing a full load
    try {
      if (userWallets.length > 0 && fetchAll && !initialLoadOnly) {
        console.log(`Fetching all coins created by wallets: ${userWallets.join(', ')}`);
        
        // Fetch coins for each wallet
        const walletFetchPromises = userWallets.map(async (wallet) => {
          try {
            const response = await fetch(
              `https://api.zora.co/creator-coins?chainIds=8453&creator=${wallet}`, 
              { headers: { Accept: 'application/json' } }
            );
            
            if (response.ok) {
              const data = await response.json();
              if (data && Array.isArray(data.coins)) {
                console.log(`Found ${data.coins.length} coins created by wallet ${wallet}`);
                return data.coins.length;
              }
            }
            return 0;
          } catch (err) {
            console.error(`Error fetching additional coins for wallet ${wallet}:`, err);
            return 0;
          }
        });
        
        const coinsPerWallet = await Promise.all(walletFetchPromises);
        const maxCoinsFound = Math.max(...coinsPerWallet, postsCount);
        
        if (maxCoinsFound > postsCount) {
          console.log(`Updating post count from ${postsCount} to ${maxCoinsFound}`);
          postsCount = maxCoinsFound;
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
          processed: createdCoinsWithDetails.length,
          totalCount: postsCount,
          hasMore: createdCoins.length > createdCoinsWithDetails.length,
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
          // Only return a subset of collected coins for performance
          items: collectedCoins.slice(0, limit).map(coin => ({
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
      },
      meta: {
        isCached: false,
        fetchedAt: new Date().toISOString(),
        fetchType: initialLoadOnly ? 'initial' : (fetchAll ? 'full' : 'standard'),
        pagesProcessed,
        limitApplied: limit
      }
    };
    
    // Cache the results
    CACHE.set(cacheKey, {
      data: analyticsData,
      timestamp: Date.now()
    });
    
    return NextResponse.json(analyticsData, { 
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Cache': 'MISS'
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