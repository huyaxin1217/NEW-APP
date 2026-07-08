import React from 'react';
import { WordFamiliarity } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface TreeProgressProps {
  familiarity: WordFamiliarity;
}

export function TreeProgress({ familiarity }: TreeProgressProps) {
  // SVG paths for the 4 stages of the tree
  const stages = [
    {
      // Stage 0: Seed/Dirt
      label: '种子期',
      svg: (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
          <path d="M30 80 Q50 90 70 80 Q60 100 40 100 Z" fill="#8B4513" opacity="0.8" />
          <path d="M45 85 Q50 75 55 85 Z" fill="#4ade80" />
        </svg>
      )
    },
    {
      // Stage 1: Sprout
      label: '发芽期',
      svg: (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
          <path d="M30 80 Q50 90 70 80 Q60 100 40 100 Z" fill="#8B4513" opacity="0.8" />
          <path d="M48 85 L50 60 L52 85 Z" fill="#22c55e" />
          <path d="M50 70 Q60 65 65 55 Q55 60 50 65 Z" fill="#4ade80" />
          <path d="M50 75 Q40 70 35 60 Q45 65 50 70 Z" fill="#4ade80" />
        </svg>
      )
    },
    {
      // Stage 2: Sapling
      label: '成长期',
      svg: (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          <path d="M45 90 L50 40 L55 90 Z" fill="#78350f" />
          <circle cx="50" cy="45" r="20" fill="#22c55e" opacity="0.9" />
          <circle cx="40" cy="50" r="15" fill="#4ade80" opacity="0.9" />
          <circle cx="60" cy="50" r="15" fill="#16a34a" opacity="0.9" />
          <circle cx="50" cy="30" r="12" fill="#4ade80" opacity="0.8" />
        </svg>
      )
    },
    {
      // Stage 3: Mature Tree
      label: '完全体',
      svg: (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
          <path d="M42 90 Q50 30 50 30 Q50 30 58 90 Z" fill="#713f12" />
          <path d="M50 50 Q65 40 75 25" stroke="#713f12" strokeWidth="4" fill="none" />
          <path d="M50 60 Q35 50 25 35" stroke="#713f12" strokeWidth="4" fill="none" />
          
          <circle cx="50" cy="35" r="30" fill="#15803d" />
          <circle cx="30" cy="45" r="20" fill="#22c55e" />
          <circle cx="70" cy="45" r="20" fill="#16a34a" />
          <circle cx="40" cy="20" r="18" fill="#4ade80" />
          <circle cx="60" cy="25" r="15" fill="#22c55e" />
        </svg>
      )
    }
  ];

  const stageIndex = Math.min(stages.length - 1, Math.max(0, typeof familiarity === 'number' ? familiarity : 0));
  const currentStage = stages[stageIndex];

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-24 h-24 mb-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={stageIndex}
            initial={{ scale: 0.5, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute inset-0"
          >
            {currentStage.svg}
          </motion.div>
        </AnimatePresence>
      </div>
      <motion.div 
        key={`label-${stageIndex}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xs font-medium text-emerald-700/70 bg-emerald-100/50 px-2 py-1 rounded-full backdrop-blur-sm"
      >
        {currentStage.label}
      </motion.div>
    </div>
  );
}
