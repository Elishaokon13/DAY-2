'use client';

import { useState, useEffect } from 'react';
import { CreatorEarningsResponse } from '@/app/api/creator-earnings/route';
import Image from 'next/image';

interface CreatorProfileProps {
  handle: string;
}

export function CreatorProfile({ handle }: CreatorProfileProps) {
  const [profileData, setProfileData] = useState<CreatorEarningsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfileData() {
      if (!handle) return;

      setLoading(true);
      setError(null);
      
      try {
        console.log(`CreatorProfile: Fetching profile for ${handle}`);
        // Reuse the creator-earnings API since it already returns profile data
        const response = await fetch(`/api/creator-earnings?handle=${encodeURIComponent(handle)}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching profile data: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`CreatorProfile: Data received:`, data);
        setProfileData(data);
      } catch (err) {
        console.error('Failed to fetch profile data:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchProfileData();
  }, [handle]);

  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  if (loading) {
    return (
      <div className="bg-[#1a1e2e] p-6 rounded-lg border border-gray-700 animate-pulse mb-6">
        <div className="flex items-center space-x-4">
          <div className="h-20 w-20 bg-gray-700 rounded-full shadow-lg flex-shrink-0"></div>
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-gray-700 rounded w-32"></div>
            <div className="h-4 bg-gray-700 rounded w-48"></div>
            <div className="h-4 bg-gray-700 rounded w-64 mt-2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return null; // Don't show anything if there's an error - the rest of the dashboard will still render
  }

  return (
    <div className="bg-gradient-to-r from-[#1a1e2e] to-[#1a1e2e]/90 p-6 rounded-lg border border-gray-700 mb-6">
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        <div className="flex items-start space-x-4">
          {profileData.profileImage ? (
            <div className="h-20 w-20 rounded-full overflow-hidden relative border-2 border-lime-500/30 shadow-lg shadow-lime-500/10 flex-shrink-0">
              <Image 
                src={profileData.profileImage} 
                alt={profileData.displayName} 
                fill
                sizes="80px"
                className="object-cover rounded-full"
              />
            </div>
          ) : (
            <div className="h-20 w-20 rounded-full bg-lime-900/20 flex items-center justify-center border-2 border-lime-500/30 shadow-lg shadow-lime-500/10 flex-shrink-0">
              <span className="text-lime-500 text-2xl font-bold">
                {profileData.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          <div>
            <h2 className="text-2xl text-white font-bold">{profileData.displayName}</h2>
            <p className="text-gray-400 text-sm">@{profileData.profileHandle || handle}</p>
            {profileData.bio && (
              <p className="text-gray-300 mt-2 text-sm">{profileData.bio}</p>
            )}
          </div>
        </div>
        
        <div className="mt-4 md:mt-0 md:ml-auto flex flex-wrap gap-4">
          <div className="bg-[#13151F] p-3 rounded-lg min-w-[120px]">
            <p className="text-gray-400 text-xs mb-1 font-mono">COINS</p>
            <p className="text-white text-xl font-bold">
              {profileData.metrics.posts}
            </p>
          </div>
          
          <div className="bg-[#13151F] p-3 rounded-lg min-w-[120px]">
            <p className="text-gray-400 text-xs mb-1 font-mono">TOTAL EARNED</p>
            <p className="text-lime-400 text-xl font-bold">
              {formatCurrency(profileData.metrics.totalEarnings)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 