'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/Icon';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { parseUnits } from 'viem';

// USDC Contract details (Optimism or Base, depending on Warplet configuration)
const USDC_CONTRACT = '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'; // USDC on Base
const RECEIVER_ADDRESS = '0xYourProjectWalletAddress'; // Replace with your project wallet
const USDC_AMOUNT = '1.0'; // $1 USDC

interface PremiumCastButtonProps {
  collageId: string;
  onPaymentComplete: () => void;
}

export function PremiumCastButton({ collageId, onPaymentComplete }: PremiumCastButtonProps) {
  const { context } = useMiniKit();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);

  // Check if this collage has already been paid for
  useEffect(() => {
    async function checkPaymentStatus() {
      try {
        const response = await fetch(`/api/payment/check-status?collageId=${collageId}`);
        const data = await response.json();
        if (data.isPaid) {
          setIsPaid(true);
        }
      } catch (err) {
        console.error('Failed to check payment status:', err);
      }
    }
    
    checkPaymentStatus();
  }, [collageId]);

  // Handle the USDC payment
  const handlePayment = async () => {
    // Check if connected through Farcaster
    if (!context?.user?.username) {
      setError('Warplet wallet not connected. Please ensure you are using Warpcast.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create payment request
      const amount = parseUnits(USDC_AMOUNT, 6); // USDC has 6 decimals
      
      // For Farcaster frames, use window.ethereum if available
      if (!window.ethereum) {
        throw new Error('No Ethereum provider found. Please use Warpcast.');
      }
      
      // Get the connected address
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts'
      });
      
      const fromAddress = accounts[0];
      
      // Request transaction through Warplet
      const txResponse = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: fromAddress,
          to: USDC_CONTRACT,
          // We'll create a simpler data payload for ERC20 transfer
          data: `0xa9059cbb000000000000000000000000${RECEIVER_ADDRESS.replace(/^0x/, '').toLowerCase()}${amount.toString(16).padStart(64, '0')}`,
        }],
      });

      setTransactionHash(txResponse);
      
      // Verify payment on the server
      const verifyResponse = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          txHash: txResponse,
          collageId,
          fromAddress: fromAddress,
          amount: USDC_AMOUNT
        }),
      });
      
      const verifyData = await verifyResponse.json();
      
      if (verifyData.success) {
        setIsPaid(true);
        onPaymentComplete();
      } else {
        setError(verifyData.message || 'Payment verification failed');
      }
    } catch (err) {
      console.error('Payment failed:', err);
      setError('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isPaid) {
    return (
      <Button 
        className="bg-lime-600 hover:bg-lime-700 text-white w-full flex items-center justify-center"
        onClick={onPaymentComplete}
      >
        <Icon name="check" size="sm" className="mr-2" />
        Premium Activated - Cast Now
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button 
        className="bg-lime-900/80 hover:bg-lime-800 text-white w-full flex items-center justify-center"
        onClick={handlePayment}
        disabled={loading}
      >
        {loading ? (
          <>
            <Icon name="arrowLeft" size="sm" className="mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Icon name="star" size="sm" className="mr-2" />
            Pay $1 USDC to Cast as Art
          </>
        )}
      </Button>
      
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
      
      {transactionHash && !error && !isPaid && (
        <p className="text-amber-500 text-sm">Transaction submitted, waiting for confirmation...</p>
      )}
      
      <p className="text-gray-400 text-xs text-center">
        One-time $1 USDC payment to cast your collage as premium art on Warpcast
      </p>
    </div>
  );
} 