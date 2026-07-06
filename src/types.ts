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
  isPending?: boolean;
}

export type PetOutfit = 'none' | 'hat' | 'glasses' | 'headphone' | 'crown' | 'scarf' | 'bow' | 'halo' | 'detective' | 'chef' | 'magic_hat' | 'pirate' | 'flower' | 'sunflower' | 'straw_hat' | 'reindeer' | 'star_glasses' | 'sunglasses' | 'ninja' | 'devil_horns' | 'party_hat' | 'propeller';

export type TabType = 'study' | 'review' | 'library' | 'progress' | 'a4';

export interface UserStats {
  coins: number;
  wordsLearned: number;
  treesGrown: number;
}
