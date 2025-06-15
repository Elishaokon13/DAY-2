"use client";
import React from "react";
import { ShareButton } from "./ShareButton";
import { motion } from "framer-motion";

interface FooterButtonsProps {
  onReset: () => void;
  displayName: string;
}

export function FooterButtons({ onReset, displayName }: FooterButtonsProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-center mt-4 mb-6 gap-3 flex-wrap px-2 bg-black/50 backdrop-blur-sm py-4 border-t border-gray-800/30"
    >
      <ShareButton displayName={displayName} />
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onReset}
        className="relative group overflow-hidden rounded-xl bg-black/50 border border-gray-800 hover:border-lime-400/50 text-gray-400 hover:text-lime-400 py-3 px-6 font-mono tracking-wider transition-all duration-300 text-sm md:text-base"
      >
        {/* Gradient hover effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-lime-500/10 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Button content */}
        <span className="relative z-10">Try another handle</span>
      </motion.button>
    </motion.div>
  );
}
