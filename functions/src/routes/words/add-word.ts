import { Request, Response } from 'express';
import { filterOutNestedNulls } from '../../utils/filter-out-nested-nulls';
import { db } from '../../db';
import { wordsRef } from '../../refs';
import { getRefPath } from '../../firebase-utils/get-ref-path';
import { getDataSnapshot } from '../../firebase-utils/get-data-snapshot';
import { LangaugeAndContentTypes } from '../on-load-data';
import { routeValidator } from '../../shared-validation/route-validator';
import { addWordValidation } from './add-word-validation';
import { getTranslationData } from './get-translation';
import { ReviewDataType } from '../../types/shared-types';

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

export interface AddWordType {
  word: string;
  language: LangaugeAndContentTypes['language'];
  context: string;
  contextSentence: string;
  isGoogle?: boolean;
  reviewData?: any;
  meaning?: string;
}

export interface UpdateWordFieldType {
  baseForm?: string;
  definition?: string;
  contexts?: string[];
  reviewData?: ReviewDataType;
  surfaceForm?: string;
  transliteration?: string;
  phonetic?: string;
  notes?: string;
}

const addWord = async ({
  word,
  language,
  context,
  contextSentence,
  isGoogle,
  reviewData,
  meaning,
}: AddWordType) => {
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
      return false;
    }
  } catch (error) {
    throw new Error(error?.message || 'Error trying to add word into DB');
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
    const wordData = await addWord({
      word,
      language,
      context,
      contextSentence,
      isGoogle,
      reviewData,
      meaning,
    });
    if (!wordData) {
      res.status(409);
      return;
    }

    res.status(200).json({
      word: wordData,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ error: error?.message || `Error adding ${word} in ${language}` });
  }
};
