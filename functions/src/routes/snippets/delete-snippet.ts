import { Request, Response } from 'express';
import { Database } from 'firebase-admin/database';
import { getRefPath } from '../../firebase-utils/get-ref-path';
import { contentRef } from '../../refs';
import { LanguageTypes } from '../../language-keys';
import { db } from '../../db';
import { routeValidator } from '../../shared-validation/route-validator';
import { deleteSnippetValidation } from './delete-snippet-validation';

interface DeleteSnippetParams {
  db: Database;
  language: LanguageTypes;
  contentId: string;
  snippetId: string;
}

export const deleteSnippetFromContent = async ({
  db,
  language,
  contentId,
  snippetId,
}: DeleteSnippetParams): Promise<void> => {
  try {
    const refPath = getRefPath({ language, ref: contentRef });

    await db.ref(`${refPath}/${contentId}/snippets/${snippetId}`).remove();
  } catch (error: any) {
    throw new Error(error?.message || 'Error deleting snippet from content');
  }
};

export const deleteSnippetRoute = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const isValid = await routeValidator(req, res, deleteSnippetValidation);

  if (!isValid) {
    return;
  }

  const { language, contentId, snippetId } = req.body;

  try {
    await deleteSnippetFromContent({
      db,
      language,
      contentId,
      snippetId,
    });
    res
      .status(200)
      .json({ success: true, message: 'Snippet deleted successfully' });
  } catch (error: any) {
    res.status(500).json({
      error: error?.message || `Error deleting snippet for ${language}`,
    });
  }
};
