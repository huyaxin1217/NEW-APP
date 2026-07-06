import React, { useState, useEffect } from 'react';
import { Word, WordFamiliarity, PetOutfit } from '../types';
import { TreeProgress } from './TreeProgress';
import { Pet } from './Pet';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, Shirt, Sparkles, Loader2, Volume2, ChevronDown, Check } from 'lucide-react';
import { updateWordProgress, updateWordData } from '../services/db';
import { playAudio } from '../utils/audio';

interface ReviewTabProps {
  outfit: PetOutfit;
  onOpenDressUp: () => void;
  onAddCoins: (amount: number) => void;
  words: Word[];
  userId: string | null;
  onWordReviewed: (updatedWord: Word) => void;
}

export function ReviewTab({ outfit, onOpenDressUp, onAddCoins, words, userId, onWordReviewed }: ReviewTabProps) {
  const [queue, setQueue] = useState<Word[]>([]);
  const [showDefinition, setShowDefinition] = useState(false);
  const [idleTime, setIdleTime] = useState(0);
  const [isGeneratingInfo, setIsGeneratingInfo] = useState(false);
  const [isEnrichingCurrentWord, setIsEnrichingCurrentWord] = useState(false);
  const [studyMode, setStudyMode] = useState<'flashcard' | 'choice' | 'spelling'>('flashcard');
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);

  // Choice Mode State
  const [choiceOptions, setChoiceOptions] = useState<string[]>([]);
  const [choiceStatus, setChoiceStatus] = useState<{[key: string]: 'correct' | 'wrong'}>({});

  // Spelling Mode State
  const [spellingInput, setSpellingInput] = useState('');
  const [spellingStatus, setSpellingStatus] = useState<'typing' | 'correct' | 'wrong'>('typing');

  useEffect(() => {
    if (queue.length === 0 && words.length > 0) {
      setQueue(words);
    }
  }, [words]);

  const currentWord = queue[0];

  // Auto-enrich word when encountered if it is marked as pending
  useEffect(() => {
    if (currentWord && (currentWord.isPending || currentWord.phonetic === '/pending/') && !isEnrichingCurrentWord) {
      const autoEnrich = async () => {
        setIsEnrichingCurrentWord(true);
        try {
          const res = await fetch('/api/lookup-words', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ words: [currentWord.english] })
          });
          if (res.ok) {
            const data = await res.json();
            const result = data[0];
            if (result && result.english) {
              const updatedWord: Word = {
                ...currentWord,
                phonetic: result.phonetic || '/unknown/',
                definition: result.definition || 'n. 暂无释义',
                exampleEn: result.exampleEn || 'Standard dictionary sentence.',
                exampleZh: result.exampleZh || '标准字典释义。',
                isPending: false
              };
              
              // Update state
              setQueue(prev => prev.map(w => w.id === currentWord.id ? updatedWord : w));
              
              // Cache to global DB
              await updateWordData(currentWord.id, {
                phonetic: updatedWord.phonetic,
                definition: updatedWord.definition,
                exampleEn: updatedWord.exampleEn,
                exampleZh: updatedWord.exampleZh,
                isPending: false
              });

              // Inform parent
              onWordReviewed(updatedWord);
            }
          }
        } catch (err) {
          console.error("Auto enrichment failed:", err);
        } finally {
          setIsEnrichingCurrentWord(false);
        }
      };
      autoEnrich();
    }
  }, [currentWord?.id, currentWord?.isPending, currentWord?.phonetic, isEnrichingCurrentWord]);

  useEffect(() => {
    if (currentWord && !showDefinition && !currentWord.isPending && currentWord.phonetic !== '/pending/') {
      playAudio(currentWord.english);
    }
  }, [currentWord?.id, showDefinition, currentWord?.isPending]);

  useEffect(() => {
    const timer = setInterval(() => {
      setIdleTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const resetIdle = () => setIdleTime(0);

  useEffect(() => {
    if (studyMode === 'choice' && currentWord && words.length > 0) {
      const allOtherDefs = Array.from(new Set(words.filter(w => w.id !== currentWord.id && w.definition !== currentWord.definition).map(w => w.definition)));
      const shuffledOthers = [...allOtherDefs].sort(() => Math.random() - 0.5);
      const options = [currentWord.definition, ...shuffledOthers.slice(0, 3)].sort(() => Math.random() - 0.5);
      setChoiceOptions(options);
      setChoiceStatus({});
    }
  }, [currentWord?.id, studyMode, words]);

  const handleChoiceSelect = (def: string) => {
    if (Object.keys(choiceStatus).length > 0) return; // already answered
    if (def === currentWord.definition) {
      setChoiceStatus({ [def]: 'correct' });
      handleAction('know');
    } else {
      setChoiceStatus({ [def]: 'wrong', [currentWord.definition]: 'correct' });
      handleAction('forgot');
    }
  };

  useEffect(() => {
    setSpellingInput('');
    setSpellingStatus('typing');
  }, [currentWord?.id, studyMode]);

  const handleSpellingSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (spellingStatus !== 'typing') return;
    if (spellingInput.trim().toLowerCase() === currentWord.english.toLowerCase()) {
      setSpellingStatus('correct');
      handleAction('know');
    } else {
      setSpellingStatus('wrong');
    }
  };

  const generateExample = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentWord || isGeneratingInfo) return;
    setIsGeneratingInfo(true);
    resetIdle();
    
    try {
      const res = await fetch('/api/generate-example', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: currentWord.english })
      });
      if (res.ok) {
        const data = await res.json();
        
        // Update local state
        const updatedWord = { ...currentWord, exampleEn: data.exampleEn, exampleZh: data.exampleZh };
        setQueue(prev => [updatedWord, ...prev.slice(1)]);
        
        // Update global DB
        await updateWordData(currentWord.id, { exampleEn: data.exampleEn, exampleZh: data.exampleZh });
      }
    } catch (e) {
      console.error("Failed to generate example:", e);
    } finally {
      setIsGeneratingInfo(false);
    }
  };

  const handleAction = async (action: 'forgot' | 'vague' | 'know') => {
    resetIdle();
    
    if (userId && currentWord) {
      const prevFam = currentWord.progress?.familiarity || 0;
      const newProg = await updateWordProgress(userId, currentWord.id, action, currentWord.progress);
      
      if (action === 'know') {
        onAddCoins(10);
      }
      
      const updatedWord = { ...currentWord, familiarity: newProg.familiarity as WordFamiliarity, progress: newProg };

      setTimeout(() => {
        setShowDefinition(false);
        if (action === 'know') {
           onWordReviewed(updatedWord);
           setQueue(prev => prev.slice(1));
        } else {
           setQueue(prev => [...prev.slice(1), updatedWord]);
        }
      }, 600);
    }
  };

  if (!currentWord) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500 font-medium">今天的复习词汇已经复习完啦！</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full px-6"
      onClick={resetIdle}
    >
      <div className="flex items-center justify-between mb-2 mt-4">
        <div className="flex items-center space-x-3">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">今日复习</h2>
          <div className="relative z-30">
            <button 
              onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
              className="flex items-center space-x-1.5 bg-white/70 backdrop-blur-sm border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold px-2.5 py-1.5 rounded-xl cursor-pointer hover:bg-white transition-colors shadow-sm"
            >
              <span>
                {studyMode === 'flashcard' && '快速认读'}
                {studyMode === 'choice' && '释义选择'}
                {studyMode === 'spelling' && '拼写听写'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${isModeDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isModeDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsModeDropdownOpen(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 mt-1.5 w-36 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-100 p-1.5 z-30 origin-top-left flex flex-col space-y-0.5"
                >
                  <button 
                    onClick={() => {
                      setStudyMode('flashcard');
                      setIsModeDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-1.5 rounded-xl text-left text-xs sm:text-sm font-medium transition-colors ${studyMode === 'flashcard' ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span>快速认读</span>
                    {studyMode === 'flashcard' && <Check className="w-4 h-4 text-teal-600" />}
                  </button>
                  <button 
                    onClick={() => {
                      setStudyMode('choice');
                      setIsModeDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-1.5 rounded-xl text-left text-xs sm:text-sm font-medium transition-colors ${studyMode === 'choice' ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span>释义选择</span>
                    {studyMode === 'choice' && <Check className="w-4 h-4 text-teal-600" />}
                  </button>
                  <button 
                    onClick={() => {
                      setStudyMode('spelling');
                      setIsModeDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-1.5 rounded-xl text-left text-xs sm:text-sm font-medium transition-colors ${studyMode === 'spelling' ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span>拼写听写</span>
                    {studyMode === 'spelling' && <Check className="w-4 h-4 text-teal-600" />}
                  </button>
                </motion.div>
              </>
            )}
          </div>
        </div>
        <span className="text-sm font-medium text-teal-600 bg-teal-50 px-3 py-1 rounded-full">剩余 {queue.length}</span>
      </div>

      {/* Tree Progress */}
      <div className="h-28 flex items-center justify-center mb-2">
        <TreeProgress familiarity={currentWord.familiarity} />
      </div>

      {/* Word Card - Generic Liquid Glass */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentWord.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="flex-1 flex flex-col min-h-0"
        >
          <div 
            onClick={() => { if (studyMode === 'flashcard' && !isEnrichingCurrentWord) { setShowDefinition(true); resetIdle(); } }}
            className={`flex-1 bg-white/40 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_32px_rgba(31,38,135,0.05)] border border-white/60 flex flex-col items-center justify-center relative overflow-hidden group ${studyMode === 'flashcard' && !isEnrichingCurrentWord ? 'cursor-pointer' : ''}`}
          >
            {isEnrichingCurrentWord ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
                <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
                <h3 className="text-xl font-bold text-slate-800 tracking-wide">{currentWord.english}</h3>
                <p className="text-sm font-semibold text-slate-500 max-w-xs leading-relaxed">AI 正在为您即时释义、精校发音，并定制精美例句...</p>
                <div className="bg-teal-50 text-teal-600 text-[10px] font-bold px-3 py-1.5 rounded-full border border-teal-100 flex items-center space-x-1 mt-2 animate-pulse">
                  <span>首次触发 AI 解析中</span>
                </div>
              </div>
            ) : studyMode === 'flashcard' && (
              <>
                <div className="flex items-center justify-center space-x-3 mb-3">
                  <h2 className="text-4xl font-bold text-slate-800 tracking-wide text-center break-words">{currentWord.english}</h2>
                  <button 
                    onClick={(e) => { e.stopPropagation(); playAudio(currentWord.english); }}
                    className="p-2 text-teal-600 hover:bg-teal-50 rounded-full transition-colors"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-teal-600/70 font-mono text-sm mb-6 text-center">{currentWord.phonetic}</p>

                {!showDefinition ? (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/20 backdrop-blur-sm">
                      <div className="flex items-center text-teal-700 bg-white/80 px-6 py-3 rounded-2xl shadow-sm border border-white/50">
                        <Eye className="w-5 h-5 mr-2" /> <span>点击查看释义</span>
                      </div>
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col items-center w-full overflow-y-auto max-h-[180px] sm:max-h-[260px] pr-1"
                    >
                      <p className="text-base sm:text-lg font-medium text-slate-700 mb-4 sm:mb-6 text-center leading-relaxed break-words">{currentWord.definition}</p>
                      <div className="w-2/3 h-px bg-gradient-to-r from-transparent via-teal-200/50 to-transparent mb-4 sm:mb-6"></div>
                      <div className="text-left w-full text-xs sm:text-sm text-slate-600 space-y-2.5">
                        {currentWord.exampleEn ? (
                          <>
                            <p className="text-slate-500 font-medium leading-relaxed break-words">"{currentWord.exampleEn}"</p>
                            <p className="text-slate-600 leading-relaxed break-words">{currentWord.exampleZh}</p>
                          </>
                        ) : (
                          <button 
                            onClick={generateExample}
                            disabled={isGeneratingInfo}
                            className="flex items-center text-teal-600 font-medium hover:text-teal-700 transition-colors bg-teal-50/50 px-4 py-2 rounded-xl mx-auto"
                          >
                            {isGeneratingInfo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                            {isGeneratingInfo ? "生成中..." : "AI 生成例句"}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
              </>
            )}

            {studyMode === 'choice' && (
              <div className="flex flex-col items-center justify-center w-full h-full">
                <div className="flex items-center justify-center space-x-3 mb-3">
                  <h2 className="text-4xl font-bold text-slate-800 tracking-wide text-center break-words">{currentWord.english}</h2>
                  <button 
                    onClick={(e) => { e.stopPropagation(); playAudio(currentWord.english); }}
                    className="p-2 text-teal-600 hover:bg-teal-50 rounded-full transition-colors"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-teal-600/70 font-mono text-sm mb-8 text-center">{currentWord.phonetic}</p>
                
                <div className="w-full space-y-3">
                  {choiceOptions.map((opt, i) => {
                    const originalWord = words.find(w => w.definition === opt)?.english;
                    return (
                      <button
                        key={i}
                        onClick={(e) => { e.stopPropagation(); handleChoiceSelect(opt); }}
                        className={`w-full text-left p-4 rounded-xl border text-sm transition-all flex flex-col justify-center ${
                          choiceStatus[opt] === 'correct' 
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm' 
                            : choiceStatus[opt] === 'wrong'
                              ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-sm'
                              : 'bg-white/60 border-white hover:bg-white hover:border-teal-200 text-slate-700'
                        }`}
                      >
                        <span className="font-medium">{opt}</span>
                        {choiceStatus[opt] === 'wrong' && originalWord && (
                          <span className="text-xs text-rose-500 mt-1.5 font-bold flex items-center bg-rose-100/50 px-2.5 py-1 rounded-lg border border-rose-200 w-fit">
                            ⚠️ 这是单词 "{originalWord}" 的释义
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {studyMode === 'spelling' && (
              <div className="flex flex-col items-center justify-center w-full h-full">
                <p className="text-xl font-medium text-slate-700 mb-2 text-center">{currentWord.definition}</p>
                <div className="flex items-center space-x-2 mb-8">
                  <p className="text-teal-600/70 font-mono text-sm">{currentWord.phonetic}</p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); playAudio(currentWord.english); }}
                    className="p-1 text-teal-600 hover:bg-teal-50 rounded-full transition-colors"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                
                <form onSubmit={handleSpellingSubmit} className="w-full relative" onClick={e => e.stopPropagation()}>
                  <input
                    type="text"
                    autoFocus
                    value={spellingInput}
                    onChange={e => setSpellingInput(e.target.value)}
                    disabled={spellingStatus !== 'typing'}
                    placeholder="输入英文单词..."
                    className={`w-full text-center text-2xl font-bold p-4 rounded-2xl border-2 outline-none transition-colors ${
                      spellingStatus === 'correct'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                        : spellingStatus === 'wrong'
                          ? 'bg-rose-50 border-rose-400 text-rose-800'
                          : 'bg-white/80 border-teal-200 focus:border-teal-500 text-slate-800'
                    }`}
                  />
                  {spellingStatus === 'wrong' && (
                    <div className="mt-4 text-center">
                      <p className="text-rose-600 font-medium mb-2">正确答案: {currentWord.english}</p>
                      <button 
                        type="button"
                        onClick={() => handleAction('forgot')}
                        className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-medium text-sm transition-colors"
                      >
                        继续学习
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Action Buttons */}
      {studyMode === 'flashcard' && (
        <div className="mt-6 flex justify-between space-x-4 mb-4">
          <ActionButton 
            label="忘记" 
            disabled={!showDefinition || isEnrichingCurrentWord} 
            onClick={() => handleAction('forgot')} 
            variant="danger" 
          />
          <ActionButton 
            label="模糊" 
            disabled={!showDefinition || isEnrichingCurrentWord} 
            onClick={() => handleAction('vague')} 
            variant="warning" 
          />
          <ActionButton 
            label="认识" 
            disabled={!showDefinition || isEnrichingCurrentWord} 
            onClick={() => handleAction('know')} 
            variant="success" 
          />
        </div>
      )}

      {/* Floating Pet Component */}
      <div className="absolute bottom-[5.5rem] right-4 z-20 flex flex-col items-center">
        <button 
          onClick={(e) => { e.stopPropagation(); onOpenDressUp(); }}
          className="mb-3 p-3 bg-white/60 backdrop-blur-md rounded-2xl shadow-sm text-slate-500 hover:text-teal-600 hover:bg-white/80 active:scale-95 transition-all border border-white/60"
        >
          <Shirt className="w-5 h-5" />
        </button>
        <Pet outfit={outfit} isIdle={idleTime > 10} onTap={() => resetIdle()} />
      </div>
    </motion.div>
  );
}

function ActionButton({ label, disabled, onClick, variant }: any) {
  const base = "flex-1 py-4 rounded-2xl font-medium text-sm transition-all duration-300 flex justify-center items-center shadow-sm active:scale-95";
  let styles = "bg-white/30 text-slate-400 border border-white/40 backdrop-blur-md";
  
  if (!disabled) {
    if (variant === 'danger') styles = "bg-rose-50/80 text-rose-600 hover:bg-rose-100/90 border border-rose-200/50";
    if (variant === 'warning') styles = "bg-amber-50/80 text-amber-700 hover:bg-amber-100/90 border border-amber-200/50";
    if (variant === 'success') styles = "bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100/90 border border-emerald-200/50";
  }

  return (
    <button disabled={disabled} onClick={onClick} className={`${base} ${styles}`}>
      {label}
    </button>
  );
}
