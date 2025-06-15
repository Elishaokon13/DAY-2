"use client";

import { motion } from "framer-motion";
import { Icon } from "./Icon";

interface ShareButtonProps {
  displayName: string;
}

export function ShareButton({ displayName }: ShareButtonProps) {
  const handleShare = async () => {
    // Construct the URL with the creator parameter
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/analytics?creator=${displayName}`;
    const tweetText = `Check out ${displayName}'s creator analytics on Zora! 🎨✨`;
    const twitterIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`;

    // Open Twitter intent in a new window
    window.open(twitterIntent, '_blank', 'width=550,height=420');
  };

  const handleCopy = async () => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/analytics?creator=${displayName}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard!");
    } catch (err) {
      console.error("Error copying to clipboard:", err);
    }
  };

  return (
    <div className="flex gap-2">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleShare}
        className="relative group overflow-hidden rounded-xl bg-[#1DA1F2]/10 border border-[#1DA1F2]/30 hover:border-[#1DA1F2]/50 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] py-3 px-6 font-mono tracking-wider transition-all duration-300 text-sm md:text-base flex items-center gap-2"
      >
        {/* Gradient hover effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1DA1F2]/10 via-transparent to-[#1DA1F2]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Button content */}
        <span className="relative z-10 flex items-center gap-2">
          <Icon 
            name="share" 
            size="sm" 
            className="transition-transform group-hover:scale-110" 
          />
          Share on Twitter
        </span>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleCopy}
        className="relative group overflow-hidden rounded-xl bg-lime-950/30 border border-lime-700/30 hover:border-lime-400/50 hover:bg-lime-900/40 text-lime-400 py-3 px-6 font-mono tracking-wider transition-all duration-300 text-sm md:text-base flex items-center gap-2"
      >
        {/* Gradient hover effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-lime-500/10 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Button content */}
        <span className="relative z-10 flex items-center gap-2">
          <Icon 
            name="share" 
            size="sm" 
            className="transition-transform group-hover:scale-110" 
          />
          Copy Link
        </span>
      </motion.button>
    </div>
  );
}
