import { NextRequest, NextResponse } from 'next/server';
import { getRewardsBalances } from '@zoralabs/protocol-sdk';
import { createPublicClient, http } from 'viem';
import { base, zora } from 'viem/chains';
import { getProfile } from '@zoralabs/coins-sdk';

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
  const address = req.nextUrl.searchParams.get('address');
  const handle = req.nextUrl.searchParams.get('handle');
  
  if (!address && !handle) {
    return NextResponse.json({ error: 'Missing address or handle parameter' }, { status: 400 });
  }

  try {
    // If handle is provided, resolve it to an address
    let creatorAddress = address;
    let profileData = null;
    
    if (handle && !address) {
      // Try to get the address from the handle
      console.log(`Resolving handle ${handle} to address...`);
      const profileRes = await getProfile({ identifier: handle.replace(/^@/, '') });
      
      if (!profileRes?.data?.profile?.publicWallet?.walletAddress) {
        return NextResponse.json({ error: 'Could not resolve handle to address' }, { status: 404 });
      }
      
      creatorAddress = profileRes.data.profile.publicWallet.walletAddress;
      profileData = {
        displayName: profileRes.data.profile.displayName || handle,
        handle: profileRes.data.profile.handle,
        profileImage: profileRes.data.profile.avatar?.medium || null,
        bio: profileRes.data.profile.bio || null
      };
      
      console.log(`Resolved handle ${handle} to address ${creatorAddress}`);
    }

    // Create public clients for Base and Zora networks
    const baseClient = createPublicClient({
      chain: base,
      transport: http()
    });
    
    const zoraClient = createPublicClient({
      chain: zora,
      transport: http()
    });

    // Get rewards balances on both networks
    console.log(`Fetching rewards for ${creatorAddress} on Base...`);
    const baseRewards = await getRewardsBalances({
      account: creatorAddress as `0x${string}`,
      publicClient: baseClient
    });
    
    console.log(`Fetching rewards for ${creatorAddress} on Zora...`);
    const zoraRewards = await getRewardsBalances({
      account: creatorAddress as `0x${string}`,
      publicClient: zoraClient
    });

    // Calculate total from both networks
    const protocolRewardsBase = Number(baseRewards.protocolRewards) / 1e18; // Convert from wei to ETH
    const protocolRewardsZora = Number(zoraRewards.protocolRewards) / 1e18;
    
    const ethRoyaltiesBase = Number(baseRewards.secondaryRoyalties.eth || 0n) / 1e18;
    const ethRoyaltiesZora = Number(zoraRewards.secondaryRoyalties.eth || 0n) / 1e18;
    
    // Parse ERC20 royalties
    const erc20Royalties = {
      ...baseRewards.secondaryRoyalties.erc20,
      ...zoraRewards.secondaryRoyalties.erc20
    };
    
    // Format ERC20 royalties for display
    const formattedErc20Royalties = Object.entries(erc20Royalties).map(([token, amount]) => ({
      token,
      amount: Number(amount) / 1e18, // Assuming 18 decimals, adjust as needed
    }));

    // Calculate totals
    const totalProtocolRewards = protocolRewardsBase + protocolRewardsZora;
    const totalEthRoyalties = ethRoyaltiesBase + ethRoyaltiesZora;
    const totalEarnings = totalProtocolRewards + totalEthRoyalties;

    // Serialize the raw data to handle BigInt values
    const serializedBaseRewards = serializeBigInt(baseRewards);
    const serializedZoraRewards = serializeBigInt(zoraRewards);

    return NextResponse.json({
      profile: profileData,
      address: creatorAddress,
      earnings: {
        total: totalEarnings,
        protocolRewards: {
          total: totalProtocolRewards,
          base: protocolRewardsBase,
          zora: protocolRewardsZora
        },
        secondaryRoyalties: {
          eth: {
            total: totalEthRoyalties,
            base: ethRoyaltiesBase,
            zora: ethRoyaltiesZora
          },
          erc20: formattedErc20Royalties
        }
      },
      rawData: {
        base: serializedBaseRewards,
        zora: serializedZoraRewards
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching creator rewards:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch creator rewards', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 