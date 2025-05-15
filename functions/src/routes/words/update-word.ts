import { Request, Response } from 'express';
import { getDataSnapshot } from '../../firebase-utils/get-data-snapshot';
import { wordsRef } from '../../refs';
import { db } from '../../db';
import {
  getThisItemsIndex,
  getThisItemsViaValues,
} from '../../firebase-utils/get-snapshot-items-index';
import { routeValidator } from '../../shared-validation/route-validator';
import { updateWordValidation } from './update-word-validation';
import { LanguageTypes } from '../../language-keys';
import { updateDatabaseViaIndex } from '../../firebase-utils/update-database-via-index';

export interface UpdateWordLogicProps {
  id: string;
  language: LanguageTypes;
  fieldToUpdate: any;
}

const updateWord = async ({
  id,
  language,
  fieldToUpdate,
}: UpdateWordLogicProps) => {
  try {
    const snapshotArr = await getDataSnapshot({
      language,
      ref: wordsRef,
      db,
    });

    const indexKey = getThisItemsIndex({ arr: snapshotArr, id });

    if (indexKey >= 0 && isFinite(indexKey)) {
      await updateDatabaseViaIndex({
        language,
        indexKey: indexKey.toString(),
        fieldToUpdate,
        ref: wordsRef,
      });
      return fieldToUpdate;
    }

    const { keys, index } = getThisItemsViaValues({ arr: snapshotArr, id });

    if (index !== -1) {
      const indexViaValues = keys[index];
      await updateDatabaseViaIndex({
        language,
        indexKey: indexViaValues,
        fieldToUpdate,
        ref: wordsRef,
      });
      return fieldToUpdate;
    } else {
      throw new Error('Word not found in DB');
    }
  } catch (error) {
    throw new Error('Error querying firebase DB (words)');
  }
};

export const updateWordRoute = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const isValid = await routeValidator(req, res, updateWordValidation);
  if (!isValid) {
    return;
  }
  const { wordId, language, fieldToUpdate } = req.body;

  try {
    const fieldToUpdateRes = await updateWord({
      language,
      id: wordId,
      fieldToUpdate,
    });
    if (fieldToUpdateRes) {
      res.status(200).json(fieldToUpdateRes);
    } else {
      res.status(400).json({ message: 'Word not found' });
    }
  } catch (error) {
    res.status(400).json({ error: error?.message || 'Error updating word' });
  }
};
