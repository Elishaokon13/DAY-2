"use client";

import { useState, useEffect } from "react";
import { Collage } from "@/components/Collage/Collage";
import { validateHandle } from "@/lib/validateWallet";
import { ZoraTokenResponse, ZoraToken } from "@/app/api/zora-tokens/route";
import { Icon } from "./Icon";
import { FooterButtons } from "./FooterButtons";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export interface ZoraWalletInputProps {
  displayName: string;
  onHandleChange?: (handle: string) => void;
}

export function ZoraWalletInput({
  displayName,
  onHandleChange,
}: ZoraWalletInputProps) {
  const [handle, setHandle] = useState("");
  const [tokens, setTokens] = useState<ZoraToken[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [profileData, setProfileData] = useState<{
    displayName?: string;
    profileImage?: string | null;
    profileHandle?: string | null;
  } | null>(null);

  const [selectedToken, setSelectedToken] = useState<ZoraToken | null>(null);

  // Notify parent when handle changes
  useEffect(() => {
    if (onHandleChange && validateHandle(handle)) {
      onHandleChange(handle);
    }
  }, [handle, onHandleChange]);

  const handleSubmit = async () => {
    const trimmedHandle = handle.trim();

    if (!validateHandle(trimmedHandle)) {
      setError("Please enter a valid Zora handle");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/zora-tokens?handle=${encodeURIComponent(trimmedHandle)}`,
      );
      const data = (await res.json()) as ZoraTokenResponse;
      console.log(JSON.stringify(data, null, 2));

      if (res.status !== 200) {
        setError("Failed to fetch profile data");
        return;
      }

      if (!data.tokens || data.tokens.length === 0) {
        setError("No tokens found for this Zora handle.");
        return;
      }

      setTokens(data.tokens);
      setProfileData({
        displayName: data.displayName,
        profileImage: data.profileImage,
        profileHandle: data.profileHandle,
      });
    } catch (err) {
      console.error(err);
      setError("Failed to fetch tokens. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTokens([]);
    setHandle("");
    setError(null);
    setProfileData(null);
  };

  const router = useRouter();

  const handleClick = () => {
    router.push(`/analytics?creator=${handle}`);
  };

  return (
    <>
      {tokens.length > 0 && profileData ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-black"
        >
          <Collage
            selectedToken={selectedToken}
            setSelectedToken={setSelectedToken}
            tokens={tokens}
            displayName={profileData.displayName || ""}
          />
          <FooterButtons
            onReset={handleReset}
            displayName={profileData.profileHandle || ""}
          />
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <div className="relative z-10 overflow-hidden rounded-2xl bg-gradient-to-b from-[rgba(0,0,0,0.7)] to-[rgba(0,0,0,0.4)] shadow-2xl backdrop-blur-xl border border-gray-800/50">
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-lime-500/10 via-transparent to-purple-500/10 opacity-50"></div>
              
              {/* Glow effects */}
              <div className="absolute -inset-px bg-gradient-to-r from-lime-500/20 to-purple-500/20 blur-sm opacity-20"></div>
              
              {/* Content */}
              <div className="relative p-8 text-center">
                <motion.h2 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-mono text-gray-100 mb-2 bg-clip-text text-transparent bg-gradient-to-r from-lime-400 to-emerald-400"
                >
                  Zora Creator Analytics
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-gray-400 text-sm mb-8 font-mono"
                >
                  {displayName
                    ? `Welcome ${displayName}! Enter a Zora handle to explore creator earnings.`
                    : "Enter a Zora handle to explore creator earnings."}
                </motion.p>

                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className={`relative bg-[#1a1e2e]/80 overflow-hidden rounded-xl backdrop-blur-sm transition-all duration-300 ${
                      isFocused ? "ring-2 ring-lime-500/30 shadow-lg shadow-lime-500/20" : "ring-1 ring-gray-800"
                    }`}
                  >
                    <div className="flex">
                      <div className="bg-[#1a1e2e]/50 py-4 px-4 text-gray-400 font-mono border-r border-gray-800/50">
                        @
                      </div>
                      <input
                        id="zora-handle-input"
                        type="text"
                        value={handle}
                        onChange={(e) => setHandle(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder="zorahandle"
                        className="w-full bg-transparent text-gray-300 py-4 px-6 font-mono tracking-wider focus:outline-none placeholder:text-gray-600"
                      />
                    </div>
                  </motion.div>

                  {error && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-red-400 text-sm text-center font-mono bg-red-500/10 py-2 px-4 rounded-lg border border-red-500/20"
                    >
                      {error}
                    </motion.p>
                  )}

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex gap-4"
                  >
                    <button
                      onClick={handleSubmit}
                      disabled={loading || !validateHandle(handle)}
                      className="flex-1 bg-black/50 border border-gray-800 hover:border-lime-400/50 hover:bg-lime-950/30 text-gray-400 hover:text-lime-400 py-4 font-mono tracking-wider transition-all duration-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-800 disabled:hover:bg-black/50 disabled:hover:text-gray-400"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-lime-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          CHECKING...
                        </span>
                      ) : "GENERATE COLLAGE"}
                    </button>

                    <button
                      onClick={() => handleClick()}
                      disabled={!validateHandle(handle)}
                      className="flex-1 items-center justify-center bg-lime-950/30 border border-lime-700/30 hover:border-lime-400/50 hover:bg-lime-900/40 text-lime-400 py-4 px-4 font-mono tracking-wider transition-all duration-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-lime-700/30 disabled:hover:bg-lime-950/30 flex group"
                    >
                      <Icon name="barChart" size="sm" className="mr-2 transition-transform group-hover:scale-110" />
                      DIRECT ANALYTICS
                    </button>
                  </motion.div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-6 -left-6 w-12 h-12">
                <div className="w-full h-full relative animate-pulse">
                  <div className="absolute inset-0 border border-lime-700/20 rotate-45"></div>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 w-12 h-12">
                <div className="w-full h-full relative animate-pulse">
                  <div className="absolute inset-0 border border-lime-700/20 rotate-45"></div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Display token collage when tokens are loaded */}
          {tokens.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 w-full"
            >
              <h3 className="text-lg font-mono text-gray-300 mb-4 text-center">
                {profileData?.displayName}'s Tokens
              </h3>
              <Collage
                tokens={tokens}
                displayName={profileData?.displayName || ""}
                selectedToken={null}
                setSelectedToken={() => {}}
              />
            </motion.div>
          )}
        </div>
      )}
    </>
  );
}
