import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, writeBatch, serverTimestamp, Timestamp, onSnapshot, increment, deleteDoc } from 'firebase/firestore';
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
      accent: 'us' as 'us' | 'uk',
      lastUploadAt: undefined as number | undefined,
      createdAt: serverTimestamp()
    };
    await setDoc(userRef, defaultData);
    return defaultData;
  }
  return userSnap.data();
};

export const updateUserData = async (userId: string, data: Partial<{ coins: number, currentBook: string, petOutfit: PetOutfit, purchasedOutfits: PetOutfit[], accent: 'us' | 'uk', lastUploadAt: number }>) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, data);
};

export const fetchCustomBooks = async (userId: string) => {
  try {
    const booksRef = collection(db, 'users', userId, 'custom_books');
    const booksSnap = await getDocs(booksRef);
    const books: { id: string, title: string, desc: string, wordCount: number }[] = [];
    booksSnap.forEach(docSnap => {
      const data = docSnap.data();
      books.push({
        id: docSnap.id,
        title: data.title || '未命名词书',
        desc: data.desc || '自定义导入',
        wordCount: data.wordCount || 0
      });
    });
    return books;
  } catch (err) {
    console.error("Failed to fetch custom books:", err);
    return [];
  }
};

export const fetchBookTitle = async (userId: string, bookId: string): Promise<string> => {
  if (bookId === 'CET4') return '四级核心词汇';
  if (bookId === 'CET6') return '六级核心词汇';
  try {
    const bookRef = doc(db, 'users', userId, 'custom_books', bookId);
    const snap = await getDoc(bookRef);
    if (snap.exists()) {
      return snap.data().title || '未命名词书';
    }
  } catch (err) {
    console.error("Failed to fetch custom book title:", err);
  }
  return '自定义词书';
};

export const createCustomBook = async (
  userId: string, 
  title: string, 
  desc: string, 
  words: { english: string; phonetic: string; definition: string; exampleEn: string; exampleZh: string }[]
) => {
  const bookId = `custom_${Date.now()}`;
  const bookRef = doc(db, 'users', userId, 'custom_books', bookId);
  
  // Create book metadata document
  await setDoc(bookRef, {
    title,
    desc,
    wordCount: words.length,
    createdAt: serverTimestamp()
  });

  // Update user's last upload timestamp
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    lastUploadAt: Date.now()
  });
  
  // Batch write words in chunks of 400 (Firestore limits batches to 500 operations)
  const chunkSize = 400;
  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    
    chunk.forEach(word => {
      const docId = `${bookId}_${word.english.replace(/\W/g, '')}`;
      const wordRef = doc(db, 'users', userId, 'custom_books', bookId, 'words', docId);
      batch.set(wordRef, {
        english: word.english,
        phonetic: word.phonetic,
        definition: word.definition,
        exampleEn: word.exampleEn,
        exampleZh: word.exampleZh,
        book: bookId
      });
    });
    
    await batch.commit();
  }
  
  return bookId;
};

export const deleteCustomBook = async (userId: string, bookId: string) => {
  try {
    // Delete all word documents in the subcollection
    const wordsRef = collection(db, 'users', userId, 'custom_books', bookId, 'words');
    const wordsSnap = await getDocs(wordsRef);
    
    const chunkSize = 400;
    const docs = wordsSnap.docs;
    for (let i = 0; i < docs.length; i += chunkSize) {
      const chunk = docs.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach(docSnap => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    }
    
    // Then, delete the custom book metadata document
    const bookRef = doc(db, 'users', userId, 'custom_books', bookId);
    await deleteDoc(bookRef);
  } catch (err) {
    console.error("Failed to delete custom book:", err);
  }
};

export const fetchWordsForStudy = async (userId: string, book: string): Promise<Word[]> => {
  const seenIds = new Set<string>();
  const allWords: Word[] = [];
  
  if (book === 'CET4' || book === 'CET6') {
    // Map and deduplicate static words from the local file
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
  } else {
    // Fetch custom words for this custom book from Firestore
    try {
      const customWordsRef = collection(db, 'users', userId, 'custom_books', book, 'words');
      const customWordsSnap = await getDocs(customWordsRef);
      customWordsSnap.forEach(docSnap => {
        const data = docSnap.data();
        allWords.push({
          id: docSnap.id,
          english: data.english,
          phonetic: data.phonetic || '',
          definition: data.definition || '',
          exampleEn: data.exampleEn || '',
          exampleZh: data.exampleZh || '',
          book: book,
          familiarity: 0
        } as unknown as Word);
      });
    } catch (err) {
      console.error("Failed to fetch custom words:", err);
    }
  }
  
  // Fetch user progress
  const progressRef = collection(db, 'users', userId, 'progress');
  const progressSnap = await getDocs(progressRef);
  
  const progressMap = new Map<string, any>();
  progressSnap.forEach(doc => {
    progressMap.set(doc.id, doc.data());
  });
  
  // Merge static/custom dictionary with user progress
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
