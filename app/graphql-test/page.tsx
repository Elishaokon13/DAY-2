'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function GraphQLTestPage() {
  const [creator, setCreator] = useState<string>('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCreatorCoins = async () => {
    if (!creator) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/zora-graphql?creator=${encodeURIComponent(creator)}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API response:', data);
      setResults(data);
    } catch (err) {
      console.error('Failed to fetch creator coins:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCreatorCoins();
  };

  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4 text-lime-500 font-mono">ZORA GraphQL API Test</h1>
      
      <Card className="p-6 bg-[#1a1e2e] border border-gray-700 mb-6">
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <Input
            type="text"
            value={creator}
            onChange={(e) => setCreator(e.target.value)}
            placeholder="Enter creator address or ENS"
            className="bg-[#13151F] border-gray-700 text-white"
          />
          <Button 
            type="submit" 
            disabled={loading || !creator}
            className="bg-lime-900/30 border border-lime-700/50 hover:bg-lime-800/40 text-lime-400 font-mono"
          >
            {loading ? 'Fetching...' : 'Fetch Coins'}
          </Button>
        </form>
        
        <div className="text-gray-400 text-sm mb-4">
          <p>Try with:</p>
          <ul className="list-disc list-inside">
            <li>0xd91d9de054e294d9bebb7149955457300a9305cc (address)</li>
            <li>vitalik.eth (ENS)</li>
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
          <h2 className="text-xl font-mono text-lime-500 mb-6">Found {results.count} creator coins</h2>
          
          {results.count > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#13151F] p-3 rounded-lg">
                  <p className="text-gray-400 text-xs mb-1 font-mono">TOTAL EARNED</p>
                  <p className="text-lime-400 text-xl font-bold">
                    {formatCurrency(results.totalEarnings)}
                  </p>
                </div>
                
                <div className="bg-[#13151F] p-3 rounded-lg">
                  <p className="text-gray-400 text-xs mb-1 font-mono">TOTAL VOLUME</p>
                  <p className="text-white text-xl font-bold">
                    {formatCurrency(results.totalVolume)}
                  </p>
                </div>
              </div>
              
              <h3 className="text-lg font-mono text-white mb-3">Coins</h3>
              <div className="space-y-4">
                {results.tokens.map((token: any, index: number) => (
                  <div key={index} className="bg-[#13151F] p-4 rounded-lg">
                    <p className="text-lime-500 font-bold">{token.name}</p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <p className="text-gray-400 text-xs">Symbol</p>
                        <p className="text-white">{token.symbol}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Network</p>
                        <p className="text-white">{token.network}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Volume</p>
                        <p className="text-white">{formatCurrency(parseFloat(token.totalVolume || '0'))}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Holders</p>
                        <p className="text-white">{token.uniqueHolders}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Created</p>
                        <p className="text-white">{new Date(token.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Earnings (est.)</p>
                        <p className="text-lime-400">{formatCurrency(token.estimatedEarnings)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-400">No creator coins found for this address/ENS.</p>
          )}
          
          <div className="mt-6">
            <h3 className="text-lg font-mono text-white mb-2">Raw Data</h3>
            <pre className="bg-[#13151F] p-4 rounded-lg overflow-auto text-xs text-gray-300 max-h-96">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        </Card>
      )}
    </div>
  );
} 