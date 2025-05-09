'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

export default function BalancesTestPage() {
  const [identifier, setIdentifier] = useState<string>('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchAll, setFetchAll] = useState<boolean>(false);

  const fetchBalances = async () => {
    if (!identifier) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/profile-balances?identifier=${encodeURIComponent(identifier)}&fetchAll=${fetchAll}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API response:', data);
      setResults(data);
    } catch (err) {
      console.error('Failed to fetch balances:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBalances();
  };

  // Format currency for display
  const formatBalance = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 6
    }).format(value);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4 text-lime-500 font-mono">ZORA Profile Balances Test</h1>
      
      <Card className="p-6 bg-[#1a1e2e] border border-gray-700 mb-6">
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex gap-2 mb-4">
            <Input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter Zora handle or address"
              className="bg-[#13151F] border-gray-700 text-white"
            />
            <Button 
              type="submit" 
              disabled={loading || !identifier}
              className="bg-lime-900/30 border border-lime-700/50 hover:bg-lime-800/40 text-lime-400 font-mono"
            >
              {loading ? 'Fetching...' : 'Fetch Balances'}
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="fetchAll"
              checked={fetchAll}
              onChange={(e) => setFetchAll(e.target.checked)}
              className="h-4 w-4 rounded border-gray-700 bg-[#13151F] text-lime-500"
            />
            <label htmlFor="fetchAll" className="text-sm text-gray-300">
              Fetch all pages (may take longer)
            </label>
          </div>
        </form>
        
        <div className="text-gray-400 text-sm mb-4">
          <p>Try with:</p>
          <ul className="list-disc list-inside">
            <li>base (Zora handle)</li>
            <li>defidevrelalt (Zora handle)</li>
            <li>0xd91d9de054e294d9bebb7149955457300a9305cc (address)</li>
          </ul>
        </div>
      </Card>
      
      {error && (
        <Card className="p-6 bg-[#1a1e2e] border border-red-700 mb-6">
          <p className="text-red-500">{error}</p>
        </Card>
      )}
      
      {results && (
        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="p-6 bg-[#1a1e2e] border border-gray-700">
            <div className="flex items-start gap-4">
              {results.profile.avatar ? (
                <div className="w-16 h-16 rounded-full overflow-hidden relative">
                  <Image
                    src={results.profile.avatar}
                    alt={results.profile.displayName || results.profile.handle}
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-lime-900/20 flex items-center justify-center">
                  <span className="text-lime-500 text-xl font-bold">
                    {(results.profile.displayName || results.profile.handle)?.charAt(0)?.toUpperCase() || 'Z'}
                  </span>
                </div>
              )}
              
              <div>
                <h2 className="text-xl font-mono text-white">{results.profile.displayName || results.profile.handle}</h2>
                {results.profile.handle && <p className="text-gray-400">@{results.profile.handle}</p>}
                {results.profile.bio && <p className="text-gray-400 mt-2 text-sm">{results.profile.bio}</p>}
              </div>
            </div>
            
            {results.profile.publicWallet && (
              <div className="mt-4">
                <p className="text-gray-400 text-xs font-mono">WALLET</p>
                <p className="text-white text-xs break-all font-mono">{results.profile.publicWallet}</p>
              </div>
            )}
          </Card>
          
          {/* Balances Summary */}
          <Card className="p-6 bg-[#1a1e2e] border border-gray-700">
            <h2 className="text-xl font-mono text-lime-500 mb-6">Balances Summary</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#13151F] p-3 rounded-lg">
                <p className="text-gray-400 text-xs mb-1 font-mono">TOTAL COINS</p>
                <p className="text-lime-400 text-xl font-bold">
                  {results.balances.total}
                </p>
              </div>
              
              <div className="bg-[#13151F] p-3 rounded-lg">
                <p className="text-gray-400 text-xs mb-1 font-mono">CREATED</p>
                <p className="text-white text-xl font-bold">
                  {results.balances.created.count}
                </p>
              </div>
              
              <div className="bg-[#13151F] p-3 rounded-lg">
                <p className="text-gray-400 text-xs mb-1 font-mono">COLLECTED</p>
                <p className="text-white text-xl font-bold">
                  {results.balances.collected.count}
                </p>
              </div>
            </div>
          </Card>
          
          {/* Created Coins */}
          {results.balances.created.count > 0 && (
            <Card className="p-6 bg-[#1a1e2e] border border-gray-700">
              <h2 className="text-xl font-mono text-lime-500 mb-4">Created Coins</h2>
              <div className="space-y-4">
                {results.balances.created.coins.map((balance, index) => (
                  <div key={index} className="bg-[#13151F] p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      {balance.coin.image ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden relative flex-shrink-0">
                          <Image
                            src={balance.coin.image}
                            alt={balance.coin.name || balance.coin.symbol}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-lime-900/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-lime-500 text-sm font-bold">
                            {balance.coin.symbol || 'Z'}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="text-lime-500 font-bold">{balance.coin.name || 'Unnamed Coin'}</h3>
                        <p className="text-gray-400 text-sm">{balance.coin.symbol}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div>
                        <p className="text-gray-400 text-xs">Balance</p>
                        <p className="text-white font-mono">{formatBalance(balance.formattedBalance)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Unique Holders</p>
                        <p className="text-white">{balance.coin.uniqueHolders || '—'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
          
          {/* Collected Coins */}
          {results.balances.collected.count > 0 && (
            <Card className="p-6 bg-[#1a1e2e] border border-gray-700">
              <h2 className="text-xl font-mono text-lime-500 mb-4">Collected Coins</h2>
              <div className="space-y-4">
                {results.balances.collected.coins.slice(0, 10).map((balance, index) => (
                  <div key={index} className="bg-[#13151F] p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      {balance.coin.image ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden relative flex-shrink-0">
                          <Image
                            src={balance.coin.image}
                            alt={balance.coin.name || balance.coin.symbol}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-lime-900/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-lime-500 text-sm font-bold">
                            {balance.coin.symbol || 'Z'}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="text-white font-bold">{balance.coin.name || 'Unnamed Coin'}</h3>
                        <p className="text-gray-400 text-sm">{balance.coin.symbol}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div>
                        <p className="text-gray-400 text-xs">Balance</p>
                        <p className="text-white font-mono">{formatBalance(balance.formattedBalance)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Unique Holders</p>
                        <p className="text-white">{balance.coin.uniqueHolders || '—'}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {results.balances.collected.coins.length > 10 && (
                  <p className="text-gray-400 text-center text-sm italic">
                    Showing 10 of {results.balances.collected.coins.length} collected coins
                  </p>
                )}
              </div>
            </Card>
          )}
          
          {/* Pagination Info */}
          {results.pagination.nextCursor && (
            <Card className="p-4 bg-[#1a1e2e] border border-gray-700">
              <p className="text-gray-400 text-sm">
                More results available. Next cursor: <span className="text-lime-500 font-mono text-xs">{results.pagination.nextCursor}</span>
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
} 