import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, createWalletClient } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
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

// Create wallet client for the spender (to execute transactions)
function getSpenderWalletClient() {
  const spenderPrivateKey = process.env.SPENDER_PRIVATE_KEY;
  if (!spenderPrivateKey) {
    throw new Error("SPENDER_PRIVATE_KEY environment variable is not set");
  }
  
  // Ensure the private key has the correct format
  let formattedPrivateKey = spenderPrivateKey.trim();
  
  console.log(`Original private key length: ${spenderPrivateKey.length}`);
  console.log(`Trimmed private key length: ${formattedPrivateKey.length}`);
  console.log(`Private key starts with 0x: ${formattedPrivateKey.startsWith('0x')}`);
  
  // Add 0x prefix if missing
  if (!formattedPrivateKey.startsWith('0x')) {
    formattedPrivateKey = '0x' + formattedPrivateKey;
    console.log(`Added 0x prefix, new length: ${formattedPrivateKey.length}`);
  }
  
  // Validate private key length (should be 66 characters total: 0x + 64 hex chars)
  if (formattedPrivateKey.length !== 66) {
    console.error(`Private key validation failed:`);
    console.error(`- Length: ${formattedPrivateKey.length} (expected 66)`);
    console.error(`- First 10 chars: ${formattedPrivateKey.substring(0, 10)}`);
    console.error(`- Last 10 chars: ${formattedPrivateKey.substring(formattedPrivateKey.length - 10)}`);
    throw new Error(`Invalid private key length: ${formattedPrivateKey.length}. Expected 66 characters (0x + 64 hex chars)`);
  }
  
  // Validate that it's a valid hex string
  if (!/^0x[0-9a-fA-F]{64}$/.test(formattedPrivateKey)) {
    console.error(`Private key format validation failed:`);
    console.error(`- Pattern test failed for: ${formattedPrivateKey.substring(0, 10)}...${formattedPrivateKey.substring(formattedPrivateKey.length - 10)}`);
    throw new Error("Invalid private key format. Must be a 64-character hex string with 0x prefix");
  }
  
  console.log(`Private key validation successful`);
  
  const spenderAccount = privateKeyToAccount(formattedPrivateKey as `0x${string}`);
  
  return createWalletClient({
    account: spenderAccount,
    chain: base,
    transport: http(process.env.NEXT_PUBLIC_PROVIDER_URL),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { spendPermission, signature, userAddress, farcasterUsername } = body;

    // Validate required fields
    if (!spendPermission || !signature || !userAddress || !farcasterUsername) {
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
      return NextResponse.json(
        { error: "Invalid spend permission data" },
        { status: 400 }
      );
    }

    // Log the spend permission and signature for debugging
    console.log("Processed spend permission:", JSON.stringify({
      ...processedSpendPermission,
      allowance: processedSpendPermission.allowance.toString(),
      salt: processedSpendPermission.salt.toString(),
    }, null, 2));
    console.log("Signature:", signature);

    // Get the spender wallet client
    const spenderWalletClient = getSpenderWalletClient();

    // Execute the approveWithSignature transaction
    console.log("Executing approveWithSignature transaction...");
    const txHash = await spenderWalletClient.writeContract({
      address: spendPermissionManagerAddress,
      abi: spendPermissionManagerAbi,
      functionName: "approveWithSignature",
      args: [processedSpendPermission, signature as `0x${string}`],
    });

    console.log("Transaction submitted:", txHash);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    if (receipt.status !== "success") {
      throw new Error("Transaction failed");
    }

    console.log("Transaction confirmed:", receipt.transactionHash);

    // Store the permission with stringified BigInt values (for demo purposes)
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
      message: "Spend permission approved successfully",
      transactionHash: receipt.transactionHash,
      permission: userPermissions[userAddress],
    };

    return new Response(JSON.stringify(responseData, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error processing spend permission:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process spend permission",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: error instanceof SyntaxError ? 400 : 500 }
    );
  }
}