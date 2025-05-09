'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { CreatorEarningsResponse } from '@/app/api/creator-earnings/route';
import * as htmlToImage from 'html-to-image';
import { Button } from '../ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ShareableAnalyticsCardProps {
  handle: string;
}

export function ShareableAnalyticsCard({ handle }: ShareableAnalyticsCardProps) {
  const [profileData, setProfileData] = useState<CreatorEarningsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [collectorStats, setCollectorStats] = useState<any>(null);
  const [shareStatus, setShareStatus] = useState<'idle' | 'capturing' | 'uploading' | 'ready' | 'sharing' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imgError, setImgError] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Fetch creator profile and earnings data
  useEffect(() => {
    let isMounted = true;
    async function fetchProfileData() {
      if (!handle) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log(`ShareableAnalyticsCard: Fetching profile for ${handle}`);
        const response = await fetch(`/api/creator-earnings?handle=${encodeURIComponent(handle)}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching profile data: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`ShareableAnalyticsCard: Data received:`, data);
        
        // Only update state if component is still mounted
        if (isMounted) {
          setProfileData(data);
          
          // If there are created coins, fetch collector stats for the first one
          if (data.createdCoins && data.createdCoins.length > 0) {
            fetchCollectorStats(data.createdCoins[0].address);
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile data:', err);
        if (isMounted) {
          setError('Failed to load profile data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    fetchProfileData();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [handle]);

  // Fetch collector stats data
  const fetchCollectorStats = async (coinAddress: string) => {
    try {
      const response = await fetch(`/api/collector-stats?address=${coinAddress}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching collector stats: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Collector stats data:', data);
      setCollectorStats(data);
    } catch (err) {
      console.error('Failed to fetch collector stats:', err);
      // Don't set an error state here, just log the error
      // We'll use fallback values for the chart
    }
  };

  // Format currency for display
  const formatCurrency = (value: number) => {
    // Check if value is a valid number
    if (isNaN(value) || value === undefined) {
      return '$0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Handle image error
  const handleImageError = () => {
    console.log('Image failed to load, using fallback');
    setImgError(true);
  };

  // Download the card as an image
  const downloadImage = async () => {
    if (!cardRef.current) return;
    
    setShareStatus('capturing');
    setErrorMessage(null);
    
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#0f1121',
        style: {
          borderRadius: '8px',
          overflow: 'hidden'
        }
      });
      
      // Create download link
      const link = document.createElement('a');
      link.download = `${handle}-zora-analytics.png`;
      link.href = dataUrl;
      link.click();
      
      setShareStatus('idle');
    } catch (error) {
      console.error("❌ Failed to capture image:", error);
      setShareStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  // Share to Twitter
  const shareToTwitter = async () => {
    if (!cardRef.current || !profileData) return;
    
    setShareStatus('capturing');
    setErrorMessage(null);
    
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#0f1121'
      });
      
      // Upload to server
      setShareStatus('uploading');

      const saveRes = await fetch("/api/save-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          displayName: profileData.displayName || handle,
          imageData: dataUrl 
        }),
      });
  
      if (!saveRes.ok) {
        const errorText = await saveRes.text();
        throw new Error(`Image save failed: ${saveRes.status} - ${errorText}`);
      }
  
      const { blobUrl } = await saveRes.json();
      
      // Open Twitter share dialog
      const text = `Check out my creator analytics on Zora! Not financial advice. Just vibes.`;
      const url = encodeURIComponent(`${process.env.NEXT_PUBLIC_URL || window.location.origin}/frame/${handle}`);
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`;
      
      window.open(twitterUrl, '_blank');
      setShareStatus('idle');
    } catch (error) {
      console.error("❌ Failed to share to Twitter:", error);
      setShareStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  // Share to Warpcast
  const shareToWarpcast = async () => {
    if (!cardRef.current || !profileData) return;
    
    setShareStatus('capturing');
    setErrorMessage(null);
    
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#0f1121'
      });
      
      // Upload to server
      setShareStatus('uploading');

      const saveRes = await fetch("/api/save-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          displayName: profileData.displayName || handle,
          imageData: dataUrl 
        }),
      });
  
      if (!saveRes.ok) {
        const errorText = await saveRes.text();
        throw new Error(`Image save failed: ${saveRes.status} - ${errorText}`);
      }
  
      const { blobUrl } = await saveRes.json();
      
      // Try to use Farcaster SDK if available
      try {
        const sdk = (window as any).farcaster?.sdk;
        if (sdk && sdk.actions && sdk.actions.composeCast) {
          await sdk.actions.composeCast({
            text: "Check out my creator analytics on Zora! Not financial advice. Just vibes.",
            embeds: [`${process.env.NEXT_PUBLIC_URL || window.location.origin}/frame/${handle}`],
          });
        } else {
          // Fallback to Warpcast website
          const text = `Check out my creator analytics on Zora! Not financial advice. Just vibes.`;
          const url = encodeURIComponent(`${process.env.NEXT_PUBLIC_URL || window.location.origin}/frame/${handle}`);
          const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&url=${url}`;
          window.open(warpcastUrl, '_blank');
        }
      } catch (error) {
        console.error("Error using Farcaster SDK:", error);
        // Fallback to Warpcast website
        const text = `Check out my creator analytics on Zora! Not financial advice. Just vibes.`;
        const url = encodeURIComponent(`${process.env.NEXT_PUBLIC_URL || window.location.origin}/frame/${handle}`);
        const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&url=${url}`;
        window.open(warpcastUrl, '_blank');
      }
      
      setShareStatus('idle');
    } catch (error) {
      console.error("❌ Failed to share to Warpcast:", error);
      setShareStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  // Button text based on status
  const getButtonText = (type: 'download' | 'twitter' | 'warpcast') => {
    if (shareStatus !== 'idle' && shareStatus !== 'error') {
      switch (shareStatus) {
        case 'capturing': return 'Capturing...';
        case 'uploading': return 'Uploading...';
        case 'sharing': return 'Opening...';
        default: return 'Please wait...';
      }
    }
    
    switch (type) {
      case 'download': return 'Download Image';
      case 'twitter': return 'Share to Twitter';
      case 'warpcast': return 'Share to Warpcast';
    }
  };

  if (loading) {
    return (
      <div className="bg-[#1a1e2e] p-6 rounded-lg border border-gray-700 animate-pulse mb-6">
        <div className="h-64 bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="bg-[#1a1e2e] p-6 rounded-lg border border-gray-700 mb-6">
        <p className="text-red-500">Could not generate shareable card. Please try again.</p>
      </div>
    );
  }

  // Ensure we have valid numbers for metrics
  const metrics = {
    totalEarnings: Number(profileData.metrics?.totalEarnings) || 0,
    posts: Number(profileData.metrics?.posts) || 0,
    averageEarningsPerPost: Number(profileData.metrics?.averageEarningsPerPost) || 0,
    totalVolume: Number(profileData.metrics?.totalVolume) || 0
  };

  // Prepare chart data for collector stats with fallback values
  const COLORS = ['#10B981', '#6366F1'];
  
  // Default to reasonable values if collector stats aren't available
  const collectorsPercentage = collectorStats?.collectors?.percentage ?? 75;
  const tradersPercentage = collectorStats?.traders?.percentage ?? 25;
  
  const chartData = [
    { name: 'Collectors', value: collectorsPercentage },
    { name: 'Traders', value: tradersPercentage }
  ];

  return (
    <div className="mb-6 space-y-4">
      {/* The actual card that will be captured for sharing */}
      <div 
        ref={cardRef}
        className="bg-gradient-to-r from-[#0f1121] to-[#161a2c] p-6 rounded-lg border border-gray-700 max-w-xl mx-auto"
      >
        {/* Header with Zora branding */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-lime-500 font-bold text-lg font-mono">ZORA ANALYTICS</div>
          <div className="text-gray-400 text-sm">Creator Dashboard</div>
        </div>
        
        {/* Profile section */}
        <div className="flex items-start space-x-4 mb-6">
          {profileData.profileImage && !imgError ? (
            <div className="h-16 w-16 rounded-full overflow-hidden relative border-2 border-lime-500/30 shadow-lg shadow-lime-500/10 flex-shrink-0">
              <Image 
                src={profileData.profileImage} 
                alt={profileData.displayName || handle} 
                fill
                sizes="64px"
                className="object-cover rounded-full"
                onError={handleImageError}
              />
            </div>
          ) : (
            <div className="h-16 w-16 rounded-full bg-lime-900/20 flex items-center justify-center border-2 border-lime-500/30 shadow-lg shadow-lime-500/10 flex-shrink-0">
              <span className="text-lime-500 text-xl font-bold">
                {(profileData.displayName || handle)?.charAt(0)?.toUpperCase() || 'Z'}
              </span>
            </div>
          )}
          
          <div>
            <h2 className="text-xl text-white font-bold">{profileData.displayName || handle}</h2>
            <p className="text-gray-400 text-sm">@{profileData.profileHandle || handle}</p>
          </div>
        </div>
        
        {/* Key metrics grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#13151F] p-3 rounded-lg">
            <p className="text-gray-400 text-xs mb-1 font-mono">TOTAL EARNED</p>
            <p className="text-lime-400 text-xl font-bold">
              {formatCurrency(metrics.totalEarnings)}
            </p>
          </div>
          
          <div className="bg-[#13151F] p-3 rounded-lg">
            <p className="text-gray-400 text-xs mb-1 font-mono">COINS</p>
            <p className="text-white text-xl font-bold">
              {metrics.posts}
            </p>
          </div>
          
          <div className="bg-[#13151F] p-3 rounded-lg">
            <p className="text-gray-400 text-xs mb-1 font-mono">AVG EARNINGS</p>
            <p className="text-lime-400 text-xl font-bold">
              {formatCurrency(metrics.averageEarningsPerPost)}
            </p>
          </div>
          
          <div className="bg-[#13151F] p-3 rounded-lg">
            <p className="text-gray-400 text-xs mb-1 font-mono">TOTAL VOLUME</p>
            <p className="text-white text-xl font-bold">
              {formatCurrency(metrics.totalVolume)}
            </p>
          </div>
        </div>
        
        {/* Pie chart section */}
        <div className="bg-[#13151F] p-4 rounded-lg mb-4">
          <p className="text-gray-400 text-xs mb-2 font-mono">COLLECTOR BREAKDOWN</p>
          <div className="flex items-center">
            <div className="w-24 h-24">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={15}
                    outerRadius={35}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="ml-4">
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 bg-[#10B981] rounded-full mr-2"></div>
                <p className="text-white text-sm">Collectors: {typeof chartData[0].value === 'object' ? (chartData[0].value?.percentage || 0) : chartData[0].value}%</p>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-[#6366F1] rounded-full mr-2"></div>
                <p className="text-white text-sm">Traders: {typeof chartData[1].value === 'object' ? (chartData[1].value?.percentage || 0) : chartData[1].value}%</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-gray-500 text-xs text-center">
          <p>Generated via Zora Analytics Dashboard • {new Date().toLocaleDateString()}</p>
        </div>
      </div>
      
      {/* Share buttons */}
      <div className="flex flex-wrap justify-center gap-3">
        <Button
          onClick={downloadImage}
          disabled={['capturing', 'uploading', 'sharing'].includes(shareStatus)}
          className="bg-gray-800 hover:bg-gray-700 text-white"
          size="sm"
        >
          {getButtonText('download')}
        </Button>
        
        <Button
          onClick={shareToTwitter}
          disabled={['capturing', 'uploading', 'sharing'].includes(shareStatus)}
          className="bg-[#1DA1F2] hover:bg-[#1a94df] text-white"
          size="sm"
        >
          {getButtonText('twitter')}
        </Button>
        
        <Button
          onClick={shareToWarpcast}
          disabled={['capturing', 'uploading', 'sharing'].includes(shareStatus)}
          className="bg-[#8A63D2] hover:bg-[#7d5bc7] text-white"
          size="sm"
        >
          {getButtonText('warpcast')}
        </Button>
      </div>
      
      {errorMessage && (
        <p className="text-red-500 text-xs text-center mt-2">{errorMessage}</p>
      )}
    </div>
  );
} 