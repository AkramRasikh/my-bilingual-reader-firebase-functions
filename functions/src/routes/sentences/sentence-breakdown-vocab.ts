/**
 * Per-token transliteration for the sentence breakdown's vocab items.
 * French gets none; the other study languages get a romanization of each
 * surfaceForm, shown under that token's meaning by the readers.
 */

const romanizationSystem = (language: string): string | null => {
  switch (language.toLowerCase()) {
    case 'japanese':
      return 'Use standard Hepburn romaji with macrons for long vowels (for example "kinō", "benkyō shite iru").';
    case 'chinese':
      return 'Use Hanyu Pinyin with tone marks written on the vowels (for example "wǒ yǐjīng kāishǐ"). Never use tone numbers. Write the syllables of one word together.';
    case 'arabic':
      return 'Use a simple, readable romanization that includes the short vowels, with plain Latin letters (for example "dhahabtu ilā al-maktaba"). Do not use tone numbers or IPA.';
    default:
      return null;
  }
};

export const hasVocabTransliteration = (language: string) =>
  romanizationSystem(language) !== null;

/** The vocab sentence of the breakdown prompt for this language. */
export const vocabPromptLine = (language: string): string => {
  const system = romanizationSystem(language);
  if (!system) {
    return 'vocab: An array of objects where each object contains: surfaceForm: The word or phrase as it appears in the sentence. meaning: A brief explanation of its meaning in English.';
  }
  return `vocab: An array of objects where each object contains: surfaceForm: The word or phrase as it appears in the sentence. meaning: A brief explanation of its meaning in English. transliteration: The romanization of that surfaceForm only, not the whole sentence. ${system}`;
};

type VocabItem = {
  surfaceForm: string;
  meaning: string;
  transliteration?: string;
};

/**
 * Keeps surfaceForm, meaning and (except for French) a non-blank
 * transliteration on each vocab item. A missing transliteration is dropped
 * rather than failing the breakdown.
 */
export const normalizeBreakdownVocab = (
  vocab: unknown,
  language: string,
): VocabItem[] | undefined => {
  if (!Array.isArray(vocab)) return undefined;
  const withTransliteration = hasVocabTransliteration(language);
  return vocab.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const { surfaceForm, meaning, transliteration } = item as Record<
      string,
      unknown
    >;
    if (typeof surfaceForm !== 'string' || !surfaceForm.trim()) return [];
    const normalized: VocabItem = {
      surfaceForm,
      meaning: typeof meaning === 'string' ? meaning : '',
    };
    if (
      withTransliteration &&
      typeof transliteration === 'string' &&
      transliteration.trim()
    ) {
      normalized.transliteration = transliteration.trim();
    }
    return [normalized];
  });
};
