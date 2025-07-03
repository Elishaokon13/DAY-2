import { NextRequest, NextResponse } from "next/server";

// In-memory storage for demo (use database in production)
const userPermissions: Record<string, {
  hasPermission: boolean;
  userAddress: string;
  farcasterUsername: string;
  createdAt: number;
  expiresAt: number;
}> = {};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userAddress } = body;

    if (!userAddress) {
      return NextResponse.json(
        { error: "User address is required" },
        { status: 400 }
      );
    }

    // Check if user has existing permission
    const permission = userPermissions[userAddress];
    const hasPermission = permission && 
      permission.hasPermission && 
      permission.expiresAt > Date.now();

    return NextResponse.json({
      hasPermission: !!hasPermission,
      permission: hasPermission ? permission : null,
    });
  } catch (error) {
    console.error("Error checking spend permission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 