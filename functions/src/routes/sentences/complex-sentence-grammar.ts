export const GRAMMAR_CATEGORIES = [
  'mood',
  'tenseAndAspect',
  'conditionals',
  'clauseEmbedding',
  'logicalRelations',
  'voice',
  'reportedSpeech',
] as const;

export type GrammarCategory = (typeof GRAMMAR_CATEGORIES)[number];

export type GrammarSetting = 'auto' | true | false;

export const SELECTION_MODE = 'auto';
export const DIFFICULTY = 'advanced';
export const ROMAJI_MODE = 'auto';

export const grammarFeatures: Record<GrammarCategory, { instruction: string }> =
  {
    mood: {
      instruction:
        'Mood and modality in the target language’s own system: subjunctive or other moods where they exist, indicative and imperative contrasts, and expressions of possibility, necessity, obligation, permission, or certainty.',
    },
    tenseAndAspect: {
      instruction:
        'Tense and aspect: past, present, and future reference, perfect and progressive forms where they exist, and the time relation between clauses.',
    },
    conditionals: {
      instruction:
        'Conditionals and counterfactuals: real conditions, hypothetical conditions, and counterfactual or mixed conditionals only where they are natural in the target language.',
    },
    clauseEmbedding: {
      instruction:
        'Clause structure and embedding: relative clauses, complement clauses, adverbial clauses, and non-finite forms where the target language uses them.',
    },
    logicalRelations: {
      instruction:
        'Logical relations: cause, concession, contrast, purpose, result, sequence, or inference, chosen because they fit the sentence.',
    },
    voice: {
      instruction:
        'Voice and argument structure: active and passive, causative, reflexive, or reciprocal patterns, including argument omission or promotion where that language uses them.',
    },
    reportedSpeech: {
      instruction:
        'Reported speech and perspective: indirect statements, reported questions, and the person, tense, deixis, or modality changes the target language actually requires.',
    },
  };

export const DEFAULT_GRAMMAR_CONFIG: Record<GrammarCategory, 'auto'> = {
  mood: 'auto',
  tenseAndAspect: 'auto',
  conditionals: 'auto',
  clauseEmbedding: 'auto',
  logicalRelations: 'auto',
  voice: 'auto',
  reportedSpeech: 'auto',
};

export const resolveGrammarConfig = (
  config?: Partial<Record<GrammarCategory, GrammarSetting>> | null,
): Record<GrammarCategory, GrammarSetting> => {
  const resolved: Record<GrammarCategory, GrammarSetting> = {
    ...DEFAULT_GRAMMAR_CONFIG,
  };

  if (!config) {
    return resolved;
  }

  for (const category of GRAMMAR_CATEGORIES) {
    if (config[category] !== undefined) {
      resolved[category] = config[category];
    }
  }

  return resolved;
};

export const isGrammarSetting = (value: unknown): value is GrammarSetting =>
  value === 'auto' || value === true || value === false;
