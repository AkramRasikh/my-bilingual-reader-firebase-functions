export const chinese = 'chinese';
export const japanese = 'japanese';
export const arabic = 'arabic';
export const french = 'french';

export type LanguageTypes = 'japanese' | 'chinese' | 'arabic' | 'french';

export const googleLanguagesKey = {
  [japanese]: 'ja',
  [chinese]: 'zh-CN',
  [arabic]: 'ar',
  [french]: 'fr',
};
export const googleLanguagesVoicesKey = {
  [japanese]: 'ja-jp',
  [chinese]: 'cmn-Hans-CN',
  [arabic]: 'ar-EG',
  [french]: 'fr-FR',
};

type JapaneseVoice = 'ja-JP-Neural2-B' | 'ja-JP-Neural2-C' | 'ja-JP-Neural2-D';
type ChineseVoice =
  | 'cmn-CN-Wavenet-A'
  | 'cmn-CN-Wavenet-B'
  | 'cmn-CN-Wavenet-C'
  | 'cmn-CN-Wavenet-D';
type ArabicVoice =
  | 'ar-XA-Wavenet-A'
  | 'ar-XA-Wavenet-B'
  | 'ar-XA-Wavenet-C'
  | 'ar-XA-Wavenet-D';
type FrenchVoice =
  | 'fr-FR-Wavenet-A'
  | 'fr-FR-Wavenet-B'
  | 'fr-FR-Wavenet-C'
  | 'fr-FR-Wavenet-D';

export type VoiceType = JapaneseVoice | ChineseVoice | ArabicVoice | FrenchVoice;

// ja-JP
const japaneseVoices = [
  'ja-JP-Neural2-B',
  'ja-JP-Neural2-C',
  'ja-JP-Neural2-D',
];

// cmn-CN
const chineseVoices = [
  'cmn-CN-Wavenet-A',
  'cmn-CN-Wavenet-B',
  'cmn-CN-Wavenet-C',
  'cmn-CN-Wavenet-D',
];

// ar-XA
const arabicVoices = [
  'ar-XA-Wavenet-A',
  'ar-XA-Wavenet-B',
  'ar-XA-Wavenet-C',
  'ar-XA-Wavenet-D',
];

// fr-FR
const frenchVoices = [
  'fr-FR-Wavenet-A',
  'fr-FR-Wavenet-B',
  'fr-FR-Wavenet-C',
  'fr-FR-Wavenet-D',
];

export const languageVoices = {
  arabic: arabicVoices,
  chinese: chineseVoices,
  japanese: japaneseVoices,
  french: frenchVoices,
};
