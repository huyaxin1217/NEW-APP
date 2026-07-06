import React, { useState, useEffect } from 'react';
import { MainApp } from './components/MainApp';
import { AuthScreen } from './components/AuthScreen';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { unlockSpeech } from './utils/audio';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Global user interaction listener to unlock SpeechSynthesis on mobile/iOS
  useEffect(() => {
    const handleInteraction = () => {
      unlockSpeech();
    };

    window.addEventListener('click', handleInteraction, { capture: true, once: false });
    window.addEventListener('touchstart', handleInteraction, { capture: true, once: false });

    return () => {
      window.removeEventListener('click', handleInteraction, { capture: true });
      window.removeEventListener('touchstart', handleInteraction, { capture: true });
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-0 sm:p-8">
      {/* Container for Desktop viewers, clean unbranded generic rectangle */}
      <div className="w-full h-[100dvh] sm:h-[844px] sm:max-w-[390px] bg-slate-50 rounded-none sm:rounded-[2rem] shadow-none sm:shadow-[0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden relative ring-1 ring-white/10 border border-slate-700/50">
        {loading ? (
          <div className="flex items-center justify-center h-full bg-slate-50">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : user ? (
          <MainApp user={user} />
        ) : (
          <AuthScreen />
        )}
      </div>
    </div>
  );
}
