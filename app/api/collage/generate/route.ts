import { NextRequest, NextResponse } from "next/server";

// In-memory storage for demo
const userPermissions: Record<string, {
  hasPermission: boolean;
  userAddress: string;
  farcasterUsername: string;
  createdAt: number;
  expiresAt: number;
  spendPermission: any;
  signature: string;
  usedAmount?: number;
}> = {};

const collageGenerations: Record<string, {
  id: string;
  displayName: string;
  farcasterUsername: string;
  fee: string;
  generatedAt: number;
  transactionHash: string;
}> = {};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { displayName, farcasterUsername, fee } = body;

    if (!displayName || !farcasterUsername || !fee) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find user permission by Farcaster username
    const userPermission = Object.values(userPermissions).find(
      p => p.farcasterUsername === farcasterUsername
    );

    if (!userPermission || !userPermission.hasPermission) {
      return NextResponse.json(
        { 
          success: false,
          error: "No valid spend permission found" 
        },
        { status: 403 }
      );
    }

    // Check if permission is still valid
    if (userPermission.expiresAt < Date.now()) {
      return NextResponse.json(
        { 
          success: false,
          error: "Spend permission has expired" 
        },
        { status: 403 }
      );
    }

    // Check if user has enough allowance
    const feeAmount = parseFloat(fee);
    const usedAmount = userPermission.usedAmount || 0;
    const allowanceInUSDC = parseInt(userPermission.spendPermission.allowance) / 1000000; // Convert from wei to USDC (6 decimals)

    if (usedAmount + feeAmount > allowanceInUSDC) {
      return NextResponse.json(
        { 
          success: false,
          error: "Insufficient allowance remaining" 
        },
        { status: 403 }
      );
    }

    console.log("Generating collage for:", farcasterUsername);
    console.log("Charging:", fee, "USDC");
    console.log("Paymaster sponsoring gas fees...");

    // Simulate collage generation and spend transaction
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Generate collage ID and mock transaction
    const collageId = `collage_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const mockTxHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;

    // Update used amount
    userPermission.usedAmount = usedAmount + feeAmount;

    // Store collage generation record
    collageGenerations[collageId] = {
      id: collageId,
      displayName,
      farcasterUsername,
      fee,
      generatedAt: Date.now(),
      transactionHash: mockTxHash,
    };

    return NextResponse.json({
      success: true,
      message: "Collage generated successfully",
      collageId,
      transactionHash: mockTxHash,
      chargedAmount: fee,
      remainingAllowance: allowanceInUSDC - (usedAmount + feeAmount),
      generation: collageGenerations[collageId],
    });
  } catch (error) {
    console.error("Error generating collage:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to generate collage",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 