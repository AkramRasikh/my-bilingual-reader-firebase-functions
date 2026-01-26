export interface ReviewDataTypes {
  difficulty: number;
  due: Date;
  ease: number;
  elapsed_days: number;
  interval: number;
  lapses: number;
  last_review: Date;
  reps: number;
  scheduled_days: number;
  stability: number;
  state: number;
}

export interface LegacyReviewTypes {
  nextReview?: string;
  reviewHistory?: string[];
}

export interface ContentTypes {
  id: string;
  content: ContentTranscriptTypes[];
  createdAt: Date;
  hasAudio: boolean;
  title: string;
  url: string;
  origin?: string;
  nextReview?: Date;
  reviewHistory?: Date[];
  // snippets?: Snippet[];
}

export interface ContentTranscriptTypes {
  id: string;
  baseLang: string;
  targetLang: string;
  time: number;
  meaning?: string;
  reviewData?: ReviewDataTypes;
  sentenceStructure?: string;
  vocab?: Vocab[];
}

export interface Vocab {
  meaning: string;
  surfaceForm: string;
}

export interface Snippet {
  id: string;
  baseLang: string;
  targetLang: string;
  time: number;
  reviewData?: ReviewDataTypes;
  focusedText?: string;
  isContracted?: boolean;
  isPreSnippet?: boolean;
  suggestedFocusText?: string;
}
