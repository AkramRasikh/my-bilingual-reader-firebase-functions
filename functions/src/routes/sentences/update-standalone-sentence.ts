import { Request, Response } from 'express';
import { db } from '../../db';
import { sentencesRef } from '../../refs';
import { routeValidator } from '../../shared-validation/route-validator';
import { deleteSentenceFromContent } from './delete-sentence';
import { updateStandaloneSentenceValidation } from './update-standalone-sentence-validation';

const UPDATABLE_FIELDS = [
  'targetLang',
  'baseLang',
  'notes',
  'sentenceStructure',
  'meaning',
  'vocab',
  'reviewData',
] as const;

type UpdatableField = (typeof UPDATABLE_FIELDS)[number];

interface StandaloneSentenceUpdate {
  targetLang?: string;
  baseLang?: string;
  notes?: string;
  sentenceStructure?: string;
  meaning?: string;
  vocab?: { surfaceForm: string; meaning: string }[];
  reviewData?: Record<string, unknown>;
  removeReview?: boolean;
}

const sentencePath = (language: string, id: string) =>
  `${language}/${sentencesRef}/${id}`;

export const fieldsToWrite = (fieldToUpdate: StandaloneSentenceUpdate) => {
  if (fieldToUpdate?.removeReview) {
    return { reviewData: null };
  }

  const update: Partial<Record<UpdatableField, unknown>> = {};
  for (const key of UPDATABLE_FIELDS) {
    if (fieldToUpdate?.[key] !== undefined) {
      update[key] = fieldToUpdate[key];
    }
  }
  return update;
};

export const updateStandaloneSentenceRoute = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const isValid = await routeValidator(
    req,
    res,
    updateStandaloneSentenceValidation,
  );
  if (!isValid) {
    return;
  }

  const { id, language, fieldToUpdate, delete: shouldDelete } = req.body;

  try {
    const sentenceRef = db.ref(sentencePath(language, id));
    const snapshot = await sentenceRef.once('value');
    if (!snapshot.exists()) {
      res.status(404).json({ error: 'Sentence not found' });
      return;
    }

    if (shouldDelete === true) {
      await deleteSentenceFromContent({ language, sentenceId: id });
      res.status(200).json({
        message: 'Sentence deleted successfully.',
        id,
      });
      return;
    }

    const written = fieldsToWrite(fieldToUpdate);
    await sentenceRef.update(written);
    res.status(200).json(written);
  } catch (error: unknown) {
    console.log('## /update-standalone-sentence error', error);
    const message =
      error instanceof Error
        ? error.message
        : `Error updating standalone sentence for ${language}`;
    res.status(500).json({ error: message });
  }
};
