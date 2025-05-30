import { Request, Response } from 'express';
import { db } from '../../db';
import { getRefPath } from '../../firebase-utils/get-ref-path';
import { sentencesRef } from '../../refs';
import { routeValidator } from '../../shared-validation/route-validator';
import { sharedUpdateSentenceValidation } from './shared-validation';

const updateAdhocSentence = async ({ id, language, fieldToUpdate }) => {
  try {
    const refPath = getRefPath({ language, ref: sentencesRef });
    const refObj = db.ref(refPath);
    const snapshot = await refObj.once('value');
    const data = snapshot.val();

    const values = Object.values(data);
    const keys = Object.keys(data);
    const thisSentenceIndex = values.findIndex(
      (sentenceData: any) => sentenceData?.id === id,
    );

    if (thisSentenceIndex !== -1) {
      const key = keys[thisSentenceIndex];
      // Firebase paths should be strings
      const objectRef = refObj.child(key);
      await objectRef.update(fieldToUpdate);
      console.log('## updateAdhocSentence Data successfully updated!', {
        id,
        fieldToUpdate,
      });
      return fieldToUpdate;
    } else {
      console.log('## updateAdhocSentence Object not found');
      return false;
    }
  } catch (error) {
    console.error('## updateAdhocSentence error:', error);
  }
};

export const updateAdhocSentenceRoute = async (req: Request, res: Response) => {
  const isValid = await routeValidator(
    req,
    res,
    sharedUpdateSentenceValidation,
  );

  if (!isValid) {
    return;
  }

  const { id, fieldToUpdate, language } = req.body;

  try {
    const fieldToUpdateRes = await updateAdhocSentence({
      id,
      fieldToUpdate,
      language,
    });
    if (fieldToUpdateRes) {
      res.status(200).json(fieldToUpdateRes);
    } else {
      res.status(400).json({ message: 'Not found' });
    }
  } catch (error) {
    res.status(400).json();
    console.log('## /update-adhoc-sentence Err', { error });
  }
};
