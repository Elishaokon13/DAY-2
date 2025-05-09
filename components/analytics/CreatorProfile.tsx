'use client';

import { useState, useEffect } from 'react';
import { CreatorEarningsResponse } from '@/app/api/creator-earnings/route';
import Image from 'next/image';

interface CreatorProfileProps {
  handle: string;
}

export function CreatorProfile({ handle }: CreatorProfileProps) {
  const [profileData, setProfileData] = useState<{
    displayName: string;
    profileImage: string | null;
    profileHandle: string | null;
    bio?: string;
  } | null>(null);
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
        
        setProfileData({
          displayName: data.displayName,
          profileImage: data.profileImage,
          profileHandle: data.profileHandle,
          // The API doesn't currently return bio, but we can add it in the future
          bio: "Creator on Zora" // Placeholder for now
        });
      } catch (err) {
        console.error('Failed to fetch profile data:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchProfileData();
  }, [handle]);

  if (loading) {
    return (
      <div className="bg-[#1a1e2e] p-6 rounded-lg border border-gray-700 animate-pulse mb-6">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 bg-gray-700 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-5 bg-gray-700 rounded w-32"></div>
            <div className="h-4 bg-gray-700 rounded w-48"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return null; // Don't show anything if there's an error - the rest of the dashboard will still render
  }

  return (
    <div className="bg-[#1a1e2e] p-6 rounded-lg border border-gray-700 mb-6">
      <div className="flex items-start space-x-4">
        {profileData.profileImage ? (
          <div className="h-16 w-16 rounded-full overflow-hidden relative">
            <Image 
              src={profileData.profileImage} 
              alt={profileData.displayName} 
              width={64} 
              height={64}
              className="object-cover"
            />
          </div>
        ) : (
          <div className="h-16 w-16 rounded-full bg-lime-900/20 flex items-center justify-center">
            <span className="text-lime-500 text-xl font-bold">
              {profileData.displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        <div>
          <h2 className="text-xl text-white font-bold">{profileData.displayName}</h2>
          <p className="text-gray-400 text-sm">@{profileData.profileHandle || handle}</p>
          {profileData.bio && (
            <p className="text-gray-300 mt-2 text-sm">{profileData.bio}</p>
          )}
        </div>
      </div>
    </div>
  );
} 