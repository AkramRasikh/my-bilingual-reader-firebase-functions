import { Request, Response } from 'express';
import { routeValidator } from '../../shared-validation/route-validator';
import { deleteWordValidation } from './delete-word-validation';
import { wordsRef } from '../../refs';
import { removeItemFromSnapshot } from '../../firebase-utils/remove-item-from-snapshot';

const deleteWordLogic = async ({ language, id }) => {
  try {
    const deletedWord = await removeItemFromSnapshot({
      id,
      ref: wordsRef,
      language,
    });

    const deletedWordBaseForm = deletedWord.baseForm;
    return deletedWordBaseForm;
  } catch (error) {
    throw new Error(`Error deleting word for ${language}`);
  }
};

export const deleteWord = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const isValid = await routeValidator(req, res, deleteWordValidation);
  if (!isValid) {
    return;
  }
  const id = req.body.id;
  const language = req.body.language;

  try {
    const deletedWord = await deleteWordLogic({ language, id });
    res.status(200).json({ message: `${deletedWord} word deleted` });
  } catch (error) {
    res
      .status(500)
      .json({ error: error?.message || `Error deleting ${language} word` });
  }
};
