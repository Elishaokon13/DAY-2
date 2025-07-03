import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { 
  spendPermissionManagerAddress, 
  spendPermissionManagerAbi,
  USDC_ADDRESS,
  SPENDER_ADDRESS,
  SPEND_PERMISSION_CONFIG
} from "@/lib/spend-permission-constants";

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

// Initialize clients
const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.NEXT_PUBLIC_PROVIDER_URL),
});

// Initialize wallet client for the spender (only if private key is available)
let walletClient: any = null;
let spenderAccount: any = null;

console.log('=== Environment Variable Debug ===');
console.log('SPENDER_PRIVATE_KEY exists:', !!process.env.SPENDER_PRIVATE_KEY);
console.log('SPENDER_PRIVATE_KEY length:', process.env.SPENDER_PRIVATE_KEY?.length);
console.log('SPENDER_PRIVATE_KEY starts with 0x:', process.env.SPENDER_PRIVATE_KEY?.startsWith('0x'));
console.log('===================================');

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
    
    console.log('✅ Wallet client initialized with spender address:', spenderAccount.address);
  } catch (error) {
    console.error('❌ Error initializing wallet client:', error);
    console.error('Please check your SPENDER_PRIVATE_KEY environment variable');
  }
} else {
  console.warn('⚠️ SPENDER_PRIVATE_KEY not found in environment variables');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { displayName, farcasterUsername, fee, userAddress, spendPermission, signature } = body;

    if (!displayName || !farcasterUsername || !fee || !userAddress || !spendPermission || !signature) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("Generating collage for:", farcasterUsername);
    console.log("User address:", userAddress);
    console.log("Fee:", fee, "USDC");

    // Parse the spend permission
    const parsedSpendPermission = JSON.parse(spendPermission);

    // Check if user has enough allowance
    const feeAmount = parseFloat(fee);
    const allowanceInUSDC = parseInt(parsedSpendPermission.allowance) / 1000000; // Convert from wei to USDC (6 decimals)

    if (feeAmount > allowanceInUSDC) {
      return NextResponse.json(
        { 
          success: false,
          error: "Insufficient allowance for this transaction" 
        },
        { status: 403 }
      );
    }

    // Convert fee to USDC amount (6 decimals)
    const usdcAmount = parseUnits(fee, 6);
    
    // Reconstruct the spend permission object for the contract
    const spendPermissionForContract = {
      account: userAddress as `0x${string}`,
      spender: SPENDER_ADDRESS,
      token: USDC_ADDRESS,
      allowance: BigInt(parsedSpendPermission.allowance),
      period: parsedSpendPermission.period,
      start: parsedSpendPermission.start,
      end: parsedSpendPermission.end,
      salt: BigInt(parsedSpendPermission.salt),
      extraData: parsedSpendPermission.extraData as `0x${string}`,
    };

    console.log("Executing USDC spend via spend permission...");
    console.log("Spend permission:", JSON.stringify({
      ...spendPermissionForContract,
      allowance: spendPermissionForContract.allowance.toString(),
      salt: spendPermissionForContract.salt.toString(),
    }, null, 2));

    // Check if wallet client is available
    if (!walletClient) {
      return NextResponse.json(
        { 
          success: false,
          error: "Wallet client not available",
          message: "SPENDER_PRIVATE_KEY not properly configured. Please check your environment variables."
        },
        { status: 500 }
      );
    }

    // Use the spend permission to transfer USDC
    const txHash = await walletClient.writeContract({
      address: spendPermissionManagerAddress,
      abi: spendPermissionManagerAbi,
      functionName: 'spend',
      args: [
        spendPermissionForContract,
        usdcAmount,
      ],
    });

    console.log("USDC spend transaction hash:", txHash);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    
    if (receipt.status !== 'success') {
      throw new Error('USDC spend transaction failed');
    }

    console.log("USDC spend confirmed, collage generation complete!");

    // Generate collage ID
    const collageId = `collage_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    // Store collage generation record
    collageGenerations[collageId] = {
      id: collageId,
      displayName,
      farcasterUsername,
      fee,
      generatedAt: Date.now(),
      transactionHash: txHash,
    };

    return NextResponse.json({
      success: true,
      message: "Collage generated successfully with USDC payment",
      collageId,
      transactionHash: txHash,
      chargedAmount: fee,
      currency: "USDC",
      remainingAllowance: allowanceInUSDC - feeAmount,
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