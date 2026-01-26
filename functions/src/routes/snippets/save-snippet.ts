import { Request, Response } from 'express';
import { Database } from 'firebase-admin/database';
import { Snippet } from '../../types/shared-types';
import { getRefPath } from '../../firebase-utils/get-ref-path';
import { contentRef } from '../../refs';
import { LanguageTypes } from '../../language-keys';
import { db } from '../../db';
import { routeValidator } from '../../shared-validation/route-validator';
import { saveSnippetValidation } from './save-snippet-validation';

interface SaveSnippetParams {
  db: Database;
  language: LanguageTypes;
  contentId: string;
  snippetData: Snippet;
}

export const saveSnippetToContent = async ({
  db,
  language,
  contentId,
  snippetData,
}: SaveSnippetParams): Promise<Snippet> => {
  try {
    const snippetId = snippetData.id;
    const refPath = getRefPath({ language, ref: contentRef });

    // Just save the snippet directly - Firebase will create the path if it doesn't exist
    await db
      .ref(`${refPath}/${contentId}/snippets/${snippetId}`)
      .set(snippetData);

    return snippetData;
  } catch (error: any) {
    throw new Error(error?.message || 'Error saving snippet to content');
  }
};

export const saveSnippetRoute = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const isValid = await routeValidator(req, res, saveSnippetValidation);

  if (!isValid) {
    return;
  }

  const { language, contentId, snippetData } = req.body;

  try {
    const savedSnippet = await saveSnippetToContent({
      db,
      language,
      contentId,
      snippetData,
    });
    res.status(200).json(savedSnippet);
  } catch (error: any) {
    res.status(500).json({
      error: error?.message || `Error saving snippet for ${language}`,
    });
  }
};
