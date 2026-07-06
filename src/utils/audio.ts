export const playAudio = (text: string) => {
  if (!text) return;
  if (typeof window === 'undefined' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
    console.warn('Speech synthesis is not supported in this environment.');
    return;
  }
  try {
    // 1. Cancel any ongoing speech to reset/unlock the iOS/Safari speech queue
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    
    // Set typical rate and pitch for standard clear pronunciation
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    // 2. Select an active English voice (crucial for some mobile browsers to avoid silent fallback)
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      // Prefer standard English pronunciation voices
      const enVoice = voices.find(v => v.lang.startsWith('en-US')) || 
                      voices.find(v => v.lang.startsWith('en-')) || 
                      voices[0];
      if (enVoice) {
        utterance.voice = enVoice;
      }
    }

    // 3. Queue and speak
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error('Failed to play audio:', error);
  }
};

