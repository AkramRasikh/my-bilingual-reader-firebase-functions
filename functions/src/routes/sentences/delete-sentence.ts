import { LanguageTypes } from '../../shared-validation';
import { sentencesRef } from '../../refs';
import { db } from '../../db';
import { deleteAssetFromCloudFlare } from '../../firebase-utils/delete-asset-from-cloudflare';

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
