import { Request, Response } from 'express';
import { db } from '../../db';
import { deleteAssetFromCloudFlare } from '../../firebase-utils/upload-asset-to-cloudflare';
import { removeMultiItemFromSnapshot } from '../../firebase-utils/remove-item-from-snapshot';
import { wordsRef } from '../../refs';

const deleteContentToDB = async ({ language, id, title }) => {
  try {
    // delete content by id
    const ref = db.ref(`${language}/content/${id}`);
    await ref.remove();
    console.log(`## Deleted ${language}/content/${id}`);

    // get title and delete audio by title

    const audioToDelete = `${language}-audio/${title}.mp3`;
    console.log('## audio to delete: ', audioToDelete);

    await deleteAssetFromCloudFlare(audioToDelete);
    return true;
  } catch (error) {
    console.log('## deleteContentToDB error', error);
    throw new Error('Error trying to delete content to DB');
  }
};

export const deleteContentRoute = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id, title, language, wordIds } = req.body;

  // 1. Validate inputs
  if (!id || !title || !language) {
    res.status(400).json({
      message: 'Missing required fields: id, title, and language are required.',
    });
    return;
  }

  try {
    // 2. Delete content from DB (returns true/false)
    const deletedContentSuccess = await deleteContentToDB({
      id,
      title,
      language,
    });

    if (!deletedContentSuccess) {
      res.status(404).json({
        message: `Content not found: ${id}`,
      });
      return;
    }
    let deletedWordsIds;

    if (wordIds?.length > 0) {
      deletedWordsIds = await removeMultiItemFromSnapshot({
        ids: wordIds,
        ref: wordsRef,
        language,
      });
    }

    // 3. Delete Cloudflare audio (optional)
    await deleteAssetFromCloudFlare(`${language}-audio/${id}.mp3`);

    // 4. Respond OK
    res.status(200).json({
      message: 'Content deleted successfully.',
      id,
      deletedWordsIds,
    });
  } catch (error: any) {
    console.error('Delete content error:', error);
    res.status(500).json({
      message:
        error?.message || 'Internal server error while deleting content.',
    });
  }
};
