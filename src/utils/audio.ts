let isUnlocked = false;
let voicesCache: SpeechSynthesisVoice[] = [];
let activeAudio: HTMLAudioElement | null = null;

// Pre-load voices and handle dynamic loading on mobile/desktop browsers
const loadVoices = () => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    voicesCache = window.speechSynthesis.getVoices() || [];
  } catch (e) {
    console.warn('Failed to load speech voices:', e);
  }
};

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  if ('onvoiceschanged' in window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

export const unlockSpeech = () => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    const utterance = new SpeechSynthesisUtterance(' ');
    utterance.volume = 0;
    utterance.rate = 2.0;
    window.speechSynthesis.speak(utterance);
    isUnlocked = true;
    console.log('SpeechSynthesis unlocked successfully on user interaction.');
    
    // Warm up the voices
    voicesCache = window.speechSynthesis.getVoices() || [];
  } catch (e) {
    console.warn('Failed to unlock SpeechSynthesis:', e);
  }
};

// Find the best English voice matching BCP-47 tags and high-quality keywords
const getBestEnglishVoice = (): SpeechSynthesisVoice | null => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  
  // ALWAYS retrieve the most updated voice list from the browser dynamically
  const currentVoices = window.speechSynthesis.getVoices() || [];
  const voicesToSearch = currentVoices.length > 0 ? currentVoices : voicesCache;
  
  if (!voicesToSearch || voicesToSearch.length === 0) return null;

  // Filter to keep only English voices
  const enVoices = voicesToSearch.filter(v => {
    const lang = v.lang.toLowerCase();
    return lang.startsWith('en') || lang.startsWith('eng');
  });
  
  if (enVoices.length === 0) return null;

  // Search preferences:
  // 1. Premium/Natural sounding English voices (Google, Siri, Samantha, Microsoft)
  const preferredKeywords = ['google', 'siri', 'samantha', 'premium', 'natural', 'microsoft', 'daniel', 'karen', 'apple'];
  for (const keyword of preferredKeywords) {
    const found = enVoices.find(v => {
      const name = v.name.toLowerCase();
      const lang = v.lang.toLowerCase();
      return name.includes(keyword) && (lang.includes('us') || lang.includes('gb') || lang.includes('en'));
    });
    if (found) return found;
  }

  // 2. Standard US English voice
  const usVoice = enVoices.find(v => v.lang.toLowerCase().startsWith('en-us'));
  if (usVoice) return usVoice;

  // 3. Fallback to any English voice
  return enVoices[0];
};

// Fallback to local TTS if online dictionary fails
export const playLocalTTS = (text: string) => {
  if (typeof window === 'undefined' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
    console.warn('Speech synthesis is not supported.');
    return;
  }
  
  try {
    window.speechSynthesis.cancel();
    
    // Capitalize the first letter of the word, which encourages local TTS engines
    // to pronounce the whole word instead of spelling out single letters
    const formattedText = text.trim();
    const capitalizedText = formattedText.charAt(0).toUpperCase() + formattedText.slice(1).toLowerCase();
    
    const utterance = new SpeechSynthesisUtterance(capitalizedText);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    utterance.pitch = 1.0;

    const bestVoice = getBestEnglishVoice();
    if (bestVoice) {
      utterance.voice = bestVoice;
      utterance.lang = bestVoice.lang;
      console.log(`Using matched English voice: ${bestVoice.name} (${bestVoice.lang}) for text: ${capitalizedText}`);
    } else {
      console.warn('No English voice found in browser. Falling back to system default.', capitalizedText);
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('Local TTS failed:', err);
  }
};

export const playAudio = (text: string) => {
  if (!text) return;
  const cleanText = text.trim();
  
  // Try high-quality standard dictionary voice library (NetEase Youdao US Accent)
  try {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio = null;
    }

    const audioUrl = `https://dict.youdao.com/dictvoice?type=2&audio=${encodeURIComponent(cleanText)}`;
    const audio = new Audio(audioUrl);
    activeAudio = audio;

    audio.play().catch(err => {
      console.warn('Youdao standard dictionary voice failed or blocked, trying Google Translate fallback:', err);
      
      // Fallback 1: Google Translate TTS (highly stable, bypasses Youdao blocks)
      try {
        const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
        const googleAudio = new Audio(googleTtsUrl);
        activeAudio = googleAudio;
        
        googleAudio.play().catch(gErr => {
          console.warn('Google Translate TTS failed or blocked, falling back to local TTS:', gErr);
          playLocalTTS(cleanText);
        });
      } catch (e2) {
        console.warn('Google Translate TTS setup failed, falling back to local TTS:', e2);
        playLocalTTS(cleanText);
      }
    });
  } catch (e) {
    console.warn('Failed to load standard online dictionary voice, falling back to local TTS:', e);
    playLocalTTS(cleanText);
  }
};


