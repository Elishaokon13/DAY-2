import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.REDIS_URL || '',
  token: process.env.REDIS_TOKEN || '',
});

export async function GET(req: NextRequest) {
  try {
    const collageId = req.nextUrl.searchParams.get('collageId');
    
    if (!collageId) {
      return NextResponse.json({ success: false, message: 'Missing collageId parameter' }, { status: 400 });
    }
    
    // Check if this collage has been paid for
    const paymentData = await redis.get(`payment:${collageId}`);
    
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