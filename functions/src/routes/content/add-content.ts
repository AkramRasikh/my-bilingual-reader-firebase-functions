import { Request, Response } from 'express';
import { contentRef } from '../../refs';

import { db } from '../../db';

import { getFirebaseContentType } from '../../firebase-utils/get-firebase-content-type';
import { getRefPath } from '../../firebase-utils/get-ref-path';

const addContentToDB = async ({ language, content }) => {
  try {
    const refPath = getRefPath({
      language,
      ref: contentRef,
    });
    const contentSnapShotArr =
      (await getFirebaseContentType({
        language,
        ref: contentRef,
      })) || [];

    const duplicateContentTitle = contentSnapShotArr.some(
      (item) => item.title === content.title,
    );

    if (duplicateContentTitle) {
      console.log('## Not adding content duplicate', content.title);
    }

    await db.ref(refPath).set([...contentSnapShotArr, content]);
    console.log('## content sentences added');

    return true;
  } catch (error) {
    console.log('## addContentToDB error', error);
    throw new Error('Error trying to add content to DB');
  }
};

export const addContentRoute = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { content, language } = req.body;
  if (!content || !language) {
    return;
  }

  try {
    const contentResBool = await addContentToDB({ content, language });
    if (contentResBool) {
      res.status(200).json();
      return;
    } else {
      res.status(404).send();
    }
  } catch (error) {
    res.status(400).json({ message: error?.message || 'Error adding content' });
  }
};
