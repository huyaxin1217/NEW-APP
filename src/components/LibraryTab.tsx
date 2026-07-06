import React from 'react';
import { motion } from 'motion/react';
import { Book, CheckCircle } from 'lucide-react';

export function LibraryTab({ currentBook, onChangeBook }: { currentBook: string, onChangeBook: (book: string) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full px-6 py-4"
    >
      <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-6">词书更换</h2>
      
      <div className="space-y-4 overflow-y-auto pb-20 hide-scrollbar">
        <BookCard 
          title="六级核心词汇" 
          desc="CET6 必备单词" 
          isCurrent={currentBook === 'CET6'} 
          onClick={() => onChangeBook('CET6')}
        />
        <BookCard 
          title="四级核心词汇" 
          desc="CET4 必备单词" 
          isCurrent={currentBook === 'CET4'} 
          onClick={() => onChangeBook('CET4')}
        />
      </div>
    </motion.div>
  );
}

function BookCard({ title, desc, isCurrent, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`p-5 rounded-2xl border ${isCurrent ? 'bg-teal-500 text-white border-teal-600 shadow-lg shadow-teal-500/20' : 'bg-white/40 backdrop-blur-xl text-slate-800 border-white/60 shadow-sm'} flex items-center justify-between cursor-pointer hover:scale-[1.02] active:scale-95 transition-all duration-300`}
    >
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-xl ${isCurrent ? 'bg-white/20' : 'bg-white/60 text-teal-600'}`}>
          <Book className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-semibold text-lg tracking-wide">{title}</h3>
          <p className={`text-sm mt-1 ${isCurrent ? 'text-teal-50' : 'text-slate-500'}`}>{desc}</p>
        </div>
      </div>
      {isCurrent && <CheckCircle className="w-6 h-6 text-white" />}
    </div>
  );
}
