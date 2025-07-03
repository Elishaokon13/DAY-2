import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, createWalletClient, custom } from "viem";
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

// Wallet client for sending transactions (configure with a private key or provider)
const walletClient = createWalletClient({
  chain: base,
  transport: custom({ request: async (args) => {
    // Implement your wallet provider logic here (e.g., using a private key or a signer)
    throw new Error("Wallet provider not configured");
  }}),
});

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

    // Call the contract's approveWithSignature function
    const { request: txRequest } = await publicClient.simulateContract({
      address: spendPermissionManagerAddress,
      abi: spendPermissionManagerAbi,
      functionName: "approveWithSignature",
      args: [processedSpendPermission, signature as `0x${string}`],
      account: userAddress as `0x${string}`,
    });

    // Send the transaction (requires a configured wallet client)
    const txHash = await walletClient.writeContract(txRequest);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    if (receipt.status !== "success") {
      throw new Error("Transaction failed");
    }

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
      message: "Spend permission approved successfully",
      transactionHash: txHash,
      permission: userPermissions[userAddress],
    };

    return new Response(JSON.stringify(responseData, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error approving spend permission:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to approve spend permission",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: error instanceof SyntaxError ? 400 : 500 }
    );
  }
}