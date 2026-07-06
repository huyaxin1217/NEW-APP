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
  if (isUnlocked || typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    const utterance = new SpeechSynthesisUtterance(' ');
    utterance.volume = 0;
    utterance.rate = 2.0;
    window.speechSynthesis.speak(utterance);
    isUnlocked = true;
    console.log('SpeechSynthesis unlocked successfully on user interaction.');
  } catch (e) {
    console.warn('Failed to unlock SpeechSynthesis:', e);
  }
};

// Find the best English voice matching BCP-47 tags and high-quality keywords
const getBestEnglishVoice = (): SpeechSynthesisVoice | null => {
  const currentVoices = voicesCache.length > 0
    ? voicesCache
    : (typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis.getVoices() : []);

  if (!currentVoices || currentVoices.length === 0) return null;

  // Filter to keep only English voices
  const enVoices = currentVoices.filter(v => v.lang.toLowerCase().startsWith('en'));
  if (enVoices.length === 0) return null;

  // Search preferences:
  // 1. Premium/Natural sounding English voices (Google, Siri, Samantha, Microsoft)
  const preferredKeywords = ['google', 'siri', 'samantha', 'premium', 'natural', 'microsoft', 'daniel', 'karen'];
  for (const keyword of preferredKeywords) {
    const found = enVoices.find(v =>
      v.name.toLowerCase().includes(keyword) &&
      (v.lang.toLowerCase().includes('us') || v.lang.toLowerCase().includes('gb'))
    );
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
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    utterance.pitch = 1.0;

    const bestVoice = getBestEnglishVoice();
    if (bestVoice) {
      utterance.voice = bestVoice;
      utterance.lang = bestVoice.lang;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('Local TTS failed:', err);
  }
};

export const playAudio = (text: string) => {
  if (!text) return;

  // Try high-quality standard dictionary voice library (NetEase Youdao US Accent)
  try {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio = null;
    }

    const audioUrl = `https://dict.youdao.com/dictvoice?type=2&audio=${encodeURIComponent(text.trim())}`;
    const audio = new Audio(audioUrl);
    activeAudio = audio;

    audio.play().catch(err => {
      console.warn('Standard dictionary voice playing was interrupted or failed, falling back to local TTS:', err);
      playLocalTTS(text);
    });
  } catch (e) {
    console.warn('Failed to load standard online dictionary voice, falling back to local TTS:', e);
    playLocalTTS(text);
  }
};


