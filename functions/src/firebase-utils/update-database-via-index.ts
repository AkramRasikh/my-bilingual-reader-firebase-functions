import { db } from '../db';
import { LanguageTypes } from '../language-keys';
import { RefTypes } from '../refs';
import { getRefPath } from './get-ref-path';

interface updateDatabaseViaIndexProps {
  language: LanguageTypes;
  indexKey: string;
  ref: RefTypes;
  fieldToUpdate: any; // come back to
}

export const updateDatabaseViaIndex = async ({
  language,
  indexKey,
  fieldToUpdate,
  ref,
}: updateDatabaseViaIndexProps) => {
  try {
    const refPath = getRefPath({ language, ref });
    const refObj = db.ref(refPath);
    const snapshotObj = refObj.child(indexKey);
    await snapshotObj.update(fieldToUpdate);
    return fieldToUpdate; // bad but fix
  } catch (error) {
    throw new Error('Error updating and returning field');
  }
};
