import { LanguageTypes } from '../language-keys';
import { contentRef, RefTypes } from '../refs';
import { filterOutNestedNulls } from '../utils/filter-out-nested-nulls';
import { getDataSnapshot } from './get-data-snapshot';
import { db } from '../db';

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
    const realValues = filterOutNestedNulls(thisContentTypeSnapShot);
    if (ref === contentRef) {
      const filteredOutUndefinedNull = realValues.map(
        (thisLangaugeContentItem) => {
          return {
            ...thisLangaugeContentItem,
            content: filterOutNestedNulls(thisLangaugeContentItem.content),
          };
        },
      );
      return filteredOutUndefinedNull;
    } else {
      return realValues;
    }
  } catch (error) {
    throw new Error(
      error || `Failed to get contentType ${ref} for ${language}`,
    );
  }
};
