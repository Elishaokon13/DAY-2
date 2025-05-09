'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function RewardsTestPage() {
  const [input, setInput] = useState<string>('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRewards = async () => {
    if (!input) return;

    setLoading(true);
    setError(null);
    
    try {
      // Determine if input is an address or handle
      const isAddress = input.startsWith('0x');
      const queryParam = isAddress ? 'address' : 'handle';
      
      const response = await fetch(`/api/creator-rewards?${queryParam}=${encodeURIComponent(input)}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API response:', data);
      setResults(data);
    } catch (err: unknown) {
      console.error('Failed to fetch rewards:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRewards();
  };

  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 6,
      maximumFractionDigits: 6
    }).format(value);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4 text-lime-500 font-mono">ZORA Creator Rewards Test</h1>
      
      <Card className="p-6 bg-[#1a1e2e] border border-gray-700 mb-6">
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter creator address or handle"
            className="bg-[#13151F] border-gray-700 text-white"
          />
          <Button 
            type="submit" 
            disabled={loading || !input}
            className="bg-lime-900/30 border border-lime-700/50 hover:bg-lime-800/40 text-lime-400 font-mono"
          >
            {loading ? 'Fetching...' : 'Fetch Rewards'}
          </Button>
        </form>
        
        <div className="text-gray-400 text-sm mb-4">
          <p>Try with:</p>
          <ul className="list-disc list-inside">
            <li>0xd91d9de054e294d9bebb7149955457300a9305cc (address)</li>
            <li>defidevrelalt (Zora handle)</li>
          </ul>
        </div>
      </Card>
      
      {error && (
        <Card className="p-6 bg-[#1a1e2e] border border-red-700 mb-6">
          <p className="text-red-500">{error}</p>
        </Card>
      )}
      
      {results && (
        <Card className="p-6 bg-[#1a1e2e] border border-gray-700">
          {results.profile && (
            <div className="mb-6">
              <h2 className="text-xl font-mono text-white mb-2">{results.profile.displayName}</h2>
              {results.profile.handle && <p className="text-gray-400">@{results.profile.handle}</p>}
              {results.profile.bio && <p className="text-gray-400 mt-2">{results.profile.bio}</p>}
            </div>
          )}
          
          <div className="mb-6">
            <p className="text-gray-400 text-sm font-mono">ADDRESS</p>
            <p className="text-white text-xs break-all font-mono">{results.address}</p>
          </div>
          
          <h2 className="text-xl font-mono text-lime-500 mb-6">Earnings Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-[#13151F] p-3 rounded-lg">
              <p className="text-gray-400 text-xs mb-1 font-mono">TOTAL EARNINGS</p>
              <p className="text-lime-400 text-xl font-bold">
                {formatCurrency(results.earnings.total)}
              </p>
            </div>
            
            <div className="bg-[#13151F] p-3 rounded-lg">
              <p className="text-gray-400 text-xs mb-1 font-mono">PROTOCOL REWARDS</p>
              <p className="text-white text-xl font-bold">
                {formatCurrency(results.earnings.protocolRewards.total)}
              </p>
            </div>
            
            <div className="bg-[#13151F] p-3 rounded-lg">
              <p className="text-gray-400 text-xs mb-1 font-mono">SECONDARY ROYALTIES</p>
              <p className="text-white text-xl font-bold">
                {formatCurrency(results.earnings.secondaryRoyalties.eth.total)}
              </p>
            </div>
          </div>
          
          <h3 className="text-lg font-mono text-white mb-3">By Network</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-[#13151F] p-4 rounded-lg">
              <h4 className="text-md font-mono text-lime-500 mb-2">Base</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-gray-400 text-xs">Protocol Rewards</p>
                  <p className="text-white">{formatCurrency(results.earnings.protocolRewards.base)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">ETH Royalties</p>
                  <p className="text-white">{formatCurrency(results.earnings.secondaryRoyalties.eth.base)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-[#13151F] p-4 rounded-lg">
              <h4 className="text-md font-mono text-lime-500 mb-2">Zora</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-gray-400 text-xs">Protocol Rewards</p>
                  <p className="text-white">{formatCurrency(results.earnings.protocolRewards.zora)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">ETH Royalties</p>
                  <p className="text-white">{formatCurrency(results.earnings.secondaryRoyalties.eth.zora)}</p>
                </div>
              </div>
            </div>
          </div>
          
          {results.earnings.secondaryRoyalties.erc20.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-mono text-white mb-3">ERC20 Royalties</h3>
              <div className="bg-[#13151F] p-4 rounded-lg">
                <div className="space-y-2">
                  {results.earnings.secondaryRoyalties.erc20.map((token, index) => (
                    <div key={index}>
                      <p className="text-gray-400 text-xs">{token.token}</p>
                      <p className="text-white">{token.amount}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-6">
            <h3 className="text-lg font-mono text-white mb-2">Raw Data</h3>
            <pre className="bg-[#13151F] p-4 rounded-lg overflow-auto text-xs text-gray-300 max-h-96">
              {JSON.stringify(results.rawData, null, 2)}
            </pre>
          </div>
        </Card>
      )}
    </div>
  );
} 