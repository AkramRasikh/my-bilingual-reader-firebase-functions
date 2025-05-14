import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { filterOutNestedNulls } from '../../utils/filter-out-nested-nulls';
import { db } from '../../db';
import { wordsRef } from '../../refs';
import { getRefPath } from '../../firebase-utils/get-ref-path';
import { getDataSnapshot } from '../../firebase-utils/get-data-snapshot';
import { chatGPTTranslator } from '../../ai-utils';
import { LangaugeAndContentTypes } from '../../on-load-data';
import { getGoogleTranslate } from '../../translate-text/google-translate-route';
import { routeValidator } from '../../shared-validation/route-validator';
import { addWordValidation } from './add-word-validation';

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
interface AddWordLogicType {
  word: string;
  language: LangaugeAndContentTypes['language'];
  context: string;
  contextSentence: string;
  isGoogle?: boolean;
  reviewData?: any;
  meaning?: string;
}

const getTranslationData = async ({
  isGoogle,
  context,
  contextSentence,
  word,
  language,
}) => {
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
};

const addWordLogic = async ({
  word,
  language,
  context,
  contextSentence,
  isGoogle,
  reviewData,
  meaning,
}: AddWordLogicType) => {
  try {
    const refPath = getRefPath({
      language,
      ref: wordsRef,
    });
    const wordSnapShotArr =
      (await getDataSnapshot({
        language,
        ref: wordsRef,
        db,
      })) || [];

    const isDuplicate = wordSnapShotArr.some(
      (item: WordType) => item?.baseForm === word || item?.surfaceForm === word,
    );

    if (!isDuplicate) {
      const wordData = await getTranslationData({
        word,
        language,
        context,
        contextSentence,
        isGoogle,
      });
      const cleanedArray = filterOutNestedNulls(wordSnapShotArr);
      const wordDataWithBreakdownDefinition = {
        ...wordData,
        definition: meaning
          ? `${meaning}; ${wordData.definition}`
          : wordData.definition,
        reviewData,
      };
      await db.ref(refPath).set([
        ...cleanedArray,
        {
          ...wordDataWithBreakdownDefinition,
        },
      ]);
      return wordDataWithBreakdownDefinition;
    } else {
      throw new Error(`${word} already exists in ${language} word back`);
    }
  } catch (error) {
    throw new Error(error || 'Error trying to add word into DB');
  }
};

export const addWordRoute = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const isValid = await routeValidator(req, res, addWordValidation);
  if (!isValid) {
    return;
  }
  const {
    word,
    language,
    context,
    contextSentence,
    isGoogle,
    reviewData,
    meaning,
  } = req.body;

  try {
    const addedWordData = await addWordLogic({
      word,
      language,
      context,
      contextSentence,
      isGoogle,
      reviewData,
      meaning,
    });
    res.status(200).json({
      message: `Successfully added word ${addedWordData.baseForm} added`,
      word: addedWordData,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ error: error?.message || `Error adding ${word} in ${language}` });
  }
};
