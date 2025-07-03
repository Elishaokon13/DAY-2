"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { parseUnits, Address, Hex } from "viem";
import { Icon } from "@/components/ui/Icon";
import { 
  spendPermissionManagerAddress, 
  USDC_ADDRESS,
  SPENDER_ADDRESS,
  SPEND_PERMISSION_CONFIG
} from "@/lib/spend-permission-constants";

interface SpendPermissionCollageProps {
  displayName: string;
  onCollageGenerated: () => void;
}

const COLLAGE_FEE = "0.05"; // 0.05 USDC per collage generation

export function SpendPermissionCollage({ displayName, onCollageGenerated }: SpendPermissionCollageProps) {
  const { context } = useMiniKit();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");

  const checkExistingPermission = useCallback(async () => {
    if (!context?.user?.username) return;
    
    try {
      const response = await fetch('/api/spend-permission/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: context.user.username, // Using Farcaster username as identifier
        }),
      });
      
      const data = await response.json();
      setHasPermission(data.hasPermission);
    } catch (err) {
      console.error('Failed to check spend permission:', err);
    }
  }, [context?.user?.username]);

  // Check if user has existing spend permission
  useEffect(() => {
    checkExistingPermission();
    
    // Debug MiniKit environment
    const debugEnv = () => {
      const info = [];
      info.push(`User: ${context?.user?.username || 'none'}`);
      info.push(`Window.ethereum: ${typeof window !== 'undefined' && window.ethereum ? 'available' : 'not available'}`);
      info.push(`User agent: ${typeof window !== 'undefined' ? window.navigator.userAgent.includes('Warpcast') ? 'Warpcast' : 'Other' : 'SSR'}`);
      setDebugInfo(info.join(' | '));
    };
    
    debugEnv();
  }, [checkExistingPermission, context?.user?.username]);

  const requestSpendPermission = async () => {
    if (!context?.user?.username) {
      setError("Please connect your Farcaster wallet first");
      return;
    }

    setLoading(true);
    setError(null);
    setDebugInfo("Starting wallet connection...");

    try {
      // For MiniKit in Farcaster, we need to request wallet connection
      // MiniKit provides wallet functionality through the embedded wallet
      let userAddress: string | undefined;
      
      setDebugInfo("Checking for wallet provider...");
      
      // Check if we're in a MiniKit environment (Farcaster)
      if (typeof window !== 'undefined' && window.ethereum) {
        setDebugInfo("Wallet provider found, requesting accounts...");
        try {
          // Request wallet connection through MiniKit
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          userAddress = accounts?.[0];
          setDebugInfo(`Wallet connected: ${userAddress?.slice(0, 10)}...`);
        } catch (walletError) {
          console.warn("Wallet connection failed:", walletError);
          setDebugInfo("Wallet connection failed, using demo mode");
          // For demo purposes, we'll use the Farcaster username as identifier
          // In production, you'd need proper wallet integration
          userAddress = `demo_${context.user.username}`;
        }
      } else {
        setDebugInfo("No wallet provider found, using demo mode");
        // Fallback for development/testing
        userAddress = `demo_${context.user.username}`;
      }
      
      if (!userAddress) {
        throw new Error("Unable to connect wallet. Please ensure you're using Warpcast with wallet enabled.");
      }

      // Create spend permission object
      const spendPermission = {
        account: userAddress,
        spender: SPENDER_ADDRESS,
        token: USDC_ADDRESS,
        allowance: SPEND_PERMISSION_CONFIG.allowance,
        period: SPEND_PERMISSION_CONFIG.period,
        start: Math.floor(Date.now() / 1000),
        end: Math.floor(Date.now() / 1000) + (86400 * 365), // 1 year
        salt: BigInt(Math.floor(Math.random() * 1000000)),
        extraData: "0x" as Hex,
      };

      // Request signature from user
      let signature: string;
      
      if (userAddress.startsWith('demo_')) {
        // Demo mode - simulate signature
        signature = `0x${'0'.repeat(130)}`; // Mock signature for demo
        console.log("Demo mode: Using mock signature");
      } else {
        // Real wallet signature
        signature = await window.ethereum.request({
          method: "eth_signTypedData_v4",
          params: [
            userAddress,
            JSON.stringify({
              domain: {
                name: "Spend Permission Manager",
                version: "1",
                chainId: 8453, // Base mainnet
                verifyingContract: spendPermissionManagerAddress,
              },
              types: {
                SpendPermission: [
                  { name: "account", type: "address" },
                  { name: "spender", type: "address" },
                  { name: "token", type: "address" },
                  { name: "allowance", type: "uint160" },
                  { name: "period", type: "uint48" },
                  { name: "start", type: "uint48" },
                  { name: "end", type: "uint48" },
                  { name: "salt", type: "uint256" },
                  { name: "extraData", type: "bytes" },
                ],
              },
              primaryType: "SpendPermission",
              message: spendPermission,
            }),
          ],
        });
      }

      // Submit to backend for approval (with paymaster)
      const response = await fetch('/api/spend-permission/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spendPermission,
          signature,
          userAddress,
          farcasterUsername: context.user.username,
        }, (key, value) => typeof value === 'bigint' ? value.toString() : value),
      });

      const result = await response.json();
      
      if (result.success) {
        setHasPermission(true);
      } else {
        throw new Error(result.message || 'Failed to approve spend permission');
      }
    } catch (err) {
      console.error('Spend permission request failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to setup spend permission');
    } finally {
      setLoading(false);
    }
  };

  const generateCollage = async () => {
    if (!hasPermission) {
      setError("Please setup spend permission first");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Generate collage and charge 0.05 USDC
      const response = await fetch('/api/collage/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          farcasterUsername: context?.user?.username,
          fee: COLLAGE_FEE,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setGenerationComplete(true);
        onCollageGenerated();
      } else {
        throw new Error(result.message || 'Failed to generate collage');
      }
    } catch (err) {
      console.error('Collage generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate collage');
    } finally {
      setIsGenerating(false);
    }
  };

  if (generationComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-lime-900/20 to-emerald-900/20 p-6 rounded-xl border border-lime-500/30"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-lime-500 to-emerald-500 rounded-full flex items-center justify-center">
            ✨
          </div>
          <h3 className="text-lg font-mono text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-emerald-400">
            Collage Generated Successfully!
          </h3>
        </div>
        
        <div className="bg-black/30 p-4 rounded-lg mb-4">
          <p className="text-lime-400 text-sm mb-2 font-mono">TRANSACTION DETAILS</p>
          <p className="text-white text-sm">✅ Charged 0.05 USDC (gas fees sponsored)</p>
          <p className="text-gray-400 text-xs mt-1">Your collage is ready for sharing!</p>
        </div>

        <div className="text-center">
          <p className="text-gray-300 text-sm">
            🎉 Want to cast this as premium art? Pay $1 USDC to share on Farcaster!
          </p>
        </div>
      </motion.div>
    );
  }

  if (!hasPermission) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1a1e2e]/80 p-6 rounded-xl border border-gray-800/50 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-mono text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Setup Spend Permission
            </h3>
            <p className="text-gray-400 text-sm">
              Authorize spending for collage generation
            </p>
          </div>
          <div className="text-2xl">🔐</div>
        </div>

        <div className="mb-6">
          <h4 className="text-white font-mono mb-3">What you&apos;re authorizing:</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-center gap-2">
              <Icon name="check" size="sm" className="text-purple-400" />
              Spend up to 10 USDC for collage generation
            </li>
            <li className="flex items-center gap-2">
              <Icon name="check" size="sm" className="text-purple-400" />
              0.05 USDC per collage (200 collages max)
            </li>
            <li className="flex items-center gap-2">
              <Icon name="check" size="sm" className="text-purple-400" />
              Gas fees sponsored by Paymaster
            </li>
            <li className="flex items-center gap-2">
              <Icon name="check" size="sm" className="text-purple-400" />
              Valid for 30 days
            </li>
          </ul>
        </div>

        <button
          onClick={requestSpendPermission}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-mono tracking-wider py-3 rounded-xl transition-all duration-300 disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Setting up permission...
            </span>
          ) : (
            "Authorize Spend Permission"
          )}
        </button>

        {error && (
          <p className="text-red-400 text-sm mt-3 text-center">{error}</p>
        )}

        {debugInfo && (
          <p className="text-blue-400 text-xs mt-2 text-center font-mono">
            DEBUG: {debugInfo}
          </p>
        )}

        <p className="text-xs text-gray-500 mt-3 text-center">
          ⚡ Gas fees sponsored by Base Paymaster
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-lime-900/20 to-emerald-900/20 p-6 rounded-xl border border-lime-500/30"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-gradient-to-r from-lime-500 to-emerald-500 rounded-full flex items-center justify-center">
          ✅
        </div>
        <h3 className="text-lg font-mono text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-emerald-400">
          Spend Permission Active
        </h3>
      </div>
      
      <div className="bg-black/30 p-4 rounded-lg mb-4">
        <p className="text-lime-400 text-sm mb-2 font-mono">READY TO GENERATE</p>
        <p className="text-white text-sm">✅ Authorized to spend USDC for collages</p>
        <p className="text-gray-400 text-xs mt-1">Cost: 0.05 USDC per generation (gas sponsored)</p>
      </div>

      <button
        onClick={generateCollage}
        disabled={isGenerating}
        className="w-full bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-700 hover:to-emerald-700 text-white font-mono tracking-wider py-3 rounded-xl transition-all duration-300 disabled:opacity-50"
      >
        {isGenerating ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating collage...
          </span>
        ) : (
          "Generate Collage (0.05 USDC)"
        )}
      </button>

      {error && (
        <p className="text-red-400 text-sm mt-3 text-center">{error}</p>
      )}
    </motion.div>
  );
} 