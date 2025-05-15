import { v4 as uuidv4 } from 'uuid';
import { chatGPTTranslator } from '../../ai-utils';
import { getGoogleTranslate } from '../../translate-text/google-translate-route';

interface ReviewDataType {
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

export interface WordType {
  id: string;
  baseForm: string;
  definition: string;
  contexts: string[];
  reviewData?: ReviewDataType;
  surfaceForm: string;
  transliteration: string;
  phonetic: string;
  notes?: string;
}

export const getTranslationData = async ({
  isGoogle,
  context,
  contextSentence,
  word,
  language,
}) => {
  try {
    const translationDataRes = isGoogle
      ? await getGoogleTranslate({ word, language })
      : await chatGPTTranslator({
          word,
          context: contextSentence,
          language,
        });

    return {
      id: uuidv4(),
      contexts: [context],
      surfaceForm: word,
      ...translationDataRes,
      baseForm: translationDataRes?.baseForm || word,
      phonetic:
        translationDataRes?.phonetic || translationDataRes?.transliteration,
    };
  } catch (error) {
    console.log('## getTranslationData error?.message', error?.message);

    throw new Error(
      error?.message ||
        `Error trying to translate via ${isGoogle ? 'google' : 'AI'}`,
    );
  }
};
