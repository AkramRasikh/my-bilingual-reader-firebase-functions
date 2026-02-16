import { LanguageTypes } from '../language-keys';
import { contentRef, RefTypes, sentencesRef } from '../refs';
import { filterOutNestedNulls } from '../utils/filter-out-nested-nulls';
import { getDataSnapshot } from './get-data-snapshot';
import { db } from '../db';
import { getRefPath } from './get-ref-path';

export interface LangaugeAndContentTypes {
  language: LanguageTypes;
  ref: RefTypes;
}

export const getFirebaseContentType = async ({
  language,
  ref,
}: LangaugeAndContentTypes) => {
  try {
    const thisContentTypeSnapShot = await getDataSnapshot({
      language,
      ref,
      db,
    });
    if (ref === contentRef || ref === sentencesRef) {
      const snapshot = await db
        .ref(getRefPath({ language, ref }))
        .once('value');
      if (!snapshot.exists()) {
        return [];
      }
      const refObj = snapshot.val();
      const refValuesArray = Object.values(refObj);
      return refValuesArray;
    }
    const realValues = filterOutNestedNulls(thisContentTypeSnapShot);
    return realValues;
  } catch (error) {
    throw new Error(
      error || `Failed to get contentType ${ref} for ${language}`,
    );
  }
};
