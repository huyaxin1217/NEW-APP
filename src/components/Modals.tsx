import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PetOutfit } from '../types';
import { Pet } from './Pet';
import { X, Check, Coins, ShoppingBag, Shirt } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function BottomModal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/10 backdrop-blur-sm z-40" 
          />
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 250 }}
            className="absolute bottom-0 left-0 right-0 bg-white/70 backdrop-blur-xl rounded-t-3xl p-6 pt-4 border-t border-white/60 shadow-2xl z-50 flex flex-col max-h-[85vh]"
          >
            <div className="w-12 h-1.5 bg-slate-300/50 rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800 tracking-wide">{title}</h3>
              <button onClick={onClose} className="p-2 bg-slate-100/50 rounded-full text-slate-500 hover:bg-slate-200/50 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pb-8 hide-scrollbar">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function PetDressUpModal({ 
  isOpen, 
  onClose, 
  currentOutfit, 
  onSelectOutfit,
  coins,
  purchasedOutfits = ['none'],
  onPurchaseOutfit
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  currentOutfit: PetOutfit, 
  onSelectOutfit: (o: PetOutfit) => void,
  coins: number,
  purchasedOutfits: PetOutfit[],
  onPurchaseOutfit: (o: PetOutfit, cost: number) => void
}) {
  const [activeTab, setActiveTab] = useState<'wardrobe' | 'shop'>('wardrobe');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const outfits: { id: PetOutfit, name: string, emoji: string, price: number, desc: string }[] = [
    { id: 'none', name: '默认外观', emoji: '🌱', price: 0, desc: '初始默认外观' },
    { id: 'hat', name: '探险帽', emoji: '🎩', price: 100, desc: '博学之士的经典装扮' },
    { id: 'glasses', name: '学霸镜', emoji: '👓', price: 150, desc: '专注度+100%的智能眼镜' },
    { id: 'headphone', name: '音乐耳机', emoji: '🎧', price: 200, desc: '抗噪静音，沉浸在单词海洋' },
    { id: 'crown', name: '星萤王冠', emoji: '👑', price: 300, desc: '璀璨的水晶小王冠，散发高贵与睿智的光芒' },
    { id: 'scarf', name: '温暖围巾', emoji: '🧣', price: 80, desc: '软绵绵的红色毛线围巾，在自习室倍感温馨' },
    { id: 'bow', name: '优雅领结', emoji: '🎀', price: 120, desc: '精致的丝绸小领结，让学习也充满仪式感' },
    { id: 'halo', name: '智慧光环', emoji: '👼', price: 400, desc: '飘浮的金色天使光环，照亮所有的未知与迷茫' },
    { id: 'detective', name: '侦探礼帽', emoji: '🕵️‍♂️', price: 180, desc: '化身福尔摩斯，不放过任何一个生词的蛛丝马迹' },
    { id: 'chef', name: '厨神高帽', emoji: '👨‍🍳', price: 130, desc: '烹饪出美味的“知识大餐”，脑洞大开' },
    { id: 'magic_hat', name: '巫师魔帽', emoji: '🧙‍♂️', price: 260, desc: '蕴含古老咒语的魔法帽，背词效率瞬间翻倍' },
    { id: 'pirate', name: '传奇眼罩', emoji: '🏴‍☠️', price: 110, desc: '独眼海盗的神秘眼罩，征服词汇的星辰大海' },
    { id: 'flower', name: '萌萌小花', emoji: '🌸', price: 60, desc: '头顶开出的一朵七彩小花，心情今天也是美美哒' },
    { id: 'sunflower', name: '向日葵头套', emoji: '🌻', price: 220, desc: '永远面向阳光与希望，给你满满的学习正能量' },
    { id: 'straw_hat', name: '遮阳草帽', emoji: '👒', price: 90, desc: '夏日清凉的手工编织草帽，向着自由出发' },
    { id: 'reindeer', name: '圣诞鹿角', emoji: '🦌', price: 160, desc: '红彤彤的圣诞鹿角，带来冬日的温暖与好运' },
    { id: 'star_glasses', name: '璀璨星镜', emoji: '⭐️', price: 140, desc: '五角星造型炫彩墨镜，你就是自习室最靓的仔' },
    { id: 'sunglasses', name: '酷黑墨镜', emoji: '🕶️', price: 100, desc: '超酷防辐射黑超墨镜，冷酷无情背词机器' },
    { id: 'ninja', name: '忍者额带', emoji: '🥷', price: 150, desc: '写有“必胜”的修行额带，不达目的誓不罢休' },
    { id: 'devil_horns', name: '俏皮恶魔角', emoji: '😈', price: 170, desc: '红色的恶魔小犄角，古灵精怪又带点小傲娇' },
    { id: 'party_hat', name: '狂欢派对帽', emoji: '🎉', price: 70, desc: '五彩斑斓的小纸帽，庆祝每一个单词被牢记' },
    { id: 'propeller', name: '飞行竹蜻蜓', emoji: '🚁', price: 240, desc: '顶部的竹蜻蜓轻快旋转，带你飞跃词汇难关' },
  ];

  const handleBuy = (id: PetOutfit, price: number) => {
    if (coins < price) {
      setErrorMsg('金币不足，快去背单词吧！');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    onPurchaseOutfit(id, price);
  };

  return (
    <BottomModal isOpen={isOpen} onClose={onClose} title="桌宠互动与换装">
      <div className="flex flex-col items-center">
        {/* Top Info Badge & Coins Indicator */}
        <div className="w-full flex items-center justify-between mb-6 bg-slate-50/60 rounded-2xl p-4 border border-slate-100">
          <div className="flex items-center space-x-2">
            <Coins className="w-5 h-5 text-amber-500 animate-pulse" />
            <span className="text-sm font-bold text-slate-700">我的金币:</span>
            <span className="text-base font-black text-amber-600">{coins}</span>
          </div>
          <span className="text-xs text-slate-400 bg-white px-2.5 py-1 rounded-full border border-slate-100">
            背单词/复习可得金币
          </span>
        </div>

        {/* Preview Area */}
        <div className="w-32 h-32 bg-white/40 rounded-3xl border border-white/60 flex items-center justify-center mb-6 shadow-sm relative overflow-hidden backdrop-blur-md">
           <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 to-emerald-50/50" />
           <div className="scale-150 relative z-10">
             <Pet outfit={currentOutfit} isIdle={false} onTap={() => {}} hideSpeechBubble={true} />
           </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-100/60 p-1 rounded-xl mb-6 w-full border border-slate-200/50">
          <button 
            onClick={() => setActiveTab('wardrobe')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center space-x-1.5 ${activeTab === 'wardrobe' ? 'bg-white text-teal-600 shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Shirt className="w-4 h-4" />
            <span>我的衣柜</span>
          </button>
          <button 
            onClick={() => setActiveTab('shop')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center space-x-1.5 ${activeTab === 'shop' ? 'bg-white text-teal-600 shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>道具商城</span>
          </button>
        </div>

        {/* Warning Toast */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-rose-500 font-medium text-xs bg-rose-50 px-4 py-2 rounded-xl mb-4 border border-rose-100 text-center w-full"
            >
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Items list / Grid */}
        <div className="grid grid-cols-1 gap-3.5 w-full">
          {activeTab === 'wardrobe' ? (
            // Wardrobe display
            outfits.filter(item => purchasedOutfits.includes(item.id)).map(item => {
              const isActive = currentOutfit === item.id;
              return (
                <button 
                  key={item.id}
                  onClick={() => onSelectOutfit(item.id)}
                  className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 border-2 ${isActive ? 'bg-teal-50/50 border-teal-500 shadow-sm' : 'bg-white/50 border-white/60 hover:border-slate-200'}`}
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl">{item.emoji}</span>
                    <div className="text-left">
                      <span className={`text-sm font-semibold block ${isActive ? 'text-teal-700' : 'text-slate-700'}`}>{item.name}</span>
                      <span className="text-xs text-slate-400">{item.desc}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {isActive ? (
                      <span className="text-xs font-semibold text-teal-600 bg-teal-100 px-3 py-1.5 rounded-full flex items-center">
                        <Check className="w-3.5 h-3.5 mr-1" />
                        穿戴中
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 bg-slate-100/50 px-3 py-1.5 rounded-full">
                        点击穿戴
                      </span>
                    )}
                  </div>
                </button>
              )
            })
          ) : (
            // Shop display
            outfits.map(item => {
              const isOwned = purchasedOutfits.includes(item.id);
              const isWearing = currentOutfit === item.id;
              
              return (
                <div 
                  key={item.id}
                  className={`flex items-center justify-between p-4 rounded-2xl bg-white/50 border border-slate-100 hover:border-slate-200 transition-all duration-300`}
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl">{item.emoji}</span>
                    <div className="text-left">
                      <span className="text-sm font-semibold text-slate-700 block">{item.name}</span>
                      <span className="text-xs text-slate-400 block">{item.desc}</span>
                    </div>
                  </div>
                  
                  <div>
                    {isOwned ? (
                      isWearing ? (
                        <span className="text-xs font-semibold text-teal-600 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-full">
                          已穿戴
                        </span>
                      ) : (
                        <button 
                          onClick={() => onSelectOutfit(item.id)}
                          className="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors"
                        >
                          已拥有 (穿戴)
                        </button>
                      )
                    ) : (
                      <button 
                        onClick={() => handleBuy(item.id, item.price)}
                        className="flex items-center space-x-1 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-4 py-2 rounded-xl shadow-sm transition-all active:scale-95"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>{item.price} 购买</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </BottomModal>
  );
}

export function UserProfileModal({ 
  isOpen, 
  onClose, 
  email,
  accent,
  onChangeAccent
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  email?: string | null,
  accent: 'us' | 'uk',
  onChangeAccent: (accent: 'us' | 'uk') => void
}) {
  return (
    <BottomModal isOpen={isOpen} onClose={onClose} title="账号与设置">
      <div className="space-y-6">
        <div className="flex items-center space-x-4 p-4 bg-white/40 border border-white/60 rounded-2xl backdrop-blur-md">
          <div className="w-16 h-16 bg-gradient-to-tr from-teal-400 to-emerald-400 rounded-2xl shadow-sm flex items-center justify-center text-white text-xl font-bold">
            {email ? email[0].toUpperCase() : 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <h4 className="font-semibold text-lg text-slate-800 tracking-wide truncate">{email || '学习者'}</h4>
            <p className="text-sm text-slate-500">已连续学习 12 天</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <h5 className="text-sm font-semibold text-slate-400 uppercase tracking-wider pl-2">偏好设置</h5>
          <div className="bg-white/40 border border-white/60 rounded-2xl overflow-hidden shadow-sm backdrop-blur-md">
            <SettingRow label="每日学习目标" value="50 词" />
            <div className="h-px bg-white/60 mx-4" />
            <div className="flex items-center justify-between p-4">
              <span className="text-slate-700 font-medium">发音口音</span>
              <div className="flex bg-slate-200/50 p-0.5 rounded-xl border border-slate-200/20">
                <button
                  onClick={() => onChangeAccent('us')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${accent === 'us' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  美音 (US)
                </button>
                <button
                  onClick={() => onChangeAccent('uk')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${accent === 'uk' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  英音 (UK)
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => {
            signOut(auth);
            onClose();
          }}
          className="w-full py-4 text-rose-500 font-semibold bg-rose-50/50 rounded-2xl border border-rose-100 active:bg-rose-100/50 transition-colors backdrop-blur-md"
        >
          退出登录
        </button>
      </div>
    </BottomModal>
  );
}

function SettingRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/50 transition-colors">
      <span className="text-slate-700 font-medium">{label}</span>
      <div className="flex items-center text-slate-400">
        <span className="text-sm mr-2">{value}</span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}
