'use client'

import { useState, useEffect } from 'react'
import { Collage } from '@/components/Collage/Collage'
import { validateHandle } from '@/lib/validateWallet'
import { ZoraTokenResponse, ZoraToken } from '@/app/api/zora-tokens/route'
import { FooterButtons } from '@/components/FooterButtons'
import { Button } from './ui/button'
import { Icon } from './Icon'

export interface ZoraWalletInputProps {
  displayName: string;
  onHandleChange?: (handle: string) => void;
  onViewAnalytics?: (handle: string) => void;
}

export function ZoraWalletInput({ displayName, onHandleChange, onViewAnalytics }: ZoraWalletInputProps) {
  const [handle, setHandle] = useState('')
  const [tokens, setTokens] = useState<ZoraToken[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [profileData, setProfileData] = useState<{
    displayName?: string
    profileImage?: string | null
    profileHandle?: string | null
  } | null>(null)

  const [selectedToken, setSelectedToken] = useState<ZoraToken | null>(null)

  // Notify parent when handle changes
  useEffect(() => {
    if (onHandleChange && validateHandle(handle)) {
      onHandleChange(handle);
    }
  }, [handle, onHandleChange]);

  const handleSubmit = async () => {
    const trimmedHandle = handle.trim()

    if (!validateHandle(trimmedHandle)) {
      setError('Please enter a valid Zora handle')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/zora-tokens?handle=${encodeURIComponent(trimmedHandle)}`)
      const data = await res.json() as ZoraTokenResponse
      console.log(JSON.stringify(data, null, 2))

      if (res.status !== 200) {
        setError( 'Failed to fetch profile data')
        return
      }

      if (!data.tokens || data.tokens.length === 0) {
        setError('No tokens found for this Zora handle.')
        return
      }

      setTokens(data.tokens)
      setProfileData({
        displayName: data.displayName,
        profileImage: data.profileImage,
        profileHandle: data.profileHandle,
      })
    } catch (err) {
      console.error(err)
      setError('Failed to fetch tokens. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setTokens([])
    setHandle('')
    setError(null)
    setProfileData(null)
  }

  if (tokens.length > 0 && profileData) {
    return (
      <div className="w-full bg-black">
        <Collage selectedToken={selectedToken} setSelectedToken={setSelectedToken} tokens={tokens} displayName={profileData.displayName || ''} />
        <FooterButtons onReset={handleReset} displayName={profileData.displayName || ''} />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <div className="relative z-10 overflow-hidden rounded-xl bg-[rgba(0,0,0,0.5)] shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="relative p-8 text-center">
            <h2 className="text-2xl font-mono text-gray-300 mb-2">
              Zora Creator Analytics
            </h2>
            <p className="text-gray-400 text-sm mb-6 font-mono">
              {displayName
                ? `Welcome ${displayName}! Enter a Zora handle to explore creator earnings.`
                : 'Enter a Zora handle to explore creator earnings.'}
            </p>

          <div className="space-y-6">
            <div className={`relative bg-[#1a1e2e] overflow-hidden ${isFocused ? 'ring-1 ring-lime-700/30' : ''}`}>
              <div className="flex">
                <div className="bg-[#1a1e2e] py-4 px-4 text-gray-400 font-mono">@</div>
                <input
                  id="zora-handle-input"
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="zorahandle"
                  className="w-full bg-transparent text-gray-300 py-4 pr-6 font-mono tracking-wider focus:outline-none"
                  style={{ borderLeft: '2px solid rgba(163, 230, 53, 0.3)' }}
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm text-center font-mono">{error}</p>}

            <div className="flex gap-4">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-black border border-gray-700 hover:border-lime-300 text-gray-500 py-4 font-mono tracking-wider transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'CHECKING...' : 'SEARCH TOKENS'}
              </button>
              
              {onViewAnalytics && validateHandle(handle) && (
                <button
                  onClick={() => onViewAnalytics(handle)}
                  className="flex items-center justify-center bg-lime-900/30 border border-lime-700/50 hover:bg-lime-800/40 text-lime-400 py-4 px-4 font-mono tracking-wider transition-colors duration-300"
                >
                  <Icon name="barChart" size="sm" className="mr-2" />
                  ANALYTICS
                </button>
              )}
            </div>
          </div>

         

          {/* Corner decorations */}
          <div className="absolute -top-6 -left-6 w-12 h-12">
            <div className="w-full h-full relative">
              <div className="absolute inset-0 border border-lime-700/40 rotate-45"></div>
            </div>
          </div>

          <div className="absolute -bottom-6 -right-6 w-12 h-12">
            <div className="w-full h-full relative">
              <div className="absolute inset-0 border border-lime-700/40 rotate-45"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Display token collage when tokens are loaded */}
      {tokens.length > 0 && (
        <div className="mt-8 w-full">
          <h3 className="text-lg font-mono text-gray-300 mb-4 text-center">
            {profileData?.displayName}'s Tokens
          </h3>
          <Collage tokens={tokens} profileData={profileData} />
        </div>
      )}
    </div>
  )
}