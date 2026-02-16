import { LanguageTypes } from '../../shared-validation';
import { sentencesRef } from '../../refs';
import { deleteAssetFromCloudFlare } from '../../firebase-utils/upload-asset-to-cloudflare';
import { db } from '../../db';

export const deleteSentenceFromContent = async ({
  language,
  sentenceId,
}: {
  language: LanguageTypes;
  sentenceId: string;
}) => {
  try {
    await db.ref(`${language}/${sentencesRef}/${sentenceId}`).remove();
    await deleteAssetFromCloudFlare(`${language}-audio/${sentenceId}.mp3`);
    return sentenceId;
  } catch (error: any) {
    throw new Error(error?.message || 'Error deleting sentence from content');
  }
};
