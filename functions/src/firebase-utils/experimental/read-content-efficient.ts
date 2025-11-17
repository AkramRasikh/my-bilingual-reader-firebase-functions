import { Database } from 'firebase-admin/database';

interface getContentRangeProps {
  language: string;
  db: Database;
  contentIndex: number; // the target index
  range?: number; // optional, default ±5
}

/**
 * Fetches a subset of content items around a specific index.
 * Example: contentIndex ± range
 */
export const getContentRange = async ({
  language,
  db,
  contentIndex,
  range = 4,
}: getContentRangeProps) => {
  try {
    const refPath = `${language}/content`;
    const refObj = db.ref(refPath);

    const start = Math.max(contentIndex - range, 0); // ensure >= 0
    const end = contentIndex + range;

    // Firebase array indices are string keys ("0", "1", ...)
    const snapshot = await refObj
      .orderByKey()
      .startAt(start.toString())
      .endAt(end.toString())
      .once('value');

    const data = snapshot.val();
    return data; // object with keys as indices
  } catch (error) {
    throw new Error(
      `Error getting content range for ${language} around index ${contentIndex}`,
    );
  }
};
