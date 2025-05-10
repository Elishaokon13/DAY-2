import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { Redis } from '@upstash/redis';

// Initialize Redis client for storing payment records
const redis = new Redis({
  url: process.env.REDIS_URL || '',
  token: process.env.REDIS_TOKEN || '',
});

// USDC Contract details
const USDC_CONTRACT = '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'; // USDC on Base
const RECEIVER_ADDRESS = '0xYourProjectWalletAddress'; // Replace with your project wallet
const MIN_AMOUNT = '1.0'; // Minimum $1 USDC required

// RPC provider for the Base network
const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { txHash, collageId, fromAddress } = body;

    if (!txHash || !collageId || !fromAddress) {
      return NextResponse.json({ success: false, message: 'Missing required parameters' }, { status: 400 });
    }

    // Check if this payment was already processed
    const existingPayment = await redis.get(`payment:${collageId}`);
    if (existingPayment) {
      return NextResponse.json({ success: true, message: 'Payment already processed' });
    }

    // Wait for transaction receipt (confirmed transaction)
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt || receipt.status === 0) {
      return NextResponse.json({ success: false, message: 'Transaction failed or not found' }, { status: 400 });
    }

    // Get transaction data
    const tx = await provider.getTransaction(txHash);
    
    if (!tx) {
      return NextResponse.json({ success: false, message: 'Transaction not found' }, { status: 400 });
    }

    // Verify it's a USDC transaction to our contract
    if (tx.to?.toLowerCase() !== USDC_CONTRACT.toLowerCase()) {
      return NextResponse.json({ success: false, message: 'Invalid transaction target' }, { status: 400 });
    }

    // Parse transaction input data
    const iface = new ethers.Interface([
      'function transfer(address to, uint256 value) returns (bool)'
    ]);
    
    try {
      const decodedData = iface.parseTransaction({ data: tx.data });
      
      if (!decodedData || decodedData.name !== 'transfer') {
        return NextResponse.json({ success: false, message: 'Not a transfer transaction' }, { status: 400 });
      }
      
      const to = decodedData.args[0].toLowerCase();
      const value = ethers.formatUnits(decodedData.args[1], 6); // USDC has 6 decimals
      
      // Verify receiver address
      if (to !== RECEIVER_ADDRESS.toLowerCase()) {
        return NextResponse.json({ success: false, message: 'Invalid receiver address' }, { status: 400 });
      }
      
      // Verify amount is sufficient
      if (parseFloat(value) < parseFloat(MIN_AMOUNT)) {
        return NextResponse.json({ 
          success: false, 
          message: `Insufficient payment. Required: ${MIN_AMOUNT} USDC, Received: ${value} USDC` 
        }, { status: 400 });
      }
      
      // Payment verified, store in database
      await redis.set(`payment:${collageId}`, {
        txHash,
        fromAddress,
        amount: value,
        timestamp: Date.now(),
        verified: true
      });
      
      // Store user payment history
      await redis.sadd(`user:payments:${fromAddress}`, collageId);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Payment verified successfully',
        amount: value,
        premium: true
      });
      
    } catch (error) {
      console.error('Error decoding transaction:', error);
      return NextResponse.json({ success: false, message: 'Invalid transaction data' }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
} 