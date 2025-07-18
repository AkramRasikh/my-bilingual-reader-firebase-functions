import { db } from '../db';
import { LanguageTypes } from '../language-keys';
import { wordsRef } from '../refs';
import { getFirebaseContentType } from './get-firebase-content-type';
import { getRefPath } from './get-ref-path';

interface UpdateWordContextProps {
  matchedWord?: string;
  wordId?: string;
  sentenceId: string;
  language: LanguageTypes;
}

const updateWordContext = async ({
  matchedWord,
  wordId,
  sentenceId,
  language,
}: UpdateWordContextProps) => {
  const snapshotArr = await getFirebaseContentType({
    ref: wordsRef,
    language,
  });

  const index = snapshotArr.findIndex(
    (i) => i.baseForm === matchedWord || i.id === wordId,
  );

  if (index !== -1) {
    const wordData = snapshotArr[index];
    if (wordData.contexts.includes(sentenceId)) {
      console.log(
        `## ${wordData.baseForm} already has context for ${sentenceId}`,
      );
      return wordData;
    }

    const refPathWithIndex = `${getRefPath({
      ref: wordsRef,
      language,
    })}/${index}`;
    const refObj = db.ref(refPathWithIndex);
    const newContexts = [...wordData.contexts, sentenceId];
    await refObj.update({ contexts: newContexts });
    return {
      ...wordData,
      contexts: newContexts,
    };
  } else {
    throw new Error(`Couldn't find baseForm matching ${matchedWord || wordId}`);
  }
};

export { updateWordContext };
