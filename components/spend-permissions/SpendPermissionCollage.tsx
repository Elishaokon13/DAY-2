"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount, useConnect, useSignTypedData, useChainId } from "wagmi";
import { Hex } from "viem";
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
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const chainId = useChainId();
  const { signTypedDataAsync } = useSignTypedData();
  
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
          userAddress: context.user.username,
        }),
      });
      
      const data = await response.json();
      setHasPermission(data.hasPermission);
    } catch (err) {
      console.error('Failed to check spend permission:', err);
      setDebugInfo(`Error checking permission: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [context?.user?.username]);

  useEffect(() => {
    checkExistingPermission();
    
    const debugEnv = () => {
      const info = [];
      info.push(`FC User: ${context?.user?.username || 'none'}`);
      info.push(`Wallet: ${isConnected ? 'connected' : 'disconnected'}`);
      info.push(`Address: ${address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'none'}`);
      info.push(`Environment: ${typeof window !== 'undefined' ? window.navigator.userAgent.includes('Warpcast') ? 'Warpcast' : 'Browser' : 'SSR'}`);
      
      // Add current network info
      const networkName = chainId === 8453 ? 'Base' : chainId === 37111 ? 'Lens Testnet' : `Chain ${chainId}`;
      info.push(`Network: ${networkName} (${chainId})`);
      
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
    setDebugInfo("Starting Farcaster wallet connection...");

    try {
      // Check if wallet is connected
      if (!isConnected || !address) {
        setDebugInfo("Wallet not connected, attempting to connect...");
        
        if (connectors.length === 0) {
          throw new Error("No wallet connectors available. Please ensure you're using Warpcast.");
        }
        
        // Connect using the Farcaster Mini App connector
        await connect({ connector: connectors[0] });
        setDebugInfo("Wallet connection requested...");
        
        // Wait a moment for connection to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!isConnected || !address) {
          throw new Error("Failed to connect to Farcaster wallet. Please try again.");
        }
      }
      
      const userAddress = address;
      setDebugInfo(`Farcaster wallet connected: ${userAddress.slice(0, 10)}...`);

      // Generate consistent values for both objects
      const currentTime = Math.floor(Date.now() / 1000);
      const endTime = currentTime + 86400 * 365;
      const saltValue = Math.floor(Math.random() * 1000000);

      // Create the spend permission object for the API (with strings)
      const spendPermissionForApi = {
        account: userAddress,
        spender: SPENDER_ADDRESS,
        token: USDC_ADDRESS,
        allowance: SPEND_PERMISSION_CONFIG.allowance.toString(),
        period: SPEND_PERMISSION_CONFIG.period.toString(),
        start: currentTime.toString(),
        end: endTime.toString(),
        salt: saltValue.toString(),
        extraData: "0x" as Hex,
      };

      // Create the spend permission object for signing (with proper types)
      const spendPermissionForSigning = {
        account: userAddress as `0x${string}`,
        spender: SPENDER_ADDRESS,
        token: USDC_ADDRESS,
        allowance: SPEND_PERMISSION_CONFIG.allowance,
        period: Number(SPEND_PERMISSION_CONFIG.period),
        start: currentTime,
        end: endTime,
        salt: BigInt(saltValue),
        extraData: "0x" as `0x${string}`,
      };

      // Check if we're on the correct network (Base mainnet)
      if (chainId !== 8453) {
        throw new Error(`Wrong network detected. Please switch to Base mainnet in your wallet. Current network: ${chainId === 37111 ? 'Lens Testnet' : `Chain ${chainId}`}`);
      }

      setDebugInfo("Requesting signature from Farcaster wallet...");
      
      const signature = await signTypedDataAsync({
        domain: {
          name: "Spend Permission Manager",
          version: "1",
          chainId: 8453,
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
        message: spendPermissionForSigning,
      });
      
      setDebugInfo("Signature obtained, submitting to backend...");
      
      const response = await fetch('/api/spend-permission/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spendPermission: spendPermissionForApi,
          signature,
          userAddress,
          farcasterUsername: context.user.username,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setHasPermission(true);
        setDebugInfo("Spend permission approved successfully!");
      } else {
        throw new Error(result.message || 'Failed to approve spend permission');
      }
    } catch (err: any) {
      console.error('Farcaster wallet connection failed:', err);
      let errorMessage = 'Failed to setup spend permission';
      
      if (err.message?.includes('No wallet connectors available')) {
        errorMessage = 'Farcaster wallet not available. Please ensure you are using Warpcast with wallet enabled.';
      } else if (err.message?.includes('User rejected')) {
        errorMessage = 'Wallet connection was rejected. Please try again and approve the connection.';
      } else if (err.message?.includes('Wrong network detected')) {
        errorMessage = err.message; // Use the specific network error message
      } else if (err.message?.includes('Failed to connect to Farcaster wallet')) {
        errorMessage = 'Failed to connect to Farcaster wallet. Please check your wallet settings and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setDebugInfo(`Error: ${err.message || 'Unknown error'}`);
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

  // Show wallet connection UI if not connected
  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1a1e2e]/80 p-6 rounded-xl border border-gray-800/50 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-mono text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Connect Farcaster Wallet
            </h3>
            <p className="text-gray-400 text-sm">
              Connect your wallet to enable spend permissions
            </p>
          </div>
          <div className="text-2xl">🔗</div>
        </div>

        <button
          onClick={() => connect({ connector: connectors[0] })}
          disabled={connectors.length === 0}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-mono tracking-wider py-3 rounded-xl transition-all duration-300 disabled:opacity-50"
        >
          {connectors.length === 0 ? "No Wallet Available" : "Connect Wallet"}
        </button>

        {debugInfo && (
          <p className="text-blue-400 text-xs mt-2 text-center font-mono">
            DEBUG: {debugInfo}
          </p>
        )}
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
          <h4 className="text-white font-mono mb-3">What you're authorizing:</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-center gap-2">
              <Icon name="check" size="sm" className="text-purple-400" />
              Spend up to 1 USDC for collage generation
            </li>
            <li className="flex items-center gap-2">
              <Icon name="check" size="sm" className="text-purple-400" />
              0.05 USDC per collage (20 collages max)
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