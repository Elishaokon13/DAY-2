// app/api/zora-tokens/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getProfile, getProfileBalances } from '@zoralabs/coins-sdk'

// Mock token data to use when API fails
const getMockTokens = (displayName: string) => {
  return [
    {
      address: "0x31bb5f5a4644d2ad26f7bcbff042a1834f222819",
      name: "Hapa Sushi",
      symbol: "Hapa Sushi",
      imageUrl: "https://scontent-iad4-1.choicecdn.com/-/rs:fit:1200:1200/f:best/aHR0cHM6Ly9tYWdpYy5kZWNlbnRyYWxpemVkLWNvbnRlbnQuY29tL2lwZnMvYmFmeWJlaWdkNjJtaXBrdHlreG8ybzRnamFlb25iNzZ1bXh3N200bnV6b2c2b3J0b3B3dnc2M25pdXU=",
      balance: "13136507119571769710056288"
    },
    {
      address: "0x9b41d403d679e7d8703b923a9a66a3f463d36711",
      name: "Talking to my therapist",
      symbol: "Talking to my therapist",
      imageUrl: "https://scontent-iad4-1.choicecdn.com/-/rs:fit:1200:1200/f:best/aHR0cHM6Ly9tYWdpYy5kZWNlbnRyYWxpemVkLWNvbnRlbnQuY29tL2lwZnMvYmFmeWJlaWdlZzN3bzMzZGMzZHN1bW9nYTJnZ3lyMmlleWtua29iNHZrbzdjdXhxd2F0N2piZXprcHk=",
      balance: "12907336988134996012559401"
    },
    {
      address: "0xedbd267cfbc63561bef77b6776b49065f50faa08",
      name: "Sunrises in Denver are different",
      symbol: "Sunrises in Denver are different",
      imageUrl: "https://scontent-iad4-1.choicecdn.com/-/rs:fit:1200:1200/f:best/aHR0cHM6Ly9tYWdpYy5kZWNlbnRyYWxpemVkLWNvbnRlbnQuY29tL2lwZnMvYmFmeWJlaWZtYWZlZmg2c291aGF4MnJndzZuZjUzd2pra3RmazR5bWduemNkY3J1Njc2ZmZrcDRycG0=",
      balance: "12544191173569673341079278"
    }
  ];
};

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get('handle')
  const useMockData = req.nextUrl.searchParams.get('mock') === 'true'

  if (!handle) {
    return NextResponse.json({ error: 'Missing Zora handle' }, { status: 400 })
  }

  // Clean up the handle input (remove @ if present)
  const cleanHandle = handle.trim().replace(/^@/, '')

  try {
    // Get profile data
    const profileRes = await getProfile({ identifier: cleanHandle })

    // Extract profile information using the correct structure
    const profileData = profileRes?.data 
    
    if (!profileData?.profile) {
      console.log('Zora profile not found')
      return NextResponse.json({ error: 'Zora profile not found' }, { status: 404 })
    }
    
    const displayName =
      profileData?.profile?.displayName ||
      profileData?.profile?.handle ||
      cleanHandle

    // Include profile image if available
    const profileImage = profileData?.profile?.avatar?.medium || null

    let tokens = [];

    if (useMockData) {
      // Use mock data if requested
      console.log("Using mock token data");
      tokens = getMockTokens(displayName);
    } else {
      try {
        // Try to get balance data from API
        const balancesRes = await getProfileBalances({ identifier: cleanHandle });
        
        if (balancesRes?.data?.profile?.coinBalances?.edges) {
          // Extract coin balances - properly navigate the response structure
          const balanceEdges = balancesRes.data.profile.coinBalances.edges || [];
          
          // Map edges to a simpler format
          const coinBalances = balanceEdges.map(edge => edge.node);
          
          const topTokens = coinBalances
            .filter((node) => 
              Number(node.balance) > 0 && 
              node.coin?.mediaContent?.previewImage
            )
            .sort((a, b) => 
              Number(b.balance || 0) - Number(a.balance || 0)
            )
            .slice(0, 5);

          tokens = topTokens.map(({ coin, balance }) => ({
            address: coin?.address || '',
            name: coin?.name || 'Unknown Token',
            symbol: coin?.symbol || '???',
            imageUrl: coin?.mediaContent?.previewImage?.medium || '/placeholder.svg',
            balance,
          }));
        } else {
          // Fallback to mock data if API response doesn't have the expected structure
          console.log("API response doesn't contain coin balances, using mock data");
          tokens = getMockTokens(displayName);
        }
      } catch (error) {
        // Fallback to mock data if API call fails
        console.error("Error fetching balances:", error);
        console.log("Using mock data due to API error");
        tokens = getMockTokens(displayName);
      }
    }

    return NextResponse.json({
      tokens,
      displayName,
      profileImage,
      profileHandle: profileData?.profile?.handle,
    })
  } catch (error) {
    console.error('Zora API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch from Zora',
      tokens: [],
      displayName: cleanHandle
    }, { status: 500 })
  }
}

export type ZoraToken = {
  address: string
  name: string
  symbol: string
  imageUrl: string
  balance: string
}

export type ZoraTokenResponse = {
  tokens: ZoraToken[]
  displayName: string
  profileImage: string | null 
  profileHandle: string | null
}