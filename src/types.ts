export type WordFamiliarity = 0 | 1 | 2 | 3; // 0: new, 1: vague, 2: know, 3: mastered

export interface WordProgress {
  familiarity: number;
  reviewLevel: number;
  nextReviewTime: number;
  lastReviewedAt: number;
}

export interface Word {
  id: string;
  english: string;
  phonetic: string;
  definition: string;
  exampleEn: string;
  exampleZh: string;
  familiarity: WordFamiliarity;
  progress?: WordProgress;
  book: string;
}

export type PetOutfit = 'none' | 'hat' | 'glasses' | 'headphone' | 'crown' | 'scarf' | 'bow' | 'halo';

export type TabType = 'study' | 'review' | 'library' | 'progress' | 'a4';

export interface UserStats {
  coins: number;
  wordsLearned: number;
  treesGrown: number;
}
