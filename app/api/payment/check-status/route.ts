import { NextRequest, NextResponse } from 'next/server';
import paymentStore from '@/lib/paymentStore';

export async function GET(req: NextRequest) {
  try {
    const collageId = req.nextUrl.searchParams.get('collageId');
    
    if (!collageId) {
      return NextResponse.json({ success: false, message: 'Missing collageId parameter' }, { status: 400 });
    }
    
    // Check if this collage has been paid for
    const paymentData = paymentStore.getPayment(collageId);
    
    return NextResponse.json({ 
      success: true,
      isPaid: Boolean(paymentData),
      data: paymentData || null
    });
    
  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
} 