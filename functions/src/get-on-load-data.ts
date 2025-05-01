import { Database } from 'firebase-admin/database';
import { LanguageTypes } from './language-keys';
import { contentRef, RefTypes } from './refs';
import { db } from './text-to-speech';

export interface LangaugeAndContentTypes {
  language: LanguageTypes;
  ref: RefTypes;
}

interface GetContentTypeSnapshotProps extends LangaugeAndContentTypes {
  db: Database;
}

const filterOutNestedNulls = (arr: any[]) =>
  arr?.filter((item) => item !== null || item !== undefined);

const getRefPath = ({ language, ref }: LangaugeAndContentTypes) =>
  `${language}/${ref}`;

const getContentTypeSnapshot = async ({
  language,
  ref,
  db,
}: GetContentTypeSnapshotProps) => {
  try {
    const refPath = getRefPath({ language, ref });
    const refObj = db.ref(refPath);
    const snapshot = await refObj.once('value');
    const valSnapshotData = snapshot.val();
    return valSnapshotData;
  } catch (error) {
    throw new Error(`Error getting snapshot of ${ref} for ${language}`);
  }
};

export const getFirebaseContentType = async ({
  language,
  ref,
}: LangaugeAndContentTypes) => {
  try {
    const thisContentTypeSnapShot = await getContentTypeSnapshot({
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
