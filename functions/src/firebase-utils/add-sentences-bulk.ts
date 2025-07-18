import { db } from '../db';
import { sentencesRef } from '../refs';
import { getFirebaseContentType } from './get-firebase-content-type';
import { getRefPath } from './get-ref-path';

const addSentencesBulk = async ({ language, sentencesBulk }) => {
  try {
    const refPath = getRefPath({
      language,
      ref: sentencesRef,
    });
    const sentencesSnapShotArr =
      (await getFirebaseContentType({
        language,
        ref: sentencesRef,
      })) || [];

    const sentencesId = sentencesBulk.map((item) => item.id);

    const duplicateIDs = sentencesSnapShotArr.filter((item) =>
      sentencesId.includes(item.id),
    );

    if (duplicateIDs?.length > 0) {
      console.log('## Not adding sentences ', duplicateIDs);
    }

    const sentencesToAdd = sentencesBulk.filter(
      (item) => !duplicateIDs.includes(item.id),
    );

    if (sentencesToAdd.length > 0) {
      await db.ref(refPath).set([...sentencesSnapShotArr, ...sentencesToAdd]);
      console.log('## bulk sentences added');
      return sentencesToAdd;
    }

    return true;
  } catch (error) {
    console.log('## addSentenceToDb error', error);
    throw new Error('Error trying to bulk add sentence to DB');
  }
};

export { addSentencesBulk };
