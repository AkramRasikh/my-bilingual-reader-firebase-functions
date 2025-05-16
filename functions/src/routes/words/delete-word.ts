import { Request, Response } from 'express';
import { routeValidator } from '../../shared-validation/route-validator';
import { deleteWordValidation } from './delete-word-validation';
import { wordsRef } from '../../refs';
import { removeItemFromSnapshot } from '../../firebase-utils/remove-item-from-snapshot';

export const deleteWordRoute = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const isValid = await routeValidator(req, res, deleteWordValidation);
  if (!isValid) {
    return;
  }
  const { id, language } = req.body;

  try {
    const deletedWordId = await removeItemFromSnapshot({
      id,
      ref: wordsRef,
      language,
    });

    res.status(200).json({ id: deletedWordId });
  } catch (error) {
    res
      .status(500)
      .json({ error: error?.message || `Error deleting ${language} word` });
  }
};
