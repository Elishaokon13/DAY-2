'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/Icon';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { parseUnits } from 'viem';

// Add Ethereum provider type
declare global {
  interface Window {
    ethereum?: {
      request: (params: { method: string; params?: any[] }) => Promise<any>;
    };
    // Warpcast environment detection
    isWarpcast?: boolean;
  }
}

// USDC Contract details (Optimism or Base, depending on Warplet configuration)
const USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // Native USDC on Base
const RECEIVER_ADDRESS = '0x1B958A48373109E9146A950a75F5bD25B845143b'; 
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
  const [isWarpcastEnvironment, setIsWarpcastEnvironment] = useState<boolean | null>(null);
  const [walletReady, setWalletReady] = useState<boolean>(Boolean(window.ethereum));

  // Check if we're running in Warpcast environment
  useEffect(() => {
    // Check multiple indicators for Warpcast environment
    const inWarpcast = 
      // User is authenticated via MiniKit Farcaster
      Boolean(context?.user?.username) || 
      // Explicit window.isWarpcast flag
      Boolean(window.isWarpcast) || 
      // Check URL params or mobile app indicators
      window.location.href.includes('warpcast.com') ||
      // Check user agent for Warpcast app
      navigator.userAgent.includes('Warpcast');
    
    console.log("Warpcast environment detection:", { 
      hasUsername: Boolean(context?.user?.username),
      isWarpcast: Boolean(window.isWarpcast),
      urlIncludesWarpcast: window.location.href.includes('warpcast.com'),
      userAgentIndicator: navigator.userAgent.includes('Warpcast'),
      inWarpcast
    });
    
    setIsWarpcastEnvironment(inWarpcast);

    // If we're in Warpcast environment but window.ethereum isn't available yet,
    // poll for it to become available
    if (inWarpcast && !window.ethereum) {
      const checkForWallet = () => {
        if (window.ethereum) {
          console.log("Wallet detected after component mounted");
          setWalletReady(true);
          return true; // Stop polling
        }
        return false; // Continue polling
      };
      
      // Immediately check once
      if (!checkForWallet()) {
        // Start polling every 500ms for up to 10 seconds
        let attempts = 0;
        const maxAttempts = 20; // 10 seconds total (20 * 500ms)
        
        const intervalId = setInterval(() => {
          attempts++;
          if (checkForWallet() || attempts >= maxAttempts) {
            clearInterval(intervalId);
            if (attempts >= maxAttempts && !window.ethereum) {
              console.log("Wallet not detected after maximum attempts");
            }
          }
        }, 500);
        
        // Clean up interval on unmount
        return () => clearInterval(intervalId);
      }
    } else if (window.ethereum) {
      setWalletReady(true);
    }
  }, [context]);

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
      
      // Check for Ethereum provider with improved detection
      if (!window.ethereum) {
        console.log("No window.ethereum found, checking environment:", {
          isWarpcastEnvironment,
          walletReady
        });
        
        // If we're in Warpcast but window.ethereum isn't available yet, it might be a timing issue
        if (isWarpcastEnvironment) {
          setError('Wallet connection is initializing. Please try again in a few seconds.');
        } else {
          setError('No Ethereum provider found. Please ensure you are using Warpcast.');
        }
        setLoading(false);
        return;
      }
      
      // Get the connected address
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts'
      });
      
      const fromAddress = accounts[0];
      console.log("Connected wallet address:", fromAddress);
      
      // Request transaction through Warplet
      console.log("Sending transaction to contract:", USDC_CONTRACT);
      console.log("Receiver address:", RECEIVER_ADDRESS);
      
      // Generate ERC20 transfer data
      const transferData = generateERC20TransferData(RECEIVER_ADDRESS, amount.toString());
      console.log("Transaction data prepared:", transferData.slice(0, 20) + "...");
      
      const txResponse = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: fromAddress,
          to: USDC_CONTRACT,
          data: transferData,
        }],
      });

      console.log("Transaction sent with hash:", txResponse);
      setTransactionHash(txResponse);
      
      // Verify payment on the server
      const verifyResponse = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          txHash: txResponse,
          collageId,
          fromAddress,
          amount: USDC_AMOUNT
        }),
      });
      
      const verifyData = await verifyResponse.json();
      console.log("Payment verification response:", verifyData);
      
      if (verifyData.success) {
        setIsPaid(true);
        onPaymentComplete();
      } else {
        setError(verifyData.message || 'Payment verification failed');
      }
    } catch (err) {
      console.error('Payment failed:', err);
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to generate ERC20 transfer function data
  function generateERC20TransferData(to: string, value: string) {
    // ERC20 transfer function signature: transfer(address,uint256)
    const functionSelector = '0xa9059cbb'; // Function selector for 'transfer(address,uint256)'
    
    // Remove 0x prefix if present and ensure lowercase
    const cleanToAddress = to.replace(/^0x/, '').toLowerCase().padStart(64, '0');
    
    // Convert value to hex and pad to 64 characters
    const hexValue = BigInt(value).toString(16).padStart(64, '0');
    
    // Combine function signature and parameters
    return `0x${functionSelector}${cleanToAddress}${hexValue}`;
  }

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

  // Determine button state and text
  let buttonText = 'Pay $1 USDC to Cast as Art';
  let buttonIcon = 'star';
  let buttonDisabled = loading;
  
  if (loading) {
    buttonText = 'Processing Payment...';
    buttonIcon = 'arrowLeft';
  } else if (isWarpcastEnvironment && !walletReady) {
    buttonText = 'Connecting Wallet...';
    buttonIcon = 'loading';
    buttonDisabled = true;
  }

  return (
    <div className="space-y-2">
      <Button 
        className="bg-lime-900/80 hover:bg-lime-800 text-white w-full flex items-center justify-center"
        onClick={handlePayment}
        disabled={buttonDisabled}
      >
        <Icon 
          name={buttonIcon as any} 
          size="sm" 
          className={`mr-2 ${loading || (isWarpcastEnvironment && !walletReady) ? 'animate-spin' : ''}`} 
        />
        {buttonText}
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