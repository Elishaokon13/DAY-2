import { NextRequest, NextResponse } from "next/server";
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { spendPermission, signature, userAddress, farcasterUsername } = body;
    
    // Convert string values back to numbers/BigInt for processing
    const processedSpendPermission = {
      ...spendPermission,
      allowance: typeof spendPermission.allowance === 'string' ? BigInt(spendPermission.allowance) : spendPermission.allowance,
      period: typeof spendPermission.period === 'string' ? parseInt(spendPermission.period) : spendPermission.period,
      start: typeof spendPermission.start === 'string' ? parseInt(spendPermission.start) : spendPermission.start,
      end: typeof spendPermission.end === 'string' ? parseInt(spendPermission.end) : spendPermission.end,
      salt: typeof spendPermission.salt === 'string' ? BigInt(spendPermission.salt) : spendPermission.salt,
    };

    if (!processedSpendPermission || !signature || !userAddress || !farcasterUsername) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // For demo purposes, we'll simulate the paymaster transaction
    // In production, you would use the actual Spend Permission Manager contract
    console.log("Simulating spend permission approval with paymaster...");
    console.log("User:", farcasterUsername, "Address:", userAddress);
    console.log("Permission details:", {
      allowance: processedSpendPermission.allowance.toString(),
      period: processedSpendPermission.period,
      token: processedSpendPermission.token,
    });

    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Store the permission (in production, this would be after successful blockchain transaction)
    userPermissions[userAddress] = {
      hasPermission: true,
      userAddress,
      farcasterUsername,
      createdAt: Date.now(),
      expiresAt: Date.now() + (processedSpendPermission.period * 1000), // Convert seconds to milliseconds
      spendPermission: processedSpendPermission,
      signature,
    };

    // Mock transaction hash
    const mockTxHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;

    const responseData = {
      success: true,
      message: "Spend permission approved successfully",
      transactionHash: mockTxHash,
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
      { status: 500 }
    );
  }
} 