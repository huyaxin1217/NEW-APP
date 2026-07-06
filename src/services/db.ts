import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, writeBatch, serverTimestamp, Timestamp, onSnapshot, increment } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { initialWords } from '../data/words';
import { Word, WordFamiliarity, PetOutfit, UserStats } from '../types';

import { getNextReviewTime } from '../utils/ebbinghaus';

export const initializeVocabulary = async () => {
  // Static words are loaded directly from local initialWords.
  // No database seeding is required, making loading instant and robust!
  return;
};

export const subscribeToUserData = (userId: string, callback: (data: any) => void) => {
  const userRef = doc(db, 'users', userId);
  return onSnapshot(userRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    }
  });
};

export const addCoinsToUser = async (userId: string, amount: number) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    coins: increment(amount)
  });
};

export const getUserData = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    const defaultData = {
      coins: 0,
      currentBook: 'CET6',
      petOutfit: 'none' as PetOutfit,
      purchasedOutfits: ['none'] as PetOutfit[],
      createdAt: serverTimestamp()
    };
    await setDoc(userRef, defaultData);
    return defaultData;
  }
  return userSnap.data();
};

export const updateUserData = async (userId: string, data: Partial<{ coins: number, currentBook: string, petOutfit: PetOutfit, purchasedOutfits: PetOutfit[] }>) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, data);
};

export const fetchWordsForStudy = async (userId: string, book: string): Promise<Word[]> => {
  // Map and deduplicate static words from the local file
  const seenIds = new Set<string>();
  const allWords: Word[] = [];
  
  initialWords.filter(w => w.book === book).forEach(w => {
    const docId = `${w.book}_${w.english.replace(/\W/g, '')}`;
    if (!seenIds.has(docId)) {
      seenIds.add(docId);
      allWords.push({
        id: docId,
        ...w
      } as unknown as Word);
    }
  });
  
  // Fetch user progress
  const progressRef = collection(db, 'users', userId, 'progress');
  const progressSnap = await getDocs(progressRef);
  
  const progressMap = new Map<string, any>();
  progressSnap.forEach(doc => {
    progressMap.set(doc.id, doc.data());
  });
  
  // Merge static dictionary with user progress
  return allWords.map(w => {
    const p = progressMap.get(w.id);
    const resolvedFam = p && typeof p.familiarity === 'number' ? (p.familiarity as WordFamiliarity) : 0;
    return {
      id: w.id,
      english: w.english,
      phonetic: w.phonetic,
      definition: w.definition,
      exampleEn: p?.exampleEn || w.exampleEn,
      exampleZh: p?.exampleZh || w.exampleZh,
      book: w.book,
      familiarity: resolvedFam,
      progress: p ? {
        familiarity: resolvedFam,
        reviewLevel: p.reviewLevel || 0,
        nextReviewTime: p.nextReviewTime || 0,
        lastReviewedAt: p.lastReviewedAt || 0
      } : undefined
    };
  });
};

export const updateWordData = async (wordId: string, data: Partial<Word>) => {
  const userId = auth.currentUser?.uid;
  if (userId) {
    // Persist custom user-generated word data (such as AI example sentences) in progress subcollection
    const progressRef = doc(db, 'users', userId, 'progress', wordId);
    await setDoc(progressRef, {
      exampleEn: data.exampleEn,
      exampleZh: data.exampleZh
    }, { merge: true });
  }
};

export const updateWordProgress = async (userId: string, wordId: string, action: 'forgot' | 'vague' | 'know', currentProgress?: any) => {
  const progressRef = doc(db, 'users', userId, 'progress', wordId);
  let newFamiliarity = currentProgress?.familiarity || 0;
  let newReviewLevel = currentProgress?.reviewLevel || 0;
  
  if (action === 'know') {
    newFamiliarity = Math.min(3, newFamiliarity + 1);
    newReviewLevel += 1;
  } else if (action === 'forgot') {
    newFamiliarity = Math.max(0, newFamiliarity - 1);
    newReviewLevel = 0;
  } else if (action === 'vague') {
    newFamiliarity = Math.max(1, newFamiliarity);
  }
  
  const nextReviewTime = getNextReviewTime(newReviewLevel);
  const lastReviewedAt = Date.now();

  await setDoc(progressRef, {
    familiarity: newFamiliarity,
    reviewLevel: newReviewLevel,
    nextReviewTime,
    lastReviewedAt,
  }, { merge: true });
  
  return {
    familiarity: newFamiliarity,
    reviewLevel: newReviewLevel,
    nextReviewTime,
    lastReviewedAt
  };
};
