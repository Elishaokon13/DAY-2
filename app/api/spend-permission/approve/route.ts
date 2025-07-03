import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { 
  spendPermissionManagerAddress, 
  spendPermissionManagerAbi,
  USDC_ADDRESS,
  SPEND_PERMISSION_CONFIG
} from "@/lib/spend-permission-constants";

// In-memory storage for demo (use database in production)
const userPermissions: Record<string, {
  hasPermission: boolean;
  userAddress: string;
  farcasterUsername: string;
  createdAt: number;
  expiresAt: number;
  spendPermission: object;
  signature: string;
}> = {};

// Initialize viem client for Base mainnet
const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.NEXT_PUBLIC_PROVIDER_URL),
});

// Initialize wallet client for the spender (to execute paymaster transactions)
let walletClient: any = null;
let spenderAccount: any = null;

if (process.env.SPENDER_PRIVATE_KEY) {
  try {
    const privateKey = process.env.SPENDER_PRIVATE_KEY;
    if (!privateKey.startsWith('0x')) {
      throw new Error('Private key must start with 0x');
    }
    if (privateKey.length !== 66) {
      throw new Error(`Private key must be 66 characters long (including 0x), got ${privateKey.length}`);
    }
    
    spenderAccount = privateKeyToAccount(privateKey as `0x${string}`);
    walletClient = createWalletClient({
      account: spenderAccount,
      chain: base,
      transport: http(process.env.NEXT_PUBLIC_PROVIDER_URL),
    });
    
    console.log('✅ Wallet client initialized for paymaster transactions');
  } catch (error) {
    console.error('❌ Error initializing wallet client:', error);
  }
} else {
  console.warn('⚠️ SPENDER_PRIVATE_KEY not found - paymaster transactions disabled');
}

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/spend-permission/approve - Starting paymaster approval");
    
    const body = await request.json();
    const { spendPermission, signature, userAddress, farcasterUsername } = body;

    // Validate required fields
    if (!spendPermission || !signature || !userAddress || !farcasterUsername) {
      console.error("Missing required fields:", {
        hasSpendPermission: !!spendPermission,
        hasSignature: !!signature,
        hasUserAddress: !!userAddress,
        hasFarcasterUsername: !!farcasterUsername
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Convert string values to appropriate types for contract interaction
    const processedSpendPermission = {
      account: spendPermission.account as `0x${string}`,
      spender: spendPermission.spender as `0x${string}`,
      token: spendPermission.token as `0x${string}`,
      allowance: typeof spendPermission.allowance === 'string' ? BigInt(spendPermission.allowance) : BigInt(spendPermission.allowance || 0),
      period: typeof spendPermission.period === 'string' ? Number(spendPermission.period) : spendPermission.period || 0,
      start: typeof spendPermission.start === 'string' ? Number(spendPermission.start) : spendPermission.start || 0,
      end: typeof spendPermission.end === 'string' ? Number(spendPermission.end) : spendPermission.end || 0,
      salt: typeof spendPermission.salt === 'string' ? BigInt(spendPermission.salt) : BigInt(spendPermission.salt || 0),
      extraData: spendPermission.extraData as `0x${string}`,
    };

    // Validate spend permission fields
    if (!processedSpendPermission.account || !processedSpendPermission.spender || !processedSpendPermission.token) {
      console.error("Invalid spend permission data:", {
        account: processedSpendPermission.account,
        spender: processedSpendPermission.spender,
        token: processedSpendPermission.token
      });
      return NextResponse.json(
        { error: "Invalid spend permission data" },
        { status: 400 }
      );
    }

    // Check if wallet client is available for paymaster transactions
    if (!walletClient) {
      return NextResponse.json(
        { 
          success: false,
          error: "Paymaster not available",
          message: "SPENDER_PRIVATE_KEY not properly configured. Paymaster transactions disabled."
        },
        { status: 500 }
      );
    }

    console.log("Executing approveWithSignature with paymaster sponsorship...");
    console.log("Spend permission:", JSON.stringify({
      ...processedSpendPermission,
      allowance: processedSpendPermission.allowance.toString(),
      salt: processedSpendPermission.salt.toString(),
    }, null, 2));

    // Execute the approval transaction with paymaster (gas sponsored)
    const txHash = await walletClient.writeContract({
      address: spendPermissionManagerAddress,
      abi: spendPermissionManagerAbi,
      functionName: 'approveWithSignature',
      args: [processedSpendPermission, signature as `0x${string}`],
    });

    console.log("Paymaster-sponsored approval transaction hash:", txHash);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    
    if (receipt.status !== 'success') {
      throw new Error('Approval transaction failed');
    }

    console.log("Approval transaction confirmed with paymaster sponsorship!");

    // Store the permission with stringified BigInt values
    userPermissions[userAddress] = {
      hasPermission: true,
      userAddress,
      farcasterUsername,
      createdAt: Date.now(),
      expiresAt: Date.now() + (processedSpendPermission.period * 1000),
      spendPermission: {
        ...processedSpendPermission,
        allowance: processedSpendPermission.allowance.toString(),
        salt: processedSpendPermission.salt.toString(),
      },
      signature,
    };

    const responseData = {
      success: true,
      message: "Spend permission approved with paymaster sponsorship",
      transactionHash: txHash,
      gasSponsored: true,
      permission: userPermissions[userAddress],
    };

    console.log("Paymaster approval completed successfully");
    
    return new Response(JSON.stringify(responseData, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error processing paymaster approval:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack available');
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process spend permission approval",
        message: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: error instanceof SyntaxError ? 400 : 500 }
    );
  }
}