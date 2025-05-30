import { Request, Response } from 'express';
import { db } from '../../db';
import { getContentIndexViaTitle } from '../../firebase-utils/get-content-index-via-title';
import { getDataSnapshot } from '../../firebase-utils/get-data-snapshot';
import { getRefPath } from '../../firebase-utils/get-ref-path';
import { getThisSentenceIndex } from '../../firebase-utils/get-sentence-via-keys';
import { contentRef } from '../../refs';
import { routeValidator } from '../../shared-validation/route-validator';
import { SentenceType } from '../content/types';
import { LangaugeAndContentTypes } from '../on-load-data';
import { updateSentenceValidation } from './update-sentence-validation';

interface SentenceFieldToUpdateType {
  targetLang?: SentenceType['targetLang'];
  notes?: SentenceType['notes'];
  baseLang?: SentenceType['baseLang'];
}

interface UpdateSentenceInContentTypes {
  id: string;
  title: string;
  language: LangaugeAndContentTypes['language'];
  fieldToUpdate: SentenceFieldToUpdateType;
}

const getPathToSentenceInContent = ({ contentKey, sentenceKey }) =>
  `${contentKey}/${contentRef}/${sentenceKey}`;

const updateSentenceInContent = async ({
  id,
  language,
  title,
  fieldToUpdate,
}: UpdateSentenceInContentTypes) => {
  try {
    const refPath = getRefPath({ language, ref: contentRef });

    const contentSnapshotArr = await getDataSnapshot({
      language,
      ref: contentRef,
      db,
    });

    const { index: contentKey, keys } = getContentIndexViaTitle({
      data: contentSnapshotArr,
      title,
    });

    if (isFinite(contentKey) && contentKey !== -1) {
      const key = keys[contentKey];
      const thisTopicContent = contentSnapshotArr[key].content;
      const { sentenceKeys, sentenceIndex } = getThisSentenceIndex({
        data: thisTopicContent,
        id,
      });

      if (isFinite(sentenceIndex) && sentenceIndex !== -1) {
        const sentenceKey = sentenceKeys[sentenceIndex];
        const refObj = db
          .ref(refPath)
          .child(getPathToSentenceInContent({ contentKey, sentenceKey }));
        await refObj.update(fieldToUpdate);
        return { updatedFields: fieldToUpdate, content: thisTopicContent };
      } else {
        throw new Error('Error cannot find sentence index');
      }
    } else {
      throw new Error('Error cannot find content index');
    }
  } catch (error) {
    throw new Error(error || 'Error updating sentence via content');
  }
};

export const updateSentenceRoute = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const isValid = await routeValidator(req, res, updateSentenceValidation);

  if (!isValid) {
    return;
  }

  const { id, title, fieldToUpdate, language } = req.body;

  try {
    const data = await updateSentenceInContent({
      id,
      title,
      fieldToUpdate,
      language,
    });
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({
      error: error?.message || `Error adding snippet for ${language}`,
    });
  }
};

export { updateSentenceInContent };
