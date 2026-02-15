import { Database } from 'firebase-admin/database';
import { LanguageTypes } from '../language-keys';

/**
 * Save a sentence to Firebase in the structure:
 * language/sentence/sentenceId/sentenceData
 */
export const saveSentenceToContent = async ({
  db,
  language,
  sentenceData,
}: {
  db: Database;
  language: LanguageTypes;
  sentenceData: any;
}) => {
  try {
    const sentenceId = sentenceData.id;
    await db.ref(`${language}/sentence/${sentenceId}`).set(sentenceData);
    return sentenceData;
  } catch (error: any) {
    throw new Error(error?.message || 'Error saving sentence to content');
  }
};
