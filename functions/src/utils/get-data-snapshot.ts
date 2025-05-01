import { Database } from 'firebase-admin/database';
import { LangaugeAndContentTypes } from '../get-on-load-data';
import { getRefPath } from './get-ref-path';

interface getDataSnapshotProps extends LangaugeAndContentTypes {
  db: Database;
}

export const getDataSnapshot = async ({
  language,
  ref,
  db,
}: getDataSnapshotProps) => {
  try {
    const refPath = getRefPath({ language, ref });
    const refObj = db.ref(refPath);
    const snapshot = await refObj.once('value');
    const valSnapshotData = snapshot.val();
    return valSnapshotData;
  } catch (error) {
    throw new Error(`Error getting snapshot of ${ref} for ${language}`);
  }
};
