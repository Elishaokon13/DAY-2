import { NextRequest, NextResponse } from 'next/server';
import { getProfileBalances, getProfile } from '@zoralabs/coins-sdk';

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
  const count = req.nextUrl.searchParams.get('count') ? parseInt(req.nextUrl.searchParams.get('count')!) : 20;
  const after = req.nextUrl.searchParams.get('after') || undefined;
  const fetchAll = req.nextUrl.searchParams.get('fetchAll') === 'true';
  
  if (!identifier) {
    return NextResponse.json({ error: 'Missing identifier parameter (wallet address or handle)' }, { status: 400 });
  }

  try {
    // Get profile information first
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
    
    let allBalances: any[] = [];
    let cursor = after;
    
    if (fetchAll) {
      // Fetch all balances (paginated)
      console.log(`Fetching all balances for ${identifier}...`);
      
      do {
        const balancesRes = await getProfileBalances({
          identifier,
          count,
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
          const userWalletAddress = profile.publicWallet?.walletAddress?.toLowerCase();
          const isCreator = creatorAddress && userWalletAddress && creatorAddress === userWalletAddress;
          
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
        
        // Update cursor for next page
        cursor = balancesRes.data?.profile?.coinBalances?.pageInfo?.endCursor;
        console.log(`Fetched page with ${pageBalances.length} balances, next cursor: ${cursor}`);
        
        if (!cursor) {
          break;
        }
      } while (true);
      
      console.log(`Fetched a total of ${allBalances.length} balances`);
    } else {
      // Fetch a single page
      console.log(`Fetching balances for ${identifier} (single page)...`);
      const balancesRes = await getProfileBalances({
        identifier,
        count,
        after
      });
      
      const edges = balancesRes.data?.profile?.coinBalances?.edges || [];
      
      // Process each balance
      allBalances = edges.map(edge => {
        const nodeData = edge.node;
        // Use case-insensitive comparison for creator address
        const creatorAddress = nodeData.coin?.creatorAddress?.toLowerCase();
        const userWalletAddress = profile.publicWallet?.walletAddress?.toLowerCase();
        const isCreator = creatorAddress && userWalletAddress && creatorAddress === userWalletAddress;
        
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
      
      cursor = balancesRes.data?.profile?.coinBalances?.pageInfo?.endCursor;
      console.log(`Fetched ${allBalances.length} balances, next cursor: ${cursor}`);
    }
    
    // Categorize balances into created and collected
    const createdCoins = allBalances.filter(balance => balance.isCreator);
    const collectedCoins = allBalances.filter(balance => !balance.isCreator);
    
    // Sort by balance amount (highest first)
    createdCoins.sort((a, b) => b.formattedBalance - a.formattedBalance);
    collectedCoins.sort((a, b) => b.formattedBalance - a.formattedBalance);
    
    return NextResponse.json({
      profile: profileData,
      balances: {
        total: allBalances.length,
        created: {
          count: createdCoins.length,
          coins: createdCoins
        },
        collected: {
          count: collectedCoins.length,
          coins: collectedCoins
        },
        all: allBalances
      },
      pagination: {
        nextCursor: cursor
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching profile balances:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch profile balances', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 