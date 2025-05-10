import { NextRequest, NextResponse } from 'next/server';
import paymentStore from '@/lib/paymentStore';
import { createPublicClient, http, decodeAbiParameters, formatUnits } from 'viem';
import { base } from 'viem/chains';

// USDC Contract details
const USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // Native USDC on Base
const RECEIVER_ADDRESS = '0x1B958A48373109E9146A950a75F5bD25B845143b'; 
const MIN_AMOUNT = '1.0'; // Minimum $1 USDC required

// Create a public client for Base
const publicClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

// Transfer function selector and parameter types
const TRANSFER_SELECTOR = '0xa9059cbb';
const TRANSFER_PARAMS = [
  { type: 'address', name: 'to' }, 
  { type: 'uint256', name: 'amount' }
];

export async function POST(req: NextRequest) {
  console.log("Payment verification request received");
  
  try {
    const body = await req.json();
    const { txHash, collageId, fromAddress, amount } = body;
    
    console.log("Payment verification data:", { 
      txHash: txHash?.slice(0, 10) + '...', // Only log part of the hash for privacy
      collageId, 
      fromAddress: fromAddress?.slice(0, 10) + '...', 
      amount 
    });

    if (!txHash || !collageId || !fromAddress) {
      console.error("Missing required parameters");
      return NextResponse.json({ success: false, message: 'Missing required parameters' }, { status: 400 });
    }

    // Check if this payment was already processed
    const existingPayment = paymentStore.getPayment(collageId);
    if (existingPayment) {
      console.log("Payment already processed for collageId:", collageId);
      return NextResponse.json({ success: true, message: 'Payment already processed' });
    }

    // For development/testing environments, we'll skip blockchain verification
    // and just accept the payment based on the provided information
    if (process.env.NODE_ENV === 'development' || process.env.SKIP_BLOCKCHAIN_VERIFY === 'true') {
      console.log("Development mode: Skipping blockchain verification");
      
      // Verify amount is sufficient
      if (parseFloat(amount) < parseFloat(MIN_AMOUNT)) {
        console.error(`Insufficient payment. Required: ${MIN_AMOUNT} USDC, Received: ${amount} USDC`);
        return NextResponse.json({ 
          success: false, 
          message: `Insufficient payment. Required: ${MIN_AMOUNT} USDC, Received: ${amount} USDC` 
        }, { status: 400 });
      }
      
      // Store payment data
      paymentStore.savePayment(collageId, {
        txHash,
        fromAddress,
        amount,
        timestamp: Date.now(),
        verified: true
      });
      
      console.log("Development mode: Payment verification successful for collageId:", collageId);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Payment verified successfully (dev mode)',
        amount,
        premium: true
      });
    }
    
    // Production environment: Verify the transaction on-chain
    console.log("Production mode: Verifying transaction on blockchain");
    
    try {
      // Wait for the transaction to be mined and get the receipt
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash: txHash as `0x${string}`,
        timeout: 30000 // 30 seconds timeout
      });
      
      if (!receipt || receipt.status === 'reverted') {
        console.error("Transaction failed or reverted");
        return NextResponse.json({ 
          success: false, 
          message: 'Transaction failed or reverted' 
        }, { status: 400 });
      }
      
      // Get the transaction data
      const transaction = await publicClient.getTransaction({
        hash: txHash as `0x${string}`
      });
      
      // Verify it's a transaction to the USDC contract
      if (transaction.to?.toLowerCase() !== USDC_CONTRACT.toLowerCase()) {
        console.error("Transaction is not to the USDC contract");
        return NextResponse.json({ 
          success: false, 
          message: 'Transaction is not to the USDC contract' 
        }, { status: 400 });
      }
      
      // Manually decode transaction input data
      // First, check if it starts with the transfer selector
      if (!transaction.input.startsWith(TRANSFER_SELECTOR)) {
        console.error("Not a transfer function call");
        return NextResponse.json({ 
          success: false, 
          message: 'Not a transfer function call' 
        }, { status: 400 });
      }
      
      // Extract parameters part (without the function selector)
      const paramsHex = `0x${transaction.input.slice(10)}`;
      
      // Decode parameters
      const decodedParams = decodeAbiParameters(TRANSFER_PARAMS, paramsHex as `0x${string}`);
      const toAddress = decodedParams[0] as string; // First parameter is 'to' address
      const valueRaw = decodedParams[1] as bigint; // Second parameter is amount
      
      // Verify it's a transfer to our receiver address
      if (toAddress.toLowerCase() !== RECEIVER_ADDRESS.toLowerCase()) {
        console.error("Not a transfer to the expected receiver address");
        return NextResponse.json({ 
          success: false, 
          message: 'Not a transfer to the expected receiver address' 
        }, { status: 400 });
      }
      
      // Get the transfer amount (USDC has 6 decimals)
      const transferAmount = formatUnits(valueRaw, 6);
      
      // Verify amount is sufficient
      if (parseFloat(transferAmount) < parseFloat(MIN_AMOUNT)) {
        console.error(`Insufficient payment. Required: ${MIN_AMOUNT} USDC, Received: ${transferAmount} USDC`);
        return NextResponse.json({ 
          success: false, 
          message: `Insufficient payment. Required: ${MIN_AMOUNT} USDC, Received: ${transferAmount} USDC` 
        }, { status: 400 });
      }
      
      // Payment verified, store in database
      paymentStore.savePayment(collageId, {
        txHash,
        fromAddress,
        amount: transferAmount,
        timestamp: Date.now(),
        verified: true
      });
      
      console.log("Payment verification successful for collageId:", collageId);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Payment verified successfully',
        amount: transferAmount,
        premium: true
      });
      
    } catch (verifyError) {
      console.error("Error verifying transaction:", verifyError);
      return NextResponse.json({ 
        success: false, 
        message: 'Error verifying transaction',
        error: verifyError instanceof Error ? verifyError.message : String(verifyError)
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Server error processing payment', 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 