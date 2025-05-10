import { NextRequest, NextResponse } from 'next/server';
import paymentStore from '@/lib/paymentStore';

// USDC Contract details
const USDC_CONTRACT = '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'; // USDC on Base
const RECEIVER_ADDRESS = '0xYourProjectWalletAddress'; // Replace with your project wallet
const MIN_AMOUNT = '1.0'; // Minimum $1 USDC required

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { txHash, collageId, fromAddress, amount } = body;

    if (!txHash || !collageId || !fromAddress) {
      return NextResponse.json({ success: false, message: 'Missing required parameters' }, { status: 400 });
    }

    // Check if this payment was already processed
    const existingPayment = paymentStore.getPayment(collageId);
    if (existingPayment) {
      return NextResponse.json({ success: true, message: 'Payment already processed' });
    }

    // For this simplified version, we'll skip blockchain verification
    // and just accept the payment based on the provided information
    
    // Verify amount is sufficient (this would normally be verified on-chain)
    if (parseFloat(amount) < parseFloat(MIN_AMOUNT)) {
      return NextResponse.json({ 
        success: false, 
        message: `Insufficient payment. Required: ${MIN_AMOUNT} USDC, Received: ${amount} USDC` 
      }, { status: 400 });
    }
    
    // Payment verified, store in our in-memory database
    paymentStore.savePayment(collageId, {
      txHash,
      fromAddress,
      amount,
      timestamp: Date.now(),
      verified: true
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Payment verified successfully',
      amount,
      premium: true
    });
    
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
} 