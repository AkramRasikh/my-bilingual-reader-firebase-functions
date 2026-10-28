import {
  DIFFICULTY,
  GRAMMAR_CATEGORIES,
  GrammarCategory,
  GrammarSetting,
  ROMAJI_MODE,
  SELECTION_MODE,
  grammarFeatures,
  resolveGrammarConfig,
} from './complex-sentence-grammar';

export interface ComplexSentenceWord {
  surfaceForm: string;
  baseForm: string;
  definition: string;
  localContext: string;
}

const settingMeaning = (setting: GrammarSetting) => {
  if (setting === true) {
    return 'Use this when it is natural in the target language. If it cannot be used naturally, write a natural sentence and say so in notes.';
  }
  if (setting === false) {
    return 'Avoid this where a natural sentence can do so.';
  }
  return 'Choose this only when it is among the most relevant structures for this language, these words, and their contexts.';
};

const isFrench = (language: string) => language.toLowerCase() === 'french';

const transliterationRules = (language: string) => {
  if (language.toLowerCase() === 'japanese') {
    return `Write the sentence in ordinary Japanese, with kanji and kana as appropriate.
Follow natural Japanese for particles, politeness, clause-final forms, and omitted subjects.
transliteration is standard Hepburn romanization of the complete sentence, including macrons for long vowels.
It must match the Japanese sentence exactly.
Do not write a separate spoken sentence and written sentence.`;
  }

  return `transliteration is a consistent romanization of the complete ${language} sentence.
It must match that sentence exactly. It is not a loose pronunciation spelling.`;
};

const vocabRules = (language: string) => {
  if (isFrench(language)) {
    return `vocab is an array of objects. Each object contains surfaceForm, the word or phrase as it appears in the sentence, and meaning, a brief explanation of that token in English.
Do not add a transliteration field to vocab items.`;
  }

  const system =
    language.toLowerCase() === 'japanese'
      ? 'Use Hepburn with macrons, the same system as the sentence transliteration.'
      : 'Use the same romanization system as the sentence transliteration.';

  return `vocab is an array of objects. Each object contains surfaceForm, the word or phrase as it appears in the sentence, meaning, a brief explanation of that token in English, and transliteration, the romanization of that surfaceForm only.
${system}
The vocab transliteration covers only that token, not the whole sentence.`;
};

const vocabExample = (language: string) =>
  isFrench(language)
    ? '{ "surfaceForm": "token as it appears in the sentence", "meaning": "brief English meaning" }'
    : '{ "surfaceForm": "token as it appears in the sentence", "meaning": "brief English meaning", "transliteration": "romanization of this token" }';

export const buildComplexSentencePrompt = ({
  language,
  words,
  config,
  notes,
}: {
  language: string;
  words: ComplexSentenceWord[];
  config?: Partial<Record<GrammarCategory, GrammarSetting>> | null;
  notes?: string;
}) => {
  const resolved = resolveGrammarConfig(config);
  const vocabulary = words
    .map(
      (word, index) => `${index + 1}. surfaceForm: ${JSON.stringify(word.surfaceForm)}
   baseForm: ${JSON.stringify(word.baseForm)}
   definition: ${JSON.stringify(word.definition)}
   localContext: ${JSON.stringify(word.localContext)}`,
    )
    .join('\n');

  const grammar = GRAMMAR_CATEGORIES.map(
    (category) => `${category}: ${resolved[category]}
${grammarFeatures[category].instruction}
${settingMeaning(resolved[category])}`,
  ).join('\n\n');

  const callerNote = notes?.trim()
    ? notes.trim()
    : 'None.';

  return `You are writing one sentence for a translation exercise.

## Task
Write exactly one natural sentence in ${language}.
Natural, correct ${language} comes before any grammatical target.
Difficulty: ${DIFFICULTY}
Selection mode: ${SELECTION_MODE}
Romaji: ${ROMAJI_MODE}

## Vocabulary
Use a coherent subset of the supplied items. Do not force every item into the sentence.
Preserve the intended meaning of each item you use.
You may adapt inflection, conjugation, particles, or grammatical form.
Do not invent vocabulary that was not supplied.
localContext is the existing sentence for that item. Use it only to keep the intended sense. Do not copy a context sentence as the new sentence.

${vocabulary}

## Caller note
${callerNote}

## Grammar
Apply each setting below. An omitted setting is auto: select the most relevant grammar for this language and these words.
Precedence: natural target-language usage, then explicit true or false settings, then automatic selection.

${grammar}

## Language and transliteration
${transliterationRules(language)}

## Response
Return only this JSON object. One sentence, not a list.
Include the sentence and its breakdown in the same object.
${vocabRules(language)}
sentenceStructure is a string of the sentence structure in the original word order, with inline English meanings, in the form: word (meaning) + word (meaning) + word (meaning).
meaning is a string giving a natural translation or explanation of the full sentence in English.
{
  "targetLang": "the sentence in ${language}",
  "baseLang": "natural English translation",
  "transliteration": "romanization of the complete target sentence",
  "notes": "optional; include only for a real limitation or nuance",
  "vocab": [
    ${vocabExample(language)}
  ],
  "sentenceStructure": "token (meaning) + token (meaning)",
  "meaning": "natural translation or explanation of the full sentence in English"
}
Do not add fields beyond these.`;
};
