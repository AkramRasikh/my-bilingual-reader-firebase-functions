import { Database } from 'firebase-admin/database';

import { getRefPath } from './get-ref-path';
import { LangaugeAndContentTypes } from '../routes/on-load-data';

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
