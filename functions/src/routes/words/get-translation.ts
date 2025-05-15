import { v4 as uuidv4 } from 'uuid';
import { deepSeekTranslator } from '../../ai-utils';
import { getGoogleTranslate } from '../translate-text/google-translate-route';
import { ReviewDataType } from '../../types/shared-types';
import { AddWordType } from './add-word';

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

interface getTranslationDataProps {
  isGoogle: AddWordType['isGoogle'];
  context: AddWordType['context'];
  contextSentence: AddWordType['contextSentence'];
  word: AddWordType['word'];
  language: AddWordType['language'];
}

export const getTranslationData = async ({
  isGoogle,
  context,
  contextSentence,
  word,
  language,
}: getTranslationDataProps) => {
  try {
    const translationDataRes = isGoogle
      ? await getGoogleTranslate({ word, language })
      : await deepSeekTranslator({
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
    throw new Error(
      error?.message ||
        `Error trying to translate via ${isGoogle ? 'google' : 'AI'}`,
    );
  }
};
