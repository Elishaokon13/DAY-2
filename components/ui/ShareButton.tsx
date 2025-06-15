"use client";

import { motion } from "framer-motion";
import { Icon } from "./Icon";

interface ShareButtonProps {
  displayName: string;
}

export function ShareButton({ displayName }: ShareButtonProps) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayName}'s Zora Analytics`,
          text: `Check out ${displayName}'s creator analytics on Zora!`,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        // You might want to add a toast notification here
        alert("Link copied to clipboard!");
      } catch (err) {
        console.error("Error copying to clipboard:", err);
      }
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleShare}
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
        Share Analytics
      </span>
    </motion.button>
  );
}
