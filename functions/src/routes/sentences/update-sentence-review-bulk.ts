import { Request, Response } from 'express';
import { db } from '../../db';
import { getRefPath } from '../../firebase-utils/get-ref-path';
import { contentRef } from '../../refs';
import { routeValidator } from '../../shared-validation/route-validator';
import { SentenceType } from '../content/types';
import { LangaugeAndContentTypes } from '../on-load-data';
import { updateSentenceReviewBulkValidation } from './update-sentence-review-bulk-validation';

interface SentenceFieldToUpdateType {
  targetLang?: SentenceType['targetLang'];
  notes?: SentenceType['notes'];
  baseLang?: SentenceType['baseLang'];
  reviewData?: SentenceType['reviewData'];
  removeReview?: boolean;
}

interface UpdateSentenceInContentTypes {
  contentId: string;
  sentenceIds: string[];
  language: LangaugeAndContentTypes['language'];
  reviewData: SentenceFieldToUpdateType['reviewData'];
}

export const updateSentencesBulkReview = async ({
  sentenceIds,
  contentId,
  reviewData,
  language,
}: UpdateSentenceInContentTypes) => {
  try {
    const refPath = getRefPath({ language, ref: contentRef });
    const thisContentPath = `${refPath}/${contentId}/content`;

    // 1. Load all sentences
    const snapshot = await db.ref(thisContentPath).once('value');
    const sentences = snapshot.val();

    if (!Array.isArray(sentences)) {
      throw new Error('Content sentences array is not valid.');
    }

    // 2. For each sentenceId, find its index
    const updateObj: any = {};

    sentenceIds.forEach((id) => {
      const index = sentences.findIndex(
        (item: SentenceType) => item?.id === id,
      );

      if (index === -1) {
        throw new Error(`Cannot find sentence index for ID: ${id}`);
      }

      // 3. Build the multi-path update entry
      updateObj[`${thisContentPath}/${index}`] = {
        ...sentences[index],
        reviewData,
      };
    });

    // 4. Execute single atomic update
    await db.ref().update(updateObj);

    return { updatedSentenceIds: sentenceIds, reviewData };
  } catch (error) {
    throw new Error(error?.message || 'Error updating sentences via content');
  }
};

export const updateSentenceReviewBulkRoute = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const isValid = await routeValidator(
    req,
    res,
    updateSentenceReviewBulkValidation,
  );

  if (!isValid) {
    return;
  }

  const { sentenceIds, contentId, reviewData, language } = req.body;

  try {
    const updatedField = await updateSentencesBulkReview({
      sentenceIds,
      contentId,
      reviewData,
      language,
    });
    res.status(200).json(updatedField);
  } catch (error: any) {
    res.status(500).json({
      error: error?.message || `Error adding snippet for ${language}`,
    });
  }
};
