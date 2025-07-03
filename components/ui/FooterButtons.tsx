"use client";
import React, { useState } from "react";
import { ShareButton } from "./ShareButton";
import { SpendPermissionCollage } from "../spend-permissions/SpendPermissionCollage";
import { motion } from "framer-motion";

interface FooterButtonsProps {
  onReset: () => void;
  displayName: string;
}

export function FooterButtons({ onReset, displayName }: FooterButtonsProps) {
  const [showSpendPermission, setShowSpendPermission] = useState(false);
  const [collageGenerated, setCollageGenerated] = useState(false);

  const handleCollageGenerated = () => {
    setCollageGenerated(true);
    setShowSpendPermission(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 mt-4 mb-6 px-2 bg-black/50 backdrop-blur-sm py-4 border-t border-gray-800/30"
    >
      {/* Spend Permission Section */}
      {showSpendPermission && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <SpendPermissionCollage 
            displayName={displayName}
            onCollageGenerated={handleCollageGenerated}
          />
        </motion.div>
      )}

      {/* Button Row */}
      <div className="flex justify-center gap-3 flex-wrap">
        {/* Generate with Spend Permission Button */}
        {!showSpendPermission && !collageGenerated && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowSpendPermission(true)}
            className="relative group overflow-hidden rounded-xl bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-600 hover:to-pink-600 text-white py-3 px-6 font-mono tracking-wider transition-all duration-300 text-sm md:text-base border border-purple-500/30"
          >
            {/* Gradient hover effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-transparent to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Button content */}
            <span className="relative z-10 flex items-center gap-2">
              🚀 Generate with Spend Permission
            </span>
          </motion.button>
        )}

        {/* Success state after generation */}
        {collageGenerated && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-lime-900/30 to-emerald-900/30 border border-lime-500/30 rounded-xl py-3 px-6 text-center"
          >
            <span className="text-lime-400 font-mono text-sm">
              ✅ Generated with 0.05 USDC (gas sponsored)
            </span>
          </motion.div>
        )}

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
      </div>
    </motion.div>
  );
}
