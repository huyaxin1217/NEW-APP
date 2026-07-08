import React, { useState, useEffect } from 'react';
import { Word } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, Search, Filter, BookOpen, ChevronDown, Check } from 'lucide-react';
import { playAudio } from '../utils/audio';
import { fetchCustomBooks } from '../services/db';

interface CustomBook {
  id: string;
  title: string;
  desc: string;
  wordCount: number;
}

export function A4Tab({ 
  userId,
  words, 
  currentBook, 
  onChangeBook 
}: { 
  userId: string;
  words: Word[];
  currentBook: string;
  onChangeBook: (book: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [hideDefinition, setHideDefinition] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [customBooks, setCustomBooks] = useState<CustomBook[]>([]);

  useEffect(() => {
    const loadBooks = async () => {
      if (!userId) return;
      const books = await fetchCustomBooks(userId);
      setCustomBooks(books);
    };
    loadBooks();
  }, [userId]);

  const getBookTitle = () => {
    if (currentBook === 'CET4') return '四级核心词汇';
    if (currentBook === 'CET6') return '六级核心词汇';
    const matchedCustom = customBooks.find(b => b.id === currentBook);
    return matchedCustom ? matchedCustom.title : '自定义词书';
  };

  const filteredWords = words.filter(w => 
    w.english.toLowerCase().includes(searchTerm.toLowerCase()) || 
    w.definition.includes(searchTerm)
  );

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex justify-between items-center mb-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">A4 泛背</h1>
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-1.5 bg-white/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm hover:bg-white active:scale-95 transition-all cursor-pointer text-sm font-medium text-slate-700"
            >
              <BookOpen className="w-4 h-4 text-teal-500" />
              <span>{getBookTitle()}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsDropdownOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-100 p-1.5 z-40 origin-top-right flex flex-col space-y-0.5 max-h-64 overflow-y-auto"
                  >
                    <button 
                      onClick={() => {
                        onChangeBook('CET4');
                        setIsDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-3.5 py-2 rounded-xl text-left text-sm font-medium transition-colors ${currentBook === 'CET4' ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <span>四级核心词汇</span>
                      {currentBook === 'CET4' && <Check className="w-4 h-4 text-teal-600" />}
                    </button>
                    <button 
                      onClick={() => {
                        onChangeBook('CET6');
                        setIsDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-3.5 py-2 rounded-xl text-left text-sm font-medium transition-colors ${currentBook === 'CET6' ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <span>六级核心词汇</span>
                      {currentBook === 'CET6' && <Check className="w-4 h-4 text-teal-600" />}
                    </button>

                    {customBooks.map(book => (
                      <button 
                        key={book.id}
                        onClick={() => {
                          onChangeBook(book.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`flex items-center justify-between w-full px-3.5 py-2 rounded-xl text-left text-sm font-medium transition-colors ${currentBook === book.id ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        <span className="truncate max-w-[110px]">{book.title}</span>
                        {currentBook === book.id && <Check className="w-4 h-4 text-teal-600 flex-shrink-0" />}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
        <p className="text-sm text-slate-500 mt-1">快速浏览所有单词，提升复习效率。</p>
      </div>

      {/* Controls */}
      <div className="px-6 pb-4 flex items-center space-x-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="搜索单词..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm"
          />
        </div>
        <button 
          onClick={() => setHideDefinition(!hideDefinition)}
          className={`p-2.5 rounded-xl border transition-colors shadow-sm ${hideDefinition ? 'bg-teal-50 border-teal-200 text-teal-600' : 'bg-white border-slate-200 text-slate-600'}`}
          title={hideDefinition ? "显示释义" : "隐藏释义"}
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Word List */}
      <div className="flex-1 overflow-y-auto px-6 pb-24">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 min-h-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            {filteredWords.length === 0 ? (
              <div className="col-span-full py-10 text-center text-slate-400 text-sm">
                没有找到匹配的单词
              </div>
            ) : (
              filteredWords.map((word, index) => (
                <div key={word.id} className="group flex items-start border-b border-slate-50 last:border-0 pb-3">
                  <span className="text-slate-300 text-xs w-6 mt-1 flex-shrink-0">{index + 1}.</span>
                  <div className="flex-1 ml-1 flex flex-col justify-center">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-800 font-semibold">{word.english}</span>
                      <button 
                        onClick={() => playAudio(word.english)}
                        className="text-slate-300 hover:text-teal-500 transition-colors"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                    </div>
                    {!hideDefinition && (
                      <span className="text-slate-500 text-sm mt-0.5">{word.definition}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
