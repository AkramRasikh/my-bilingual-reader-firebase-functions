import { db } from '../../db';
import { getDataSnapshot } from '../../firebase-utils/get-data-snapshot';
import {
  getThisItemsIndex,
  getThisItemsViaValues,
} from '../../firebase-utils/get-snapshot-items-index';
import { updateDatabaseViaIndex } from '../../firebase-utils/update-database-via-index';
import { wordsRef } from '../../refs';
import { UpdateWordLogicProps } from './update-word';

export const updateWordLogic = async ({
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
