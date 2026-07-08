import React from 'react';
import { motion } from 'motion/react';
import { Word } from '../types';

export function ProgressTab({ words = [], coins = 0, bookName = '六级核心词汇' }: { words?: Word[], coins?: number, bookName?: string }) {
  const matureTrees = words.filter(w => w.familiarity === 3).length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full px-6 py-4"
    >
      <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-6">正在学习</h2>
      
      <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-white/60 mb-6">
        <h3 className="text-lg font-semibold text-slate-800 tracking-wide mb-2">
          {bookName}
        </h3>
        <p className="text-sm text-slate-500 mb-6">已学习 {words.filter(w => w.progress).length} / {words.length} 词</p>
        
        <div className="w-full h-2.5 bg-slate-200/50 rounded-full overflow-hidden mb-3">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${words.length > 0 ? (words.filter(w => w.progress).length / words.length) * 100 : 0}%` }}
            transition={{ duration: 1.5, delay: 0.2, type: 'spring', damping: 20 }}
            className="h-full bg-teal-500 rounded-full"
          />
        </div>
        <div className="flex justify-between text-xs font-semibold text-slate-400">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50/60 backdrop-blur-md rounded-2xl p-5 border border-emerald-100/50 shadow-sm flex flex-col justify-center">
          <span className="text-emerald-700 font-bold text-4xl tracking-tighter mb-1">{matureTrees}</span>
          <span className="text-emerald-600/80 text-sm font-medium">成型树木 (棵)</span>
        </div>
        <div className="bg-amber-50/60 backdrop-blur-md rounded-2xl p-5 border border-amber-100/50 shadow-sm flex flex-col justify-center">
          <span className="text-amber-700 font-bold text-4xl tracking-tighter mb-1">{coins}</span>
          <span className="text-amber-600/80 text-sm font-medium">获取金币 (G)</span>
        </div>
      </div>
    </motion.div>
  );
}
