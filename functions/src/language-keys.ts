export const chinese = 'chinese';
export const japanese = 'japanese';
export const arabic = 'arabic';

export type LanguageTypes = 'japanese' | 'chinese' | 'arabic';

export const googleLanguagesKey = {
  [japanese]: 'ja',
  [chinese]: 'zh-CN',
  [arabic]: 'ar',
};
export const googleLanguagesVoicesKey = {
  [japanese]: 'ja-jp',
  [chinese]: 'cmn-Hans-CN',
  [arabic]: 'ar-EG',
};

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

export const languageVoices = {
  arabic: arabicVoices,
  chinese: chineseVoices,
  japanese: japaneseVoices,
};
