import { Request, Response } from 'express';
import { db } from '../../db';
// import { getContentIndexViaTitle } from '../../firebase-utils/get-content-index-via-title';
// import { getDataSnapshot } from '../../firebase-utils/get-data-snapshot';
import { getRefPath } from '../../firebase-utils/get-ref-path';
// import { getThisSentenceIndex } from '../../firebase-utils/get-sentence-via-keys';
import { contentRef } from '../../refs';
import { routeValidator } from '../../shared-validation/route-validator';
import { SentenceType } from '../content/types';
import { LangaugeAndContentTypes } from '../on-load-data';
import { updateSentenceValidation } from './update-sentence-validation';

interface SentenceFieldToUpdateType {
  targetLang?: SentenceType['targetLang'];
  notes?: SentenceType['notes'];
  baseLang?: SentenceType['baseLang'];
  reviewData?: SentenceType['reviewData'];
  removeReview?: boolean;
}

interface UpdateSentenceInContentTypes {
  id: string;
  indexKey: string;
  language: LangaugeAndContentTypes['language'];
  fieldToUpdate: SentenceFieldToUpdateType;
}

export const updateSentenceInContent = async ({
  id,
  language,
  fieldToUpdate,
  indexKey,
}: UpdateSentenceInContentTypes) => {
  const isRemoveReview = fieldToUpdate?.removeReview;

  const updatedFieldProperties = isRemoveReview
    ? {
        reviewData: null,
      }
    : fieldToUpdate;

  try {
    const refPath = getRefPath({ language, ref: contentRef });
    const thisContentPath = `${refPath}/${indexKey}/content`;
    const sentencesArrInContent = await db
      .ref(`${refPath}/${indexKey}/content`)
      .once('value');
    const sentencesArrInContentSnapshot = sentencesArrInContent.val();
    const sentenceIndex = sentencesArrInContentSnapshot.findIndex(
      (item: SentenceType) => {
        return item?.id === id;
      },
    );

    if (isFinite(sentenceIndex) && sentenceIndex !== -1) {
      const refObj = db.ref(thisContentPath).child(sentenceIndex);
      await refObj.update(updatedFieldProperties);
      return updatedFieldProperties;
    } else {
      throw new Error('Error cannot find sentence index');
    }
  } catch (error) {
    throw new Error(error || 'Error updating sentence via content');
  }
};

//
export const updateSentenceRoute = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const isValid = await routeValidator(req, res, updateSentenceValidation);

  console.log('## updateSentenceRoute 1');

  if (!isValid) {
    return;
  }

  const { id, indexKey, fieldToUpdate, language } = req.body;
  console.log('## updateSentenceRoute 2', {
    id,
    indexKey,
    fieldToUpdate,
    language,
  });

  try {
    const updatedField = await updateSentenceInContent({
      id,
      indexKey,
      fieldToUpdate,
      language,
    });
    res.status(200).json(updatedField);
  } catch (error: any) {
    res.status(500).json({
      error: error?.message || `Error adding snippet for ${language}`,
    });
  }
};
