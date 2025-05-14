import { Request, Response } from 'express';
import { db } from '../../db';
import { getDataSnapshot } from '../../firebase-utils/get-data-snapshot';
import { getRefPath } from '../../firebase-utils/get-ref-path';
import { snippetsRef } from '../../refs';
import { deleteSnippetValidation } from './delete-snippet-validation';
import { routeValidator } from '../../shared-validation/route-validator';

const deleteSnippet = async ({ language, id }) => {
  try {
    const refPath = getRefPath({
      ref: snippetsRef,
      language,
    });
    const snippetSnapshot = await getDataSnapshot({
      language,
      ref: snippetsRef,
      db,
    });
    const updatedSnippetArr = snippetSnapshot.filter((item) => item.id !== id);
    await db.ref(refPath).set(updatedSnippetArr);
    return id;
  } catch (error) {
    throw new Error(`Error deleting snippet for ${language}`);
  }
};

export const deleteSnippetRoute = async (req: Request, res: Response) => {
  const isValid = await routeValidator(req, res, deleteSnippetValidation);
  if (!isValid) {
    return;
  }

  const { id, language } = req.body;

  try {
    const deletedSnippetId = await deleteSnippet({ language, id });
    res.status(200).json({ snippetId: deletedSnippetId });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Error deleting snippet' });
  }
};
