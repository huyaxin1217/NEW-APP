import React, { useState, useEffect } from 'react';
import { PetOutfit } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface PetProps {
  outfit: PetOutfit;
  isIdle: boolean;
  onTap: () => void;
}

export function Pet({ outfit, isIdle, onTap }: PetProps) {
  const [quote, setQuote] = useState("咕噜~ 欢迎来到静谧自习室，今天也要闪闪发光呢！");
  const [showQuote, setShowQuote] = useState(true);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isTapped, setIsTapped] = useState(false);
  const [showHeart, setShowHeart] = useState(false);

  const idleQuotes = [
    "背单词就像收集星光，累积起来的那一刻会很美。",
    "累了吗？闭上眼睛休息一下，有我在这里守候哦~",
    "星光不问赶路人，你的每一次专注和坚持，我都看在眼里。",
    "每一次成功的记忆，都是我们心灵星空里点亮的一颗星辰。",
    "咕噜~ 静下心来，感受呼吸的频率，背单词也会变得优雅~",
    "让思绪像水一样流淌，不要焦虑，我们一步一步来。"
  ];

  const tapQuotes = [
    "咿呀！被你轻轻触碰了一下，散发出了一圈温润的光晕~",
    "叮！星荧收集到了你的专注能量，今日记忆力加成 100%！",
    "贴贴！星光与你同在，接下来的单词一定会轻而易举记住哦！",
    "咕噜~ 感觉有一股宁静而强大的治愈力量，正注入你的脑海~",
    "好舒服呀~ 摸摸头，让我们推开喧嚣，开始高效自习吧！",
    "不怕不怕，生词就像天上的繁星，多看两眼就会觉得无比亲切！"
  ];

  // Natural idle blinking loop
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
    }, 3500);

    return () => clearInterval(blinkInterval);
  }, []);

  // Periodic speech bubble for idle states
  useEffect(() => {
    if (isIdle && !isTapped) {
      const interval = setInterval(() => {
        setQuote(idleQuotes[Math.floor(Math.random() * idleQuotes.length)]);
        setShowQuote(true);
        const timer = setTimeout(() => setShowQuote(false), 5000);
        return () => clearTimeout(timer);
      }, 15000);

      return () => clearInterval(interval);
    }
  }, [isIdle, isTapped]);

  const handleTap = () => {
    setQuote(tapQuotes[Math.floor(Math.random() * tapQuotes.length)]);
    setShowQuote(true);
    setIsTapped(true);
    setShowHeart(true);
    onTap();
    
    setTimeout(() => setIsTapped(false), 800);
    setTimeout(() => setShowHeart(false), 1500);
  };

  return (
    <div className="relative flex flex-col items-center cursor-pointer select-none" onClick={handleTap}>
      {/* Tap heart/sparkle effect */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ opacity: 0, scale: 0.3, y: -20 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.3, 1.4, 1.4, 1], y: -90, x: [0, -10, 10, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.3, ease: "easeOut" }}
            className="absolute text-2xl z-30 pointer-events-none select-none"
          >
            ✨🌸🌟
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQuote && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute -top-16 whitespace-nowrap bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl text-xs font-medium text-slate-600 shadow-[0_4px_12px_rgba(148,163,184,0.12)] border border-white/60 z-20"
          >
            {quote}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/90 rotate-45 border-r border-b border-white/60"></div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        animate={isTapped ? {
          y: [0, -16, 0],
          scale: [1, 1.12, 0.96, 1],
          rotate: [0, -4, 4, 0]
        } : { 
          y: isIdle ? [0, -6, 0] : [0, -2, 0],
          scale: isIdle ? [1, 1.02, 1] : 1
        }} 
        transition={isTapped ? {
          duration: 0.6,
          ease: "easeOut"
        } : { 
          repeat: Infinity, 
          duration: isIdle ? 3.0 : 1.5,
          ease: "easeInOut"
        }}
        className="relative w-24 h-24 flex items-center justify-center"
      >
        {/* Animated Vector Pet: Ambient Glassmorphic Star-Spirit "星荧 (Aether)" */}
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_8px_16px_rgba(14,165,233,0.1)]">
          <defs>
            {/* Elegant Blue-Cyan Glassmorphic Body Gradient */}
            <linearGradient id="bodyGrad" x1="15%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stopColor="rgba(240, 249, 255, 0.85)" />
              <stop offset="50%" stopColor="rgba(224, 242, 254, 0.75)" />
              <stop offset="100%" stopColor="rgba(186, 230, 253, 0.65)" />
            </linearGradient>

            {/* Inner Core Shimmer Gradient */}
            <radialGradient id="coreGrad" cx="50%" cy="40%" r="55%">
              <stop offset="0%" stopColor="rgba(56, 189, 248, 0.45)" />
              <stop offset="50%" stopColor="rgba(14, 165, 233, 0.15)" />
              <stop offset="100%" stopColor="rgba(14, 165, 233, 0.0)" />
            </radialGradient>

            {/* Star Glow Aura */}
            <radialGradient id="auraG" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(56, 189, 248, 0.15)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </radialGradient>

            {/* Shadow under body */}
            <radialGradient id="floorShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(14, 165, 233, 0.12)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
          </defs>

          <style>{`
            @keyframes floatParticle {
              0% { transform: translateY(15px) scale(0.4); opacity: 0; }
              30% { opacity: 0.7; }
              70% { opacity: 0.7; }
              100% { transform: translateY(-30px) scale(1.1); opacity: 0; }
            }
            @keyframes swayTentacles {
              0%, 100% { transform: rotate(0deg) skewX(0deg); }
              50% { transform: rotate(6deg) skewX(3deg); }
            }
            @keyframes swayTentaclesOpposite {
              0%, 100% { transform: rotate(0deg) skewX(0deg); }
              50% { transform: rotate(-6deg) skewX(-3deg); }
            }
            @keyframes pulseCore {
              0%, 100% { opacity: 0.7; }
              50% { opacity: 0.95; }
            }
            .anim-core {
              animation: pulseCore 3s ease-in-out infinite;
            }
            .anim-tentacle-l {
              animation: swayTentacles 2.8s ease-in-out infinite;
              transform-origin: 38px 65px;
            }
            .anim-tentacle-m {
              animation: swayTentaclesOpposite 3.2s ease-in-out infinite;
              transform-origin: 50px 68px;
            }
            .anim-tentacle-r {
              animation: swayTentacles 2.6s ease-in-out infinite;
              transform-origin: 62px 65px;
            }
            .sparkle-p1 { animation: floatParticle 4s infinite linear; }
            .sparkle-p2 { animation: floatParticle 4.5s infinite linear; animation-delay: 2s; }
          `}</style>

          {/* 1. Floor shadow/glow */}
          <ellipse cx="50" cy="94" rx="20" ry="3.5" fill="url(#floorShadow)" />

          {/* Ambient Floating Sparkles */}
          <g className="sparkle-p1" transform="translate(18, 55)">
            <circle cx="0" cy="0" r="1.8" fill="#38BDF8" opacity="0.6" />
          </g>
          <g className="sparkle-p2" transform="translate(80, 50)">
            <circle cx="0" cy="0" r="1.5" fill="#7DD3FC" opacity="0.5" />
          </g>

          {/* 2. Soft Background Aura */}
          <circle cx="50" cy="46" r="32" fill="url(#auraG)" />

          {/* 3. Swaying Translucent Glistening Tentacles (水母触须/星带) */}
          {/* Left Tentacle */}
          <g className="anim-tentacle-l">
            <path 
              d="M 38 65 Q 34 78 40 88 C 42 91, 37 92, 35 88 Q 30 78 34 65 Z" 
              fill="rgba(56, 189, 248, 0.45)" 
              opacity="0.8"
            />
            <circle cx="39" cy="85" r="1.2" fill="#E0F2FE" />
          </g>

          {/* Right Tentacle */}
          <g className="anim-tentacle-r">
            <path 
              d="M 62 65 Q 66 78 60 88 C 58 91, 63 92, 65 88 Q 70 78 66 65 Z" 
              fill="rgba(56, 189, 248, 0.45)" 
              opacity="0.8"
            />
            <circle cx="61" cy="85" r="1.2" fill="#E0F2FE" />
          </g>

          {/* Center Main Tentacle */}
          <g className="anim-tentacle-m">
            <path 
              d="M 50 68 Q 46 81 52 91 C 53 93, 49 94, 47 91 Q 42 81 46 68 Z" 
              fill="rgba(14, 165, 233, 0.35)" 
              opacity="0.9"
            />
            <circle cx="50" cy="89" r="1.5" fill="#F0F9FF" />
          </g>

          {/* 4. Elegant Main Glassmorphic Dome Body (露珠/星体造型) */}
          <path 
            d="M 50 20 C 26 20, 20 38, 20 54 C 20 62, 28 68, 38 66 C 44 65, 46 68, 50 68 C 54 68, 56 65, 62 66 C 72 68, 80 62, 80 54 C 80 38, 74 20, 50 20 Z" 
            fill="url(#bodyGrad)" 
            stroke="rgba(255,255,255,0.9)" 
            strokeWidth="1.8" 
            strokeLinejoin="round"
          />

          {/* Inner Shimmering Bioluminescent Core */}
          <path 
            className="anim-core"
            d="M 50 24 C 32 24, 25 38, 25 50 C 25 54, 30 58, 38 57 C 44 56, 46 59, 50 59 C 54 59, 56 56, 62 57 C 70 58, 75 54, 75 50 C 75 38, 68 24, 50 24 Z" 
            fill="url(#coreGrad)" 
          />

          {/* Elegant Top Ambient Light Reflection Accent */}
          <path 
            d="M 28 40 C 32 28, 44 24, 50 24" 
            fill="none" 
            stroke="rgba(255, 255, 255, 0.7)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            opacity="0.8"
          />

          {/* 5. Minimalist Elegant Face */}
          {isTapped ? (
            // Smiling happy star curved eyes
            <g stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" fill="none">
              <path d="M 36 47 Q 40 43 44 47" />
              <path d="M 56 47 Q 60 43 64 47" />
            </g>
          ) : isBlinking ? (
            // Closed sleeping/calm lines
            <g stroke="#0369A1" strokeWidth="2.2" strokeLinecap="round" fill="none">
              <path d="M 36 48 L 44 48" />
              <path d="M 56 48 L 64 48" />
            </g>
          ) : !isIdle ? (
            // Focused cute smart dots with tiny star highlights
            <g>
              <circle cx="40" cy="47" r="3.2" fill="#0369A1" />
              <circle cx="39" cy="45.5" r="1.1" fill="white" />
              
              <circle cx="60" cy="47" r="3.2" fill="#0369A1" />
              <circle cx="59" cy="45.5" r="1.1" fill="white" />
            </g>
          ) : (
            // Standard beautiful quiet deep eyes
            <g>
              <circle cx="40" cy="47" r="2.8" fill="#075985" />
              <circle cx="39.2" cy="46" r="0.9" fill="white" />

              <circle cx="60" cy="47" r="2.8" fill="#075985" />
              <circle cx="59.2" cy="46" r="0.9" fill="white" />
            </g>
          )}

          {/* Elegant Light-Pink Blush */}
          <circle cx="33" cy="51" r="3.5" fill="#38BDF8" opacity="0.35" />
          <circle cx="67" cy="51" r="3.5" fill="#38BDF8" opacity="0.35" />
          <circle cx="33" cy="51" r="2" fill="#FDA4AF" opacity="0.45" />
          <circle cx="67" cy="51" r="2" fill="#FDA4AF" opacity="0.45" />

          {/* Simple Cute Tiny Smile */}
          {isTapped ? (
            <path d="M 47 51.5 Q 50 54 53 51.5" stroke="#0284C7" strokeWidth="2" fill="none" strokeLinecap="round" />
          ) : (
            <path d="M 48 51.5 Q 50 52.8 52 51.5" stroke="#0369A1" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          )}
        </svg>

        {/* Dynamic Custom Accessories fitted perfectly for the Star-Spirit */}
        {outfit === 'hat' && (
          <motion.div 
            initial={{ y: -15, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            className="absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-14 z-30"
          >
            {/* Elegant Explorer Hat */}
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
              <path d="M 22 68 C 22 68, 26 34, 50 34 C 74 34, 78 68, 78 68 Z" fill="#78350F" stroke="#451A03" strokeWidth="2.5" />
              <path d="M 26 62 C 34 58, 66 58, 74 62 L 76 66 C 66 63, 34 63, 24 66 Z" fill="#EF4444" />
              <ellipse cx="50" cy="68" rx="40" ry="6" fill="#92400E" stroke="#451A03" strokeWidth="2.5" />
            </svg>
          </motion.div>
        )}

        {outfit === 'glasses' && (
          <motion.div 
            initial={{ scale: 0.7, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="absolute top-8 left-1/2 -translate-x-1/2 w-18 h-10 z-30"
          >
            {/* Aesthetic thin-rimmed round glasses */}
            <svg viewBox="0 0 100 40" className="w-full h-full">
              <circle cx="34" cy="20" r="11.5" fill="rgba(56,189,248,0.15)" stroke="#0369A1" strokeWidth="2.5" />
              <path d="M 27 15 Q 32 10 37 15" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.6" />
              
              <circle cx="66" cy="20" r="11.5" fill="rgba(56,189,248,0.15)" stroke="#0369A1" strokeWidth="2.5" />
              <path d="M 59 15 Q 64 10 69 15" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.6" />
              
              <path d="M 45 20 L 55 20" stroke="#0369A1" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
          </motion.div>
        )}

        {outfit === 'headphone' && (
          <motion.div 
            initial={{ scale: 0.6, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="absolute top-1.5 left-1/2 -translate-x-1/2 w-24 h-18 z-30"
          >
            {/* Minimalist modern over-ear headphones */}
            <svg viewBox="0 0 100 80" className="w-full h-full drop-shadow-md">
              <path d="M 16 46 C 14 12, 86 12, 84 46" fill="none" stroke="#334155" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M 20 42 C 18 15, 82 15, 80 42" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
              
              <g transform="translate(6, 30)">
                <rect x="0" y="0" width="11" height="24" rx="5.5" fill="#0284C7" stroke="#0369A1" strokeWidth="1.5" />
                <rect x="7" y="4" width="2.5" height="16" rx="1" fill="#38BDF8" />
              </g>

              <g transform="translate(83, 30)">
                <rect x="0" y="0" width="11" height="24" rx="5.5" fill="#0284C7" stroke="#0369A1" strokeWidth="1.5" />
                <rect x="1.5" y="4" width="2.5" height="16" rx="1" fill="#38BDF8" />
              </g>
            </svg>
          </motion.div>
        )}

        {outfit === 'crown' && (
          <motion.div 
            initial={{ y: -15, scale: 0.8, opacity: 0 }} 
            animate={{ y: 0, scale: 1, opacity: 1 }} 
            className="absolute -top-4 left-1/2 -translate-x-1/2 w-14 h-14 z-30"
          >
            {/* Gold Crown */}
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_8px_rgba(245,158,11,0.35)]">
              <path d="M 20 70 L 15 35 L 35 50 L 50 25 L 65 50 L 85 35 L 80 70 Z" fill="url(#crownGold)" stroke="#D97706" strokeWidth="2" strokeLinejoin="round" />
              <ellipse cx="50" cy="70" rx="30" ry="4" fill="#D97706" />
              <circle cx="15" cy="33" r="3" fill="#EF4444" />
              <circle cx="50" cy="23" r="3.5" fill="#3B82F6" />
              <circle cx="85" cy="33" r="3" fill="#EF4444" />
              <circle cx="35" cy="50" r="2" fill="#10B981" />
              <circle cx="65" cy="50" r="2" fill="#10B981" />
              <circle cx="35" cy="70" r="1.5" fill="#FFF" />
              <circle cx="50" cy="70" r="1.5" fill="#FFF" />
              <circle cx="65" cy="70" r="1.5" fill="#FFF" />
              <defs>
                <linearGradient id="crownGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FBBF24" />
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
        )}

        {outfit === 'scarf' && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="absolute top-[56px] left-1/2 -translate-x-1/2 w-16 h-12 z-30"
          >
            {/* Cozy Scarf */}
            <svg viewBox="0 0 100 70" className="w-full h-full drop-shadow-md">
              <rect x="25" y="15" width="50" height="15" rx="7.5" fill="#DC2626" stroke="#B91C1C" strokeWidth="1.5" />
              <line x1="35" y1="15" x2="35" y2="30" stroke="#EF4444" strokeWidth="1.5" />
              <line x1="45" y1="15" x2="45" y2="30" stroke="#EF4444" strokeWidth="1.5" />
              <line x1="55" y1="15" x2="55" y2="30" stroke="#EF4444" strokeWidth="1.5" />
              <line x1="65" y1="15" x2="65" y2="30" stroke="#EF4444" strokeWidth="1.5" />
              <path d="M 60 25 C 60 25, 65 48, 63 56" stroke="#DC2626" strokeWidth="12" strokeLinecap="round" />
              <path d="M 60 25 C 60 25, 65 48, 63 56" stroke="#B91C1C" strokeWidth="12" strokeLinecap="round" strokeDasharray="2,4" opacity="0.3" />
              <line x1="60" y1="56" x2="58" y2="62" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" />
              <line x1="63" y1="56" x2="63" y2="63" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" />
              <line x1="66" y1="56" x2="68" y2="62" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </motion.div>
        )}

        {outfit === 'bow' && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="absolute top-[58px] left-1/2 -translate-x-1/2 w-12 h-8 z-30"
          >
            {/* Velvet Bow */}
            <svg viewBox="0 0 100 60" className="w-full h-full drop-shadow-[0_2px_4px_rgba(244,63,94,0.2)]">
              <path d="M 50 30 Q 20 10, 15 30 Q 20 50, 50 30" fill="#F43F5E" stroke="#E11D48" strokeWidth="2" strokeLinejoin="round" />
              <path d="M 50 30 Q 80 10, 85 30 Q 80 50, 50 30" fill="#F43F5E" stroke="#E11D48" strokeWidth="2" strokeLinejoin="round" />
              <path d="M 45 32 Q 35 55, 30 58" stroke="#F43F5E" strokeWidth="4" strokeLinecap="round" />
              <path d="M 55 32 Q 65 55, 70 58" stroke="#F43F5E" strokeWidth="4" strokeLinecap="round" />
              <circle cx="50" cy="30" r="7" fill="#FDA4AF" stroke="#E11D48" strokeWidth="2" />
            </svg>
          </motion.div>
        )}

        {outfit === 'halo' && (
          <motion.div 
            initial={{ y: -25, opacity: 0 }} 
            animate={{ 
              y: [ -18, -24, -18 ],
              opacity: 1 
            }}
            transition={{
              y: {
                repeat: Infinity,
                duration: 2.5,
                ease: "easeInOut"
              },
              opacity: { duration: 0.3 }
            }}
            className="absolute -top-7 left-1/2 -translate-x-1/2 w-20 h-10 z-30"
          >
            {/* Floating Wisdom Halo */}
            <svg viewBox="0 0 120 60" className="w-full h-full filter drop-shadow-[0_0_12px_rgba(253,224,71,0.8)]">
              <ellipse cx="60" cy="30" rx="42" ry="12" fill="none" stroke="url(#haloGrad)" strokeWidth="6" strokeLinecap="round" opacity="0.9" />
              <ellipse cx="60" cy="30" rx="40" ry="10" fill="none" stroke="#FFFDF0" strokeWidth="2.2" opacity="0.95" />
              <path d="M 40 38 Q 50 50, 50 56" stroke="rgba(253,224,71,0.4)" strokeWidth="1.5" strokeLinecap="round" fill="none" strokeDasharray="2,2" />
              <path d="M 80 38 Q 70 50, 70 56" stroke="rgba(253,224,71,0.4)" strokeWidth="1.5" strokeLinecap="round" fill="none" strokeDasharray="2,2" />
              <defs>
                <linearGradient id="haloGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FCD34D" />
                  <stop offset="50%" stopColor="#FBBF24" />
                  <stop offset="100%" stopColor="#FCD34D" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

