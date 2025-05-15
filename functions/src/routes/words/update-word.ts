import { Request, Response } from 'express';
import { getDataSnapshot } from '../../firebase-utils/get-data-snapshot';
import { wordsRef } from '../../refs';
import { db } from '../../db';
import { getThisItemsViaValues } from '../../firebase-utils/get-snapshot-items-index';
import { routeValidator } from '../../shared-validation/route-validator';
import { updateWordValidation } from './update-word-validation';
import { LanguageTypes } from '../../language-keys';
import { updateDatabaseViaIndex } from '../../firebase-utils/update-database-via-index';
import { UpdateWordFieldType } from './add-word';

export interface UpdateWordLogicProps {
  id: string;
  language: LanguageTypes;
  fieldToUpdate: UpdateWordFieldType;
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

    const { keys, index } = getThisItemsViaValues({ arr: snapshotArr, id });

    if (index !== -1) {
      const indexViaValues = keys[index];
      const wordWithUpdatedFields = await updateDatabaseViaIndex({
        language,
        indexKey: indexViaValues,
        fieldToUpdate,
        ref: wordsRef,
      });
      return wordWithUpdatedFields;
    } else {
      throw new Error('Word not found in DB');
    }
  } catch (error) {
    throw new Error(error?.message || 'Error querying firebase DB (words)');
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
  const { id, language, fieldToUpdate } = req.body;

  try {
    const updatedWordData = await updateWord({
      language,
      id,
      fieldToUpdate,
    });

    res.status(200).json(updatedWordData);
  } catch (error) {
    res.status(400).json({ error: error?.message || 'Error updating word' });
  }
};
