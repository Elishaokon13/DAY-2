import { NextRequest, NextResponse } from 'next/server';

// Updated GraphQL query to match Zora's API schema
const CREATOR_COINS_QUERY = `
query GetCreatorCoins($creator: String!) {
  zora {
    tokens(
      where: {
        creator: $creator
      },
      networks: [ZORA_MAINNET, BASE_MAINNET]
    ) {
      nodes {
        address
        name
        symbol
        totalVolume
        volume24h
        uniqueHolders
        creatorAddress
        createdAt
        network
      }
    }
  }
}
`;

// Alternative query if above doesn't work
const ALTERNATIVE_QUERY = `
query GetCreatorCoins($creator: String!) {
  zora {
    searchTokens(
      filter: {
        creator: $creator
      }
    ) {
      nodes {
        address
        name
        symbol
        totalVolume
        volume24h
        uniqueHolders
        creatorAddress
        createdAt
        network
      }
    }
  }
}
`;

export async function POST(req: NextRequest) {
  try {
    const { creator } = await req.json();
    
    if (!creator) {
      return NextResponse.json({ error: 'Missing creator address or ENS' }, { status: 400 });
    }
    
    console.log(`Fetching creator coins directly from GraphQL API for: ${creator}`);
    
    // Try the first query
    const response = await fetch('https://api.zora.co/universal/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: CREATOR_COINS_QUERY,
        variables: { creator }
      })
    });
    
    let data = await response.json();
    
    // If first query fails, try the alternative
    if (data.errors) {
      console.log('First query failed, trying alternative query...');
      const altResponse = await fetch('https://api.zora.co/universal/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: ALTERNATIVE_QUERY,
          variables: { creator }
        })
      });
      
      data = await altResponse.json();
    }
    
    console.log('GraphQL API response:', JSON.stringify(data, null, 2));
    
    if (data.errors) {
      return NextResponse.json({ 
        error: data.errors[0].message,
        allErrors: data.errors 
      }, { status: 500 });
    }
    
    // Process the tokens and calculate earnings
    const tokens = data.data?.zora?.tokens?.nodes || data.data?.zora?.searchTokens?.nodes || [];
    let totalEarnings = 0;
    let totalVolume = 0;
    
    const processedTokens = tokens.map(token => {
      const volume = parseFloat(token.totalVolume || '0');
      totalVolume += volume;
      
      // Estimate earnings (5% creator fee)
      const estimatedEarnings = volume * 0.05;
      totalEarnings += estimatedEarnings;
      
      return {
        ...token,
        estimatedEarnings
      };
    });
    
    return NextResponse.json({
      totalEarnings,
      totalVolume,
      tokens: processedTokens,
      count: processedTokens.length
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching from Zora GraphQL API:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch data from Zora API', 
      details: error.message 
    }, { status: 500 });
  }
}

// Also allow GET requests for easier testing in browser
export async function GET(req: NextRequest) {
  const creator = req.nextUrl.searchParams.get('creator');
  
  if (!creator) {
    return NextResponse.json({ error: 'Missing creator address or ENS' }, { status: 400 });
  }
  
  // Convert to POST request format
  const fakeReq = {
    json: async () => ({ creator })
  };
  
  return POST(fakeReq as any);
} 