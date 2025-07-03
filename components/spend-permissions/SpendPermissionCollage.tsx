"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAccount, useConnect, useSignTypedData, useChainId } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { Address, Hex } from "viem";
import { Icon } from "@/components/ui/Icon";
import { 
  spendPermissionManagerAddress, 
  spendPermissionManagerAbi,
  USDC_ADDRESS,
  SPENDER_ADDRESS,
  SPEND_PERMISSION_CONFIG
} from "@/lib/spend-permission-constants";

interface SpendPermissionCollageProps {
  displayName: string;
  onCollageGenerated: () => void;
}

export function SpendPermissionCollage({ displayName, onCollageGenerated }: SpendPermissionCollageProps) {
  const [isDisabled, setIsDisabled] = useState(false);
  const [signature, setSignature] = useState<Hex>();
  const [spendPermission, setSpendPermission] = useState<{
    account: Address;
    spender: Address;
    token: Address;
    allowance: bigint;
    period: number;
    start: number;
    end: number;
    salt: bigint;
    extraData: Hex;
  }>();
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");

  const { signTypedDataAsync } = useSignTypedData();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors } = useConnect();

  const { data: collageData, refetch } = useQuery({
    queryKey: ["generateCollage"],
    queryFn: handleGenerateCollage,
    refetchOnWindowFocus: false,
    enabled: !!signature,
  });

  useEffect(() => {
    const debugEnv = () => {
      const info = [];
      info.push(`Wallet: ${isConnected ? 'connected' : 'disconnected'}`);
      info.push(`Address: ${address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'none'}`);
      info.push(`Environment: ${typeof window !== 'undefined' ? window.navigator.userAgent.includes('Warpcast') ? 'Warpcast' : 'Browser' : 'SSR'}`);
      
      const networkName = chainId === 8453 ? 'Base' : `Unsupported Chain ${chainId}`;
      info.push(`Network: ${networkName} (${chainId})`);
      
      setDebugInfo(info.join(' | '));
    };
    
    debugEnv();
  }, [address, isConnected, chainId]);

  async function handleSubmit() {
    setIsDisabled(true);
    setError(null);
    
    let accountAddress = address;
    if (!accountAddress) {
      try {
        await connect({
          connector: connectors[0],
        });
        // Wait for connection to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        accountAddress = address;
        if (!accountAddress) {
          throw new Error("Failed to get account address after connection");
        }
      } catch (err) {
        setError("Failed to connect wallet");
        setIsDisabled(false);
        return;
      }
    }

    // Check if we're on the correct network (Base mainnet)
    if (chainId !== 8453) {
      setError(`Wrong network detected. Please switch to Base mainnet in your wallet. Current network: Chain ${chainId}`);
      setIsDisabled(false);
      return;
    }

    const spendPermission = {
      account: accountAddress as Address,
      spender: SPENDER_ADDRESS,
      token: USDC_ADDRESS,
      allowance: SPEND_PERMISSION_CONFIG.allowance,
      period: Number(SPEND_PERMISSION_CONFIG.period),
      start: 0, // Start immediately
      end: 281474976710655, // max uint48
      salt: BigInt(0),
      extraData: "0x" as Hex,
    };

    try {
      const signature = await signTypedDataAsync({
        domain: {
          name: "Spend Permission Manager",
          version: "1",
          chainId: chainId,
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
      });
      
      setSpendPermission(spendPermission);
      setSignature(signature);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to sign spend permission");
    }
    setIsDisabled(false);
  }

  async function handleGenerateCollage() {
    if (!address || !displayName || !spendPermission || !signature) {
      throw new Error("Missing required data");
    }
    
    try {
      // Step 1: Approve spend permission with paymaster (gas-free for user)
      console.log("Approving spend permission with paymaster sponsorship...");
      
      const replacer = (key: string, value: any) => {
        if (typeof value === "bigint") {
          return value.toString();
        }
        return value;
      };
      
      const approvalResponse = await fetch("/api/spend-permission/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          {
            spendPermission,
            signature,
            userAddress: address,
            farcasterUsername: displayName,
          },
          replacer
        ),
      });
      
      if (!approvalResponse.ok) {
        const errorText = await approvalResponse.text();
        console.error("Approval API Error Response:", errorText);
        throw new Error(`Approval failed: ${approvalResponse.status} - ${errorText}`);
      }
      
      const approvalResult = await approvalResponse.json();
      console.log("Spend permission approved with paymaster:", approvalResult);
      
      if (!approvalResult.success) {
        throw new Error(approvalResult.message || "Failed to approve spend permission");
      }

      // Step 2: Generate the collage with USDC payment
      console.log("Generating collage with USDC payment...");
      const collageResponse = await fetch('/api/collage/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          farcasterUsername: displayName,
          fee: "0.05",
          userAddress: address,
          spendPermission: JSON.stringify(spendPermission, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
          ),
          signature,
        }),
      });

      const collageResult = await collageResponse.json();
      console.log("Collage generation result:", collageResult);
      
      if (!collageResult.success) {
        throw new Error(collageResult.message || "Failed to generate collage");
      }

      onCollageGenerated();
      return collageResult;
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to generate collage");
      throw e;
    }
  }

  // Show success state if collage was generated
  if (collageData?.success) {
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
          <p className="text-lime-400 text-sm mb-2 font-mono">PAYMENT BREAKDOWN</p>
          <p className="text-white text-sm">✅ Approval: Gas fees sponsored by paymaster</p>
          <p className="text-white text-sm">✅ Collage: 0.05 USDC (from spend permission)</p>
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

  // Show spend permission setup if no signature
  if (!signature) {
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
              Gas fees sponsored by paymaster (completely free)
            </li>
            <li className="flex items-center gap-2">
              <Icon name="check" size="sm" className="text-purple-400" />
              Valid for 30 days
            </li>
          </ul>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isDisabled}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-mono tracking-wider py-3 rounded-xl transition-all duration-300 disabled:opacity-50"
        >
          {isDisabled ? (
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

  // Show collage generation UI if signature exists
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
        onClick={() => refetch()}
        disabled={!signature || isDisabled}
        className="w-full bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-700 hover:to-emerald-700 text-white font-mono tracking-wider py-3 rounded-xl transition-all duration-300 disabled:opacity-50"
      >
        {isDisabled ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          "Generate Collage (0.05 USDC + Free Gas)"
        )}
      </button>

      {error && (
        <p className="text-red-400 text-sm mt-3 text-center">{error}</p>
      )}
    </motion.div>
  );
}