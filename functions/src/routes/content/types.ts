import { LegacyReviewTypes, ReviewDataTypes } from '../../types/shared-types';

type MediaOriginTypes = 'netflix' | 'youtube';

export interface SentenceType extends LegacyReviewTypes {
  id: string;
  baseLang: string;
  hasAudio: string;
  targetLang: string;
  notes?: string;
  time?: number;
  reviewData?: ReviewDataTypes;
}
export interface ContentType {
  title: string;
  content: SentenceType[];
  hasAudio?: boolean;
  isCore?: boolean;
  url?: string;
  interval: number;
  origin?: MediaOriginTypes;
}
