import { Request, Response } from 'express';
import { routeValidator } from '../../shared-validation/route-validator';
import { deleteWordValidation } from './delete-word-validation';
import { wordsRef } from '../../refs';
import { removeItemFromSnapshot } from '../../firebase-utils/remove-item-from-snapshot';
import { deleteAdditionalWordContext } from './delete-additional-word-context';

export const deleteWordRoute = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const isValid = await routeValidator(req, res, deleteWordValidation);
  if (!isValid) {
    return;
  }
  const { id, language, additionalContext } = req.body;

  try {
    const deletedWordId = await removeItemFromSnapshot({
      id,
      ref: wordsRef,
      language,
    });

    const sentenceIds = await deleteAdditionalWordContext({
      language,
      additionalContext,
    });

    if (deletedWordId) {
      res.status(200).json({ id: deletedWordId, sentenceIds });
      return;
    }

    res.status(404).json({ error: 'Word not found' });
  } catch (error) {
    console.log('## Error deleting word:', error);
    res
      .status(500)
      .json({ error: error?.message || `Error deleting ${language} word` });
  }
};
