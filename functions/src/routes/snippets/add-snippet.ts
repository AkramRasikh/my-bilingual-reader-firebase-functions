import { Request, Response } from 'express';
import { getDataSnapshot } from '../../firebase-utils/get-data-snapshot';
import { snippetsRef } from '../../refs';
import { db } from '../../db';
import { LangaugeAndContentTypes } from '../../on-load-data';
import { getRefPath } from '../../firebase-utils/get-ref-path';
import { routeValidator } from '../../shared-validation/route-validator';
import { addSnippetValidation } from './add-snippet-validation';

interface SnippetType {
  id: string;
  sentenceId: string;
  duration: number;
  pointInAudio: number;
  topicName: string;
  url: string;
  targetLang?: string;
  isIsolated?: boolean;
}

interface AddSnippetLogicTypes {
  snippet: SnippetType;
  language: LangaugeAndContentTypes['language'];
}

const addSnippetLogic = async ({ language, snippet }: AddSnippetLogicTypes) => {
  try {
    const refPath = getRefPath({
      ref: snippetsRef,
      language,
    });

    const snapshotArr =
      (await getDataSnapshot({
        language,
        ref: snippetsRef,
        db,
      })) || [];

    const snippetId = snippet.id;
    const isDuplicate =
      snapshotArr.length !== 0 &&
      snapshotArr.some((item: SnippetType) => item.id === snippetId);

    if (!isDuplicate) {
      snapshotArr.push(snippet);
      await db.ref(refPath).set(snapshotArr);
      return snippet;
    } else {
      throw new Error(`Error snippet already exists ${language}`);
    }
  } catch (error) {
    throw new Error(`Error adding snippets for ${language}`);
  }
};

export const addSnippetRoute = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const isValid = await routeValidator(req, res, addSnippetValidation);
  if (!isValid) {
    return;
  }
  const { language, snippet } = req.body;

  try {
    const data = await addSnippetLogic({
      language,
      snippet,
    });
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({
      error: error?.message || `Error adding snippet for ${language}`,
    });
  }
};
